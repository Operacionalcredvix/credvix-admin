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

    const results: any[] = []
    const errors: any[] = []

    // Preload lojas to map by name (case-insensitive) for performance
    const { data: lojas } = await admin.from('lojas').select('id,nome')
    const lojasMap = (lojas || []).reduce((acc: any, l: any) => { acc[String(l.nome).toLowerCase()] = l.id; return acc }, {})

  // Prepare rows for upsert
  const toUpsert: any[] = []
    const firstColumnValue = (rowObj: any) => {
      try {
        const keys = Object.keys(rowObj || {})
        if (!keys.length) return ''
        return String(rowObj[keys[0]] ?? '')
      } catch (e) { return '' }
    }

    for (const [i, r] of rows.entries()) {
        // Prefer explicit LOJA_ID if provided by client (safer)
        const explicitLojaId = r['LOJA_ID'] || r['loja_id'] || r['Loja_Id'] || r['LOJAID'] || null
        let lojaId = explicitLojaId || null
        const explicitName = (r['LOJAS'] || r['Lojas'] || r['lojas'] || r['Loja'] || r['Nome Loja'] || r['nome_loja'] || '')
        const lojaName = String(explicitName || firstColumnValue(r) || '').trim()
        // if no explicit id, try mapping by name (case-insensitive)
        if (!lojaId) {
          lojaId = lojasMap[lojaName.toLowerCase()]
          if (!lojaId) {
            const found = (lojas || []).find((l: any) => String(l.nome).toLowerCase().includes(lojaName.toLowerCase()))
            lojaId = found?.id || null
          }
        }
      if (!lojaId) {
        errors.push({ row: i + 1, reason: `Loja não encontrada: '${lojaName}'` })
        continue
      }

      const parseNumber = (v: any) => {
        if (v === null || v === undefined || v === '') return 0
        const num = Number(String(v).replace(/[^0-9,.-]/g, '').replace(',', '.'))
        return Number.isNaN(num) ? 0 : num
      }

      const record: any = {
        loja_id: lojaId,
        periodo,
        meta_cnc: parseNumber(r['CNC']),
        meta_card: parseNumber(r['CARD']),
        meta_card_beneficio: parseNumber(r['CARD BENEFICIO']),
        meta_fgts: parseNumber(r['FGTS / CLT']),
        meta_consignado: parseNumber(r['CONSIGNADO']),
        meta_bmg_med: parseNumber(r['BMGMED']),
        meta_seguro_familiar: parseNumber(r['SEGURO FAMILIAR']),
        orçados: parseNumber(r['QTD ORÇADOS'])
      }

      toUpsert.push(record)
    }

    if (!toUpsert.length) return { success: false, error: 'Nenhuma linha válida para importar', data: { errors } }

    // Deduplicate by loja_id to avoid ON CONFLICT updating same row multiple times
    const dedupMap: Record<string, any> = {}
    for (const item of toUpsert) {
      dedupMap[`${item.loja_id}`] = item // last one wins
    }
    const deduped = Object.values(dedupMap)

    // Use upsert on unique constraint loja_id + periodo (assumes constraint exists)
    const { data: upserted, error: upsertErr } = await admin.from('metas').upsert(deduped, { onConflict: 'loja_id,periodo' }).select('*')
    if (upsertErr) {
      console.error('[server/api/metas/import] upsert error:', upsertErr)
      return { success: false, error: upsertErr.message || 'Erro ao importar metas', data: { errors, upsertErr } }
    }

    return { success: true, data: { insertedOrUpdated: upserted || [], errors } }
  } catch (err: any) {
    console.error('[server/api/metas/import] exception:', err)
    return { success: false, error: err?.message || 'Erro interno', data: null }
  }
})
