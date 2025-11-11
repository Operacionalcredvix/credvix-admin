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

    // checa perfil do chamador
    const { data: perfilRow } = await admin.from('funcionarios').select('perfil_id').eq('user_id', userData.user.id).single()
    const perfilId = perfilRow?.perfil_id || null
    const { data: perfil } = await admin.from('perfis').select('id,nome').eq('id', perfilId).single()
    const nomePerfil = perfil?.nome || null
    const allowed = ['Master', 'Diretoria', 'Gerência']
    if (!allowed.includes(nomePerfil)) return { success: false, error: 'Permissão negada', data: null }

  // insere (remover campo `id` caso venha no body para evitar erro em colunas GENERATED)
  const { id: _id, ...insertData } = body || {}
  const { data, error } = await admin.from('metas').insert(insertData).select('*')
    if (error) {
      console.error('[server/api/metas/create] error:', error)
      return { success: false, error: error.message || 'Erro ao criar meta', data: null }
    }

    return { success: true, data: data || null }
  } catch (err: any) {
    console.error('[server/api/metas/create] exception:', err)
    return { success: false, error: err?.message || 'Erro interno', data: null }
  }
})
