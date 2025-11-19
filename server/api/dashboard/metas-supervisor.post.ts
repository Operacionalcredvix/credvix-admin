import { eventHandler, readBody } from 'h3'
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

    const { data: userData, error: userErr } = await admin.auth.getUser(token)
    if (userErr || !userData?.user) return { success: false, error: 'Usuário não autenticado', data: null }

    const userId = userData.user.id

    // Busca perfil e loja do supervisor
    const { data: funcionarioRow, error: funcErr } = await admin
      .from('funcionarios')
      .select('id, loja_id, perfis(nome)')
      .eq('user_id', userId)
      .single()

    if (funcErr || !funcionarioRow) return { success: false, error: 'Funcionário não encontrado', data: null }

    const perfilObj = Array.isArray(funcionarioRow.perfis) ? funcionarioRow.perfis[0] : funcionarioRow.perfis
    const perfilNome = perfilObj?.nome || null
    
    if (perfilNome !== 'Supervisor') {
      return { success: false, error: 'Apenas supervisores podem acessar este endpoint', data: null }
    }

    if (!funcionarioRow.loja_id) {
      return { success: false, error: 'Supervisor não possui loja vinculada', data: null }
    }

    // Busca a regional do supervisor através da loja
    const { data: lojaData, error: lojaErr } = await admin
      .from('lojas')
      .select('regional_id')
      .eq('id', funcionarioRow.loja_id)
      .single()

    if (lojaErr || !lojaData?.regional_id) {
      return { success: false, error: 'Regional do supervisor não encontrada', data: null }
    }

    const body = await readBody(event) || {}
    const { p_periodo } = body

    if (!p_periodo) {
      return { success: false, error: 'Parâmetro p_periodo ausente', data: null }
    }

    // Busca metas da regional do supervisor
    const { data, error } = await admin
      .from('metas_progresso')
      .select('*')
      .eq('periodo', p_periodo)
      .eq('regional_id', lojaData.regional_id)

    if (error) {
      console.error('[server/api/dashboard/metas-supervisor] error:', error)
      return { success: false, error: error.message || 'Erro ao buscar metas', data: null }
    }

    return { success: true, data: data || [] }
  } catch (err: any) {
    console.error('[server/api/dashboard/metas-supervisor] error:', err)
    return { success: false, error: err?.message || 'Erro interno', data: null }
  }
})
