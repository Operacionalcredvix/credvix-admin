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
    const tipo = body.tipo || null
    if (!tipo) return { success: false, error: 'Parâmetro tipo ausente', data: null }
    if (!rows.length) return { success: false, error: 'Nenhuma linha para importar', data: null }

    // checa perfil do chamador
    const { data: perfilRow } = await admin.from('funcionarios').select('perfil_id').eq('user_id', userData.user.id).single()
    const perfilId = perfilRow?.perfil_id || null
    const { data: perfil } = await admin.from('perfis').select('id,nome').eq('id', perfilId).single()
    const nomePerfil = perfil?.nome || null
    const allowed = ['Master', 'Diretoria', 'Gerência', 'Backoffice']
    if (!allowed.includes(nomePerfil)) return { success: false, error: 'Permissão negada', data: null }

    // load lojas and funcionarios
    const [{ data: lojas }, { data: funcionarios }] = await Promise.all([
      admin.from('lojas').select('id,nome,franquia'),
      admin.from('funcionarios').select('id,nome_completo,perfil_id')
    ])

    const normalize = (s: string) => String(s || '').normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim().toLowerCase()

    const parseQuantity = (v: any) => {
      if (v == null) return 0
      if (typeof v === 'number') return Number.isNaN(v) ? 0 : Math.trunc(v)
      const s = String(v || '')
      // Remove non digits, keep minus if any
      const digits = s.replace(/[^0-9\-]/g, '')
      return digits ? Number(digits) : 0
    }

    const parseDate = (v: any) => {
      if (!v && v !== 0) return null
      // If already a Date-like string or ISO, try Date
      const d = new Date(v)
      if (!isNaN(d.getTime())) return d.toISOString()
      // Try Excel serial number (days since 1899-12-30)
      const num = Number(v)
      if (!Number.isNaN(num)) {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30))
        const millis = excelEpoch.getTime() + Math.round(num * 24 * 60 * 60 * 1000)
        const dd = new Date(millis)
        if (!isNaN(dd.getTime())) return dd.toISOString()
      }
      return null
    }

    const lojaMapByFranquia = new Map((lojas || []).map((l: any) => [String(l.franquia || '').trim().toUpperCase(), { id: l.id, name: l.nome }]))

    // build funcionario maps per perfil name
    // load perfis names
    const { data: perfis } = await admin.from('perfis').select('id,nome')
    const perfilMap = new Map((perfis || []).map((p: any) => [p.id, p.nome]))

    const funcMeta = (funcionarios || []).map((f: any) => {
      const name = String(f.nome_completo || '')
      const norm = normalize(name)
      const tokens = norm.split(' ').filter(Boolean)
      const perfilNome = perfilMap.get(f.perfil_id) || ''
      return { id: f.id, name, norm, tokens, perfilNome }
    })

    // helper to find by name with exact normalized then token overlap
    const findBest = (nameRaw: string, perfilWanted: string) => {
      const norm = normalize(nameRaw)
      if (!norm) return { id: null, possible: [] }
      const exact = funcMeta.find((fm: any) => fm.perfilNome === perfilWanted && fm.norm === norm)
      if (exact) return { id: exact.id, possible: [{ id: exact.id, name: exact.name, score: 1 }] }
      // token overlap
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

    // expected normalized keys in incoming rows: franquia, consultor, supervisor, coordenador, adesao, datacontrato, qtdsegurosbmgmed / qtdsegurofamiliar
    const qtyKey = tipo === 'bmg_med' ? 'qtdsegurosbmgmed' : 'qtdsegurofamiliar'

    for (const [i, r] of rows.entries()) {
      const franquiaRaw = String(r['franquia'] || r['Franquia'] || r['FRANQUIA'] || '').trim()
      const franquiaKey = String(franquiaRaw || '').trim().toUpperCase()
      const loja = lojaMapByFranquia.get(franquiaKey) || null

      const consultorRaw = String(r['consultor'] || '')
      const supervisorRaw = String(r['supervisor'] || '')
      const coordenadorRaw = String(r['coordenador'] || '')
  const adesao = String(r['adesao'] || r['Adesão'] || r['ADESAO'] || '').trim()
  const dataContrato = parseDate(r['datacontrato'] || r['dataContrato'] || r['datacontrato'] || null)
  const quantidade = parseQuantity(r[qtyKey] || r[qtyKey.toLowerCase()] || r['quantidade'] || 0)

      // find by perfil
      const cons = findBest(consultorRaw, 'Consultor')
      const sup = findBest(supervisorRaw, 'Supervisor')
      const coord = findBest(coordenadorRaw, 'Coordenador')

      const rowErrors: string[] = []
      if (!loja) rowErrors.push(`Loja não encontrada para franquia '${franquiaRaw}'`)
      if (!cons.id) rowErrors.push(`Consultor '${consultorRaw}' não encontrado`)
      if (!sup.id) rowErrors.push(`Supervisor '${supervisorRaw}' não encontrado`)
      if (!coord.id) rowErrors.push(`Coordenador '${coordenadorRaw}' não encontrado`)
  if (!adesao) rowErrors.push('Adesão ausente')
  if (!dataContrato) rowErrors.push('Data do contrato ausente')
  if (!quantidade || Number.isNaN(quantidade)) rowErrors.push('Quantidade inválida')

      if (rowErrors.length) {
        errors.push({ row: i + 2, reasons: rowErrors })
      }

      // check if adesao already exists
  let existing: any = null
      try {
        if (adesao) {
          const { data: existingRow } = await admin.from('vendas_externas').select('id,quantidade,loja_id,adesao').eq('adesao', adesao).eq('tipo_produto', tipo).single()
          existing = existingRow || null
        }
      } catch (e) {
        // ignore lookup errors, we'll not fail preview for DB lookup issues
        existing = null
      }

      previewRows.push({
        rowNumber: i + 2,
        franquia: franquiaRaw,
        lojaId: loja?.id || null,
        lojaName: loja?.name || null,
        consultorRaw,
        supervisorRaw,
        coordenadorRaw,
        consultorId: cons.id,
        supervisorId: sup.id,
        coordenadorId: coord.id,
        possibleConsultores: cons.possible,
        possibleSupervisores: sup.possible,
        possibleCoordenadores: coord.possible,
        adesao,
        dataContrato,
        quantidade,
        existing: existing ? { id: existing.id, quantidade: existing.quantidade, loja_id: existing.loja_id } : null,
        vinculado: {
          consultor: !!cons.id,
          supervisor: !!sup.id,
          coordenador: !!coord.id,
          loja: !!loja
        }
      })
    }

    return { success: true, data: { previewRows, errors } }
  } catch (err: any) {
    console.error('[server/api/seguros/import-preview] exception:', err)
    return { success: false, error: err?.message || 'Erro interno', data: null }
  }
})
