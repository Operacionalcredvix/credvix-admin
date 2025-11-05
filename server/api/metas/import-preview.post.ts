import { eventHandler, readBody } from 'h3'

export default eventHandler(async (event) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
    if (!supabaseUrl || !supabaseServiceKey) return { success: false, error: 'Configuração do Supabase ausente no servidor', data: null }

    const { createClient } = await import('@supabase/supabase-js')
    const admin = createClient(supabaseUrl, supabaseServiceKey)

    const authHeader = event.node.req.headers?.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader || ''
    if (!token) return { success: false, error: 'Token ausente', data: null }

    const { data: userData, error: userErr } = await admin.auth.getUser(token)
    if (userErr || !userData?.user) return { success: false, error: 'Usuário não autenticado', data: null }

    const body = await readBody(event) || {}
    const periodo = body.periodo || null
    const rows = Array.isArray(body.rows) ? body.rows : []
    if (!periodo) return { success: false, error: 'Parâmetro periodo ausente', data: null }
    if (!rows.length) return { success: false, error: 'Nenhuma linha para importar', data: null }

    // checa perfil do chamador
    const { data: perfilRow } = await admin.from('funcionarios').select('perfil_id').eq('user_id', userData.user.id).single()
    const perfilId = perfilRow?.perfil_id || null
    const { data: perfil } = await admin.from('perfis').select('id,nome').eq('id', perfilId).single()
    const nomePerfil = perfil?.nome || null
    const allowed = ['Master', 'Diretoria', 'Gerência']
    if (!allowed.includes(nomePerfil)) return { success: false, error: 'Permissão negada', data: null }

  // Preload lojas to map by name (case-insensitive) and prepare for fuzzy matching
  // also load `franquia` (código) so we can match by franchise code when present in the import file
  const { data: lojas } = await admin.from('lojas').select('id,nome,franquia')

    const normalize = (s: string) => String(s || '').normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim().toLowerCase()

    // Build token sets for lojas to compute simple token-overlap score
    const lojaMeta = (lojas || []).map((l: any) => {
      const name = String(l.nome || '')
      const norm = normalize(name)
      const tokens = norm.split(' ').filter(Boolean)
      return { id: l.id, name, norm, tokens, franquia: String(l.franquia || '') }
    })

    // map franquia code -> loja for direct matching (keys in uppercase trimmed)
    const franquiaMap = new Map((lojas || []).map((l: any) => [String(l.franquia || '').trim().toUpperCase(), { id: l.id, name: l.nome }]))

    // helper to return the first column value when header names vary
    const firstColumnValue = (rowObj: any) => {
      try {
        const keys = Object.keys(rowObj || {})
        if (!keys.length) return ''
        return String(rowObj[keys[0]] ?? '')
      } catch (e) { return '' }
    }

    // For efficiency, guess candidate ids by naive substring then refine by token-overlap
    const allLojaNames = rows.map((r: any) => String((r['LOJAS'] || r['Lojas'] || r['lojas'] || r['Loja'] || r['Nome Loja'] || r['nome_loja'] || firstColumnValue(r) || '')).trim())
  // try to detect which column in the file contains the franchise code (common headers like 'franquia')
  const headerKeys = Object.keys(rows[0] || {})
  const franquiaKey = headerKeys.find(k => /franquia|codigo.*franq|cod.*franq|franq/i.test(k.replace(/\s+/g, '')))
    const guessIds: any[] = []
    const possibleMatchesPerRow: any[] = []

    for (const ln of allLojaNames) {
      const normLn = normalize(ln)
      const tokensLn = normLn.split(' ').filter(Boolean)

      // naive substring matches first
      let candidates = lojaMeta.filter(lm => lm.norm.includes(normLn) || normLn.includes(lm.norm))

      // if none, use token overlap scoring
      if (!candidates.length) {
        const scored = lojaMeta.map(lm => {
          const common = lm.tokens.filter(t => tokensLn.includes(t)).length
          const score = tokensLn.length + lm.tokens.length === 0 ? 0 : (common * 2) / (tokensLn.length + lm.tokens.length)
          return { ...lm, score }
        }).filter(s => s.score > 0)
        scored.sort((a: any, b: any) => b.score - a.score)
        candidates = scored.slice(0, 5)
      }

      // map candidates into simplified shape
      const possible = candidates.map((c: any) => ({ id: c.id, name: c.name, score: (c.score || 1) }))
      possibleMatchesPerRow.push(possible)

      if (possible.length) guessIds.push(possible[0].id)
    }

    // also include exact normalized-name matches from the file to ensure we check existing metas by loja name
    for (const ln of allLojaNames) {
      const normLn = normalize(ln)
      const exact = lojaMeta.find(lm => lm.norm === normLn)
      if (exact && !guessIds.includes(exact.id)) guessIds.push(exact.id)
    }

    const uniqueIds = Array.from(new Set(guessIds)).filter(Boolean)
    let existingMetas: any[] = []
    if (uniqueIds.length) {
      const { data: em } = await admin.from('metas').select('*').in('loja_id', uniqueIds).eq('periodo', periodo)
      existingMetas = em || []
    }

    const parseNumber = (v: any) => {
      if (v === null || v === undefined || v === '') return 0
      const num = Number(String(v).replace(/[^0-9,.-]/g, '').replace(',', '.'))
      return Number.isNaN(num) ? 0 : num
    }

  const previewRows: any[] = []
  const errors: any[] = []
  // accumulate last non-total parsed rows to compute group sums when a total row appears
  let currentGroupRows: any[] = []

    for (const [i, r] of rows.entries()) {
      // try common header names first, then fallback to first column value
      const explicit = (r['LOJAS'] || r['Lojas'] || r['lojas'] || r['Loja'] || r['Nome Loja'] || r['nome_loja'] || '')
      const rawFirstCol = String(explicit || firstColumnValue(r) || '').trim()
      const lojaName = rawFirstCol
      const normFirstCol = normalize(rawFirstCol)

      // detect explicit 'total' rows (e.g., 'Total', 'TOTAL', 'Totais') by normalized text
      const isTotalRow = normFirstCol && (normFirstCol.includes(' total') || normFirstCol.startsWith('total') || normFirstCol === 'total' || normFirstCol.includes('totais') || /\btotal\b/.test(normFirstCol))

      if (isTotalRow) {
        // parse the reported totals from the total row
        const reported = {
          meta_cnc: parseNumber(r['CNC']),
          meta_card: parseNumber(r['CARD']),
          meta_card_beneficio: parseNumber(r['CARD BENEFICIO']),
          meta_fgts: parseNumber(r['FGTS / CLT']),
          meta_consignado: parseNumber(r['CONSIGNADO']),
          meta_bmg_med: parseNumber(r['BMGMED']),
          meta_seguro_familiar: parseNumber(r['SEGURO FAMILIAR']),
          orcados: parseNumber(r['QTD ORÇADOS'])
        }

        // compute group sum from accumulated group rows
        const groupSum = currentGroupRows.reduce((acc: any, g: any) => {
          acc.meta_cnc += g.parsed.meta_cnc || 0
          acc.meta_card += g.parsed.meta_card || 0
          acc.meta_card_beneficio += g.parsed.meta_card_beneficio || 0
          acc.meta_fgts += g.parsed.meta_fgts || 0
          acc.meta_consignado += g.parsed.meta_consignado || 0
          acc.meta_bmg_med += g.parsed.meta_bmg_med || 0
          acc.meta_seguro_familiar += g.parsed.meta_seguro_familiar || 0
          acc.orcados += g.parsed.orcados || 0
          return acc
        }, { meta_cnc: 0, meta_card: 0, meta_card_beneficio: 0, meta_fgts: 0, meta_consignado: 0, meta_bmg_med: 0, meta_seguro_familiar: 0, orcados: 0 })

        // compute diffs (reported - computed sum)
        const diffs: any = {}
        let anyDiff = false
        for (const k of Object.keys(groupSum)) {
          const d = (reported as any)[k] - (groupSum as any)[k]
          diffs[k] = d
          if (Math.abs(d) > 0.0001) anyDiff = true
        }

        previewRows.push({ rowIndex: i + 1, lojaName: rawFirstCol, isTotal: true, parsed: reported, groupSum, diffs, anyDiff })

        // reset group accumulator after a total
        currentGroupRows = []
        continue
      }
      // prefer explicit franquia code if present in the row
      const franquiaVal = (franquiaKey && r[franquiaKey] != null) ? String(r[franquiaKey]).trim() : String(r['FRANQUIA'] || r['franquia'] || r['franquia_codigo'] || r['CODIGO_FRANQUIA'] || r['CODIGO'] || '').trim()

      let possible = possibleMatchesPerRow[i] || []
      let best = possible && possible.length ? possible[0] : null
      let lojaId = best?.id || null
      let bestScore = best?.score || 0

      if (franquiaVal) {
        const matched = franquiaMap.get(String(franquiaVal).trim().toUpperCase())
        if (matched) {
          // override possible matches with the franquia match (high confidence)
          possible = [{ id: matched.id, name: matched.name, score: 1 }]
          best = possible[0]
          lojaId = best.id
          bestScore = 1
          // ensure we will preload existing metas for this loja
          if (!guessIds.includes(lojaId)) guessIds.push(lojaId)
        }
      }

      // if we don't have a confident match, report as not found but still provide candidates to the client
      if (!lojaId) {
        errors.push({ row: i + 1, reason: `Loja não encontrada: '${lojaName}'` })
        previewRows.push({ rowIndex: i + 1, lojaName, lojaId: null, parsed: null, existing: null, error: `Loja não encontrada`, possibleMatches: possible })
        continue
      }

      const parsed = {
        meta_cnc: parseNumber(r['CNC']),
        meta_card: parseNumber(r['CARD']),
        meta_card_beneficio: parseNumber(r['CARD BENEFICIO']),
        meta_fgts: parseNumber(r['FGTS / CLT']),
        meta_consignado: parseNumber(r['CONSIGNADO']),
        meta_bmg_med: parseNumber(r['BMGMED']),
        meta_seguro_familiar: parseNumber(r['SEGURO FAMILIAR']),
        orcados: parseNumber(r['QTD ORÇADOS'])
      }

      const existing = existingMetas.find(m => String(m.loja_id) === String(lojaId)) || null

      // include possibleMatches and score to allow frontend to show alternatives
      const previewEntry = { rowIndex: i + 1, lojaName, lojaId, parsed, existing, possibleMatches: possible, bestMatchScore: bestScore }
      previewRows.push(previewEntry)

      // add to current group so a following 'Total' row can compare sums
      currentGroupRows.push(previewEntry)
    }

    return { success: true, data: { previewRows, errors } }
  } catch (err: any) {
    console.error('[server/api/metas/import-preview] exception:', err)
    return { success: false, error: err?.message || 'Erro interno', data: null }
  }
})
