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

    // Prepare rows (assume incoming rows already contain correct ids when preview confirmed)
    // Expected shape per row: consultor_id, supervisor_id, coordenador_id, loja_id, tipo_produto, data_venda, quantidade, adesao
    const toInsert = rows.map((r: any) => ({
      consultor_id: r.consultor_id,
      supervisor_id: r.supervisor_id,
      coordenador_id: r.coordenador_id,
      loja_id: r.loja_id,
      tipo_produto: r.tipo_produto,
      data_venda: r.data_venda,
      quantidade: r.quantidade,
      adesao: r.adesao
    }))

    // Upsert with unique key adesao + tipo_produto
    const { data: upserted, error: upsertErr } = await admin.from('vendas_externas').upsert(toInsert, { onConflict: 'adesao, tipo_produto' }).select('*')
    if (upsertErr) {
      console.error('[server/api/seguros/import] upsert error:', upsertErr)
      return { success: false, error: upsertErr.message || 'Erro ao importar seguros', data: { upsertErr } }
    }

    return { success: true, data: { insertedOrUpdated: upserted || [] } }
  } catch (err: any) {
    console.error('[server/api/seguros/import] exception:', err)
    return { success: false, error: err?.message || 'Erro interno', data: null }
  }
})
