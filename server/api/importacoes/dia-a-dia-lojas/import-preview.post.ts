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
    const rows = Array.isArray(body.rows) ? body.rows : []
    if (!rows.length) return { success: false, error: 'Nenhuma linha para importar', data: null }

    // checa perfil do chamador
    const { data: perfilRow } = await admin.from('funcionarios').select('perfil_id').eq('user_id', userData.user.id).single()
    const perfilId = perfilRow?.perfil_id || null
    const { data: perfil } = await admin.from('perfis').select('id,nome').eq('id', perfilId).single()
    const nomePerfil = perfil?.nome || null
    const allowed = ['Master', 'Diretoria', 'Gerência', 'Backoffice']
    if (!allowed.includes(nomePerfil)) return { success: false, error: 'Permissão negada', data: null }

    // load lojas and funcionarios for matching
    const [{ data: lojas }, { data: funcionarios }, { data: perfis }] = await Promise.all([
      admin.from('lojas').select('id,nome,franquia'),
      admin.from('funcionarios').select('id,nome_completo,perfil_id'),
      admin.from('perfis').select('id,nome')
    ])

    const normalize = (s: string) => String(s || '').normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim().toLowerCase()

    const lojaMapByFranquia = new Map((lojas || []).map((l: any) => [String(l.franquia || '').trim().toUpperCase(), { id: l.id, name: l.nome }]))
    const lojaMapByName = new Map((lojas || []).map((l: any) => [normalize(l.nome), { id: l.id, name: l.nome }]))

    const perfilMap = new Map((perfis || []).map((p: any) => [p.id, p.nome]))
    const funcMeta = (funcionarios || []).map((f: any) => {
      const name = String(f.nome_completo || '')
      const norm = normalize(name)
      const tokens = norm.split(' ').filter(Boolean)
      const perfilNome = perfilMap.get(f.perfil_id) || ''
      return { id: f.id, name, norm, tokens, perfilNome }
    })

    const findBest = (nameRaw: string, perfilWanted: string) => {
      const norm = normalize(nameRaw)
      if (!norm) return { id: null, possible: [] }
      const exact = funcMeta.find((fm: any) => fm.perfilNome === perfilWanted && fm.norm === norm)
      if (exact) return { id: exact.id, possible: [{ id: exact.id, name: exact.name, score: 1 }] }
      const tokens = norm.split(' ').filter(Boolean)
      const scored = funcMeta.filter((fm: any) => fm.perfilNome === perfilWanted).map((fm: any) => {
        const common = fm.tokens.filter((t: any) => tokens.includes(t)).length
        const score = tokens.length + fm.tokens.length === 0 ? 0 : (common * 2) / (tokens.length + fm.tokens.length)
        return { ...fm, score }
      }).filter((s: any) => s.score > 0)
      scored.sort((a: any, b: any) => b.score - a.score)
      return { id: (scored[0] && scored[0].id) || null, possible: scored.slice(0,5).map((c: any) => ({ id: c.id, name: c.name, score: c.score })) }
    }

    const previewRows: any[] = []
    const errors: any[] = []

    for (const [i, r] of rows.entries()) {
      // try common keys: franquia, loja, nome_loja
      const franquiaRaw = String(r['franquia'] || r['FRANQUIA'] || r['Franquia'] || r['franq'] || '').trim()
      const lojaRaw = String(r['loja'] || r['nome_loja'] || r['Nome Loja'] || '').trim()
      const franquiaKey = String(franquiaRaw || '').trim().toUpperCase()
      const lojaByFranquia = lojaMapByFranquia.get(franquiaKey) || null
      const lojaByName = lojaMapByName.get(normalize(lojaRaw)) || null

      const loja = lojaByFranquia || lojaByName || null

      const rowErrors: string[] = []
      if (!loja) rowErrors.push(`Loja não encontrada para franquia/nome '${franquiaRaw || lojaRaw}'`)

      // optional: try to resolve consultor/supervisor if provided
      const consultorRaw = String(r['consultor'] || r['Consultor'] || '')
      const consultor = consultorRaw ? findBest(consultorRaw, 'Consultor') : { id: null, possible: [] }

      if (consultorRaw && !consultor.id) rowErrors.push(`Consultor '${consultorRaw}' não encontrado`)

      previewRows.push({
        rowNumber: i + 2,
        raw: r,
        franquia: franquiaRaw,
        lojaId: loja?.id || null,
        lojaName: loja?.name || null,
        consultorRaw,
        consultorId: consultor.id,
        possibleConsultores: consultor.possible,
        errors: rowErrors
      })

      if (rowErrors.length) errors.push({ row: i + 2, reasons: rowErrors })
    }

    return { success: true, data: { previewRows, errors } }
  } catch (err: any) {
    console.error('[server/api/importacoes/dia-a-dia-lojas/import-preview] exception:', err)
    return { success: false, error: err?.message || 'Erro interno', data: null }
  }
})
