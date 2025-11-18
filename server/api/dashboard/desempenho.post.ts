import { eventHandler, readBody } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

export default eventHandler(async (event) => {
  try {
    const admin = await serverSupabaseServiceRole(event)

    const { data: userData, error: userErr } = await admin.auth.getUser(token)
    if (userErr || !userData?.user) return { success: false, error: 'Usuário não autenticado', data: null }

    const userId = userData.user.id
    const { data: perfilRow, error: perfilErr } = await admin
      .from('funcionarios')
      .select('id, user_id, perfis(nome)')
      .eq('user_id', userId)
      .single()

    if (perfilErr || !perfilRow) return { success: false, error: 'Perfil do usuário não encontrado', data: null }

    const perfilObj = Array.isArray(perfilRow.perfis) ? perfilRow.perfis[0] : perfilRow.perfis
    const perfilNome = perfilObj?.nome || null
    const allowed = ['Master', 'Diretoria', 'Gerência']
    if (!allowed.includes(perfilNome)) return { success: false, error: 'Sem permissão', data: null }

    const rpcArgs: Record<string, any> = {}
    if (p_periodo) rpcArgs.p_periodo = p_periodo
    if (p_regional_id) rpcArgs.p_regional_id = p_regional_id

    const { data, error } = await admin.rpc('get_desempenho_consultores_month', rpcArgs)
    if (error) {
      console.error('[server/api/dashboard/desempenho] RPC error:', error)
      return { success: false, error: error.message || 'Erro ao executar RPC', data: null }
    }

    return { success: true, data: data || [] }
  } catch (err: any) {
    console.error('[server/api/dashboard/desempenho] error:', err)
    return { success: false, error: err?.message || 'Erro interno', data: null }
  }
})
