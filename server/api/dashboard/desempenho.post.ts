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
    const { data: perfilRow, error: perfilErr } = await admin
      .from('funcionarios')
      .select('id, user_id, perfis(nome)')
      .eq('user_id', userId)
      .single()

    if (perfilErr || !perfilRow) return { success: false, error: 'Perfil do usuário não encontrado', data: null }

    const perfilObj = Array.isArray(perfilRow.perfis) ? perfilRow.perfis[0] : perfilRow.perfis
    const perfilNome = perfilObj?.nome || null
    const allowed = ['Master', 'Diretoria', 'Gerência', 'Coordenador']
    if (!allowed.includes(perfilNome)) return { success: false, error: 'Sem permissão', data: null }

    const body = await readBody(event) || {}
    let { p_periodo, p_regional_id } = body

    // Se for Coordenador, busca as regionais que ele coordena
    if (perfilNome === 'Coordenador') {
      const { data: regionais, error: regionaisErr } = await admin
        .from('regionais')
        .select('id')
        .eq('coordenador_id', perfilRow.id)

      if (regionaisErr) {
        console.error('[server/api/dashboard/desempenho] Erro ao buscar regionais do coordenador:', regionaisErr)
        return { success: false, error: 'Erro ao buscar regionais do coordenador', data: null }
      }

      const regionalIds = (regionais || []).map(r => r.id)

      if (regionalIds.length === 0) {
        return { success: true, data: [] } // Coordenador sem regionais
      }

      // Para múltiplas regionais, usa RPC function
      if (!p_periodo) {
        return { success: false, error: 'Parâmetro p_periodo ausente', data: null }
      }

      // Usa RPC function para buscar desempenho filtrado por regionais
      const { data: desempenhoData, error: desempenhoErr } = await admin.rpc('get_desempenho_consultores_by_regional', {
        p_periodo,
        p_regional_ids: regionalIds
      })

      if (desempenhoErr) {
        console.error('[server/api/dashboard/desempenho] Erro ao buscar desempenho:', desempenhoErr)
        return { success: false, error: desempenhoErr.message || 'Erro ao buscar desempenho', data: null }
      }

      return { success: true, data: desempenhoData || [] }
    }

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
