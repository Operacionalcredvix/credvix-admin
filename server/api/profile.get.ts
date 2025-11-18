import { serverSupabaseServiceRole } from '#supabase/server'

export default eventHandler(async (event) => {
  try {
    const authHeader = event.node.req.headers?.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader || ''
    if (!token) return { success: false, error: 'Token de autenticação ausente', data: null }

    const admin = await serverSupabaseServiceRole(event)

    const { data: userData, error: userErr } = await admin.auth.getUser(token)
    if (userErr || !userData?.user) return { success: false, error: 'Usuário não autenticado', data: null }

    const userId = userData.user.id

    const { data, error } = await admin
      .from('funcionarios')
      .select('*, perfis(nome), lider:gerente_id(nome_completo), lojas(id, nome, regional_id, regionais(id, nome_regional))')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('[server/api/profile] erro ao buscar funcionarios:', error)
      return { success: false, error: error.message || 'Erro ao buscar perfil', data: null }
    }

    return { success: true, data }
  } catch (err: any) {
    console.error('[server/api/profile] error:', err)
    return { success: false, error: err?.message || 'Erro interno', data: null }
  }
})
