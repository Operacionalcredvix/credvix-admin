import { eventHandler, readBody } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

export default eventHandler(async (event) => {
  try {
    const admin = await serverSupabaseServiceRole(event)

    // valida token do chamador
    const authHeader = event.node.req.headers?.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader || ''
    if (!token) return { success: false, error: 'Token ausente', data: null }

    const { data: userData, error: userErr } = await admin.auth.getUser(token)
    if (userErr || !userData?.user) return { success: false, error: 'Usuário não autenticado', data: null }

    const body = await readBody(event) || {}
    const page = parseInt(String(body.page || 1))
    const pageSize = parseInt(String(body.pageSize || 15))
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // filtros possíveis
    const status = body.status || null
    const loja_id = body.loja_id || null
    const cliente_id = body.cliente_id || null
    const consultor_id = body.consultor_id || null
    const startDate = body.startDate || null
    const endDate = body.endDate || null

  // obtém perfil do chamador (via tabela funcionarios)
  // selecionamos também o id do funcionário para casos em que precisamos filtrar por consultor_id
  const { data: callerProfileRow } = await admin.from('funcionarios').select('id, perfil_id, loja_id').eq('user_id', userData.user.id).single();
  const callerPerfilId = callerProfileRow?.perfil_id || null
  const { data: callerPerfil } = await admin.from('perfis').select('id, nome').eq('id', callerPerfilId).single()
  const callerNome = callerPerfil?.nome || null

    // constrói consulta
    let query = admin.from('contratos').select(`
      id,
      data_contrato,
      valor_total,
      status,
      cliente_id,
      loja_id,
      consultor_id,
      clientes ( nome_completo ),
      produtos ( nome )
    `, { count: 'exact' })

    let totalQuery = admin.from('contratos').select('valor_total', { head: false })

    // RBAC: aplica filtros conforme perfil
    switch (callerNome) {
      case 'Coordenador': {
        // Para coordenador, inferimos a regional a partir da loja do próprio funcionário
        const callerLojaId = callerProfileRow?.loja_id || null
        if (!callerLojaId) return { success: true, data: [], count: 0, totalValor: 0 }

        const { data: callerLoja } = await admin.from('lojas').select('regional_id').eq('id', callerLojaId).single()
        const regionalId = callerLoja?.regional_id || null
        if (!regionalId) return { success: true, data: [], count: 0, totalValor: 0 }

        const { data: lojasDaRegional } = await admin.from('lojas').select('id').eq('regional_id', regionalId)
        const idsLojas = (lojasDaRegional || []).map(l => l.id)
        if (idsLojas.length > 0) {
          query = query.in('loja_id', idsLojas)
          totalQuery = totalQuery.in('loja_id', idsLojas)
        } else {
          return { success: true, data: [], count: 0, totalValor: 0 }
        }
        break
      }
      case 'Supervisor':
        if (callerProfileRow?.loja_id) {
          query = query.eq('loja_id', callerProfileRow.loja_id)
          totalQuery = totalQuery.eq('loja_id', callerProfileRow.loja_id)
        } else {
          return { success: true, data: [], count: 0, totalValor: 0 }
        }
        break
      case 'Consultor':
        // filtramos por consultor_id = id do funcionário (selecionamos id acima)
        if (callerProfileRow?.id) {
          query = query.eq('consultor_id', callerProfileRow.id)
          totalQuery = totalQuery.eq('consultor_id', callerProfileRow.id)
        } else {
          return { success: true, data: [], count: 0, totalValor: 0 }
        }
        break
      default:
        // Master/Backoffice/RH podem ver tudo
        break
    }

    // Aplica filtros adicionais do cliente
    if (status) { query = query.eq('status', status); totalQuery = totalQuery.eq('status', status) }
    if (loja_id) { query = query.eq('loja_id', loja_id); totalQuery = totalQuery.eq('loja_id', loja_id) }
    if (cliente_id) { query = query.eq('cliente_id', cliente_id); totalQuery = totalQuery.eq('cliente_id', cliente_id) }
    if (consultor_id) { query = query.eq('consultor_id', consultor_id); totalQuery = totalQuery.eq('consultor_id', consultor_id) }
    if (startDate) { query = query.gte('data_contrato', startDate); totalQuery = totalQuery.gte('data_contrato', startDate) }
    if (endDate) { query = query.lte('data_contrato', endDate); totalQuery = totalQuery.lte('data_contrato', endDate) }

    // paginação
    const { data, error, count } = await query.order('data_contrato', { ascending: false }).range(from, to)
    if (error) {
      console.error('[server/api/contratos/search] error:', error)
      return { success: false, error: error.message || 'Erro na busca', data: null }
    }

    // total valor
    const { data: totalData, error: totalError } = await totalQuery
    let totalValor = 0
    if (!totalError && Array.isArray(totalData)) {
      totalValor = totalData.reduce((acc, item) => acc + (item.valor_total || 0), 0)
    }

    return { success: true, data: data || [], count: count || 0, totalValor }
  } catch (err: any) {
    console.error('[server/api/contratos/search] exception:', err)
    return { success: false, error: err?.message || 'Erro interno', data: null }
  }
})
