import { eventHandler } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

export default eventHandler(async (event) => {
  try {
    const admin = await serverSupabaseServiceRole(event)

    // Extrai token Bearer do header Authorization
    const authHeader = event.node.req.headers?.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader || ''
    if (!token) {
      return { success: false, error: 'Token de autenticação ausente', data: null }
    }

    // Valida token e recupera o usuário
    const { data: userData, error: userErr } = await admin.auth.getUser(token)
    if (userErr || !userData?.user) {
      return { success: false, error: 'Usuário não autenticado', data: null }
    }

    const userId = userData.user.id

    // Busca perfil do usuário no banco usando service role
    const { data: perfilRow, error: perfilErr } = await admin
      .from('funcionarios')
      .select('id, user_id, perfis(nome)')
      .eq('user_id', userId)
      .single()

    if (perfilErr || !perfilRow) {
      return { success: false, error: 'Perfil do usuário não encontrado', data: null }
    }

  // perfis pode ser um objeto ou um array dependendo do SELECT; normalize
  const perfilObj = Array.isArray(perfilRow.perfis) ? perfilRow.perfis[0] : perfilRow.perfis
  const perfilNome = perfilObj?.nome || null
    const allowed = ['Master', 'Diretoria', 'Gerência']
    if (!allowed.includes(perfilNome)) {
      return { success: false, error: 'Sem permissão para acessar dashboard Master', data: null }
    }

    // Lê query params para repassar à RPC
    const url = new URL(event.node.req.url || '', `http://${event.node.req.headers.host || 'localhost'}`)
    const p_start_date = url.searchParams.get('start') || undefined
    const p_end_date = url.searchParams.get('end') || undefined
    const p_regional_id = url.searchParams.get('regional') || undefined

    const rpcArgs: Record<string, any> = {}
    if (p_start_date) rpcArgs.p_start_date = p_start_date
    if (p_end_date) rpcArgs.p_end_date = p_end_date
    if (p_regional_id) rpcArgs.p_regional_id = p_regional_id

    const { data, error } = await admin.rpc('get_dashboard_data_master', rpcArgs)
    if (error) {
      console.error('[server/api/dashboard/master] RPC error:', error)
      return { success: false, error: error.message || 'Erro ao executar RPC', data: null }
    }

    return { success: true, data: data || null }
  } catch (err: any) {
    console.error('[server/api/dashboard/master] error:', err)
    return { success: false, error: err?.message || 'Erro interno', data: null }
  }
})
