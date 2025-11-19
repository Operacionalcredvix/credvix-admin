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

    // Busca perfil do consultor
    const { data: funcionarioRow, error: funcErr } = await admin
      .from('funcionarios')
      .select('id, loja_id, perfis(nome)')
      .eq('user_id', userId)
      .single()

    if (funcErr || !funcionarioRow) return { success: false, error: 'Funcionário não encontrado', data: null }

    const perfilObj = Array.isArray(funcionarioRow.perfis) ? funcionarioRow.perfis[0] : funcionarioRow.perfis
    const perfilNome = perfilObj?.nome || null
    
    if (perfilNome !== 'Consultor') {
      return { success: false, error: 'Apenas consultores podem acessar este endpoint', data: null }
    }

    const body = await readBody(event) || {}
    const { p_periodo } = body

    if (!p_periodo) {
      return { success: false, error: 'Parâmetro p_periodo ausente', data: null }
    }

    // Busca desempenho individual do consultor
    const { data, error } = await admin.rpc('get_desempenho_consultores_month', {
      p_periodo
    })

    if (error) {
      console.error('[server/api/dashboard/desempenho-consultor] RPC error:', error)
      return { success: false, error: error.message || 'Erro ao executar RPC', data: null }
    }

    // Filtra apenas os dados do consultor logado
    const consultorData = (data || []).find(item => item.consultor_id === funcionarioRow.id)

    if (!consultorData) {
      // Retorna estrutura vazia se não encontrar dados
      return {
        success: true,
        data: {
          consultor_id: funcionarioRow.id,
          periodo: p_periodo,
          meta_individual_cnc: 0,
          meta_individual_card: 0,
          meta_individual_card_beneficio: 0,
          meta_individual_consignado: 0,
          meta_individual_fgts: 0,
          meta_individual_bmg_med: 0,
          meta_individual_seguro_familiar: 0,
          atingido_cnc: 0,
          atingido_card: 0,
          atingido_card_beneficio: 0,
          atingido_consignado: 0,
          atingido_fgts: 0,
          atingido_bmg_med: 0,
          atingido_seguro_familiar: 0
        }
      }
    }

    // Retorna apenas os dados relevantes do consultor
    return {
      success: true,
      data: {
        consultor_id: consultorData.consultor_id,
        periodo: consultorData.periodo,
        meta_individual_cnc: consultorData.meta_individual_cnc || 0,
        meta_individual_card: consultorData.meta_individual_card || 0,
        meta_individual_card_beneficio: consultorData.meta_individual_card_beneficio || 0,
        meta_individual_consignado: consultorData.meta_individual_consignado || 0,
        meta_individual_fgts: consultorData.meta_individual_fgts || 0,
        meta_individual_bmg_med: consultorData.meta_individual_bmg_med || 0,
        meta_individual_seguro_familiar: consultorData.meta_individual_seguro_familiar || 0,
        atingido_cnc: consultorData.atingido_cnc || 0,
        atingido_card: consultorData.atingido_card || 0,
        atingido_card_beneficio: consultorData.atingido_card_beneficio || 0,
        atingido_consignado: consultorData.atingido_consignado || 0,
        atingido_fgts: consultorData.atingido_fgts || 0,
        atingido_bmg_med: consultorData.atingido_bmg_med || 0,
        atingido_seguro_familiar: consultorData.atingido_seguro_familiar || 0
      }
    }
  } catch (err: any) {
    console.error('[server/api/dashboard/desempenho-consultor] error:', err)
    return { success: false, error: err?.message || 'Erro interno', data: null }
  }
})
