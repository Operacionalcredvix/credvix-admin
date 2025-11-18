import { eventHandler, getQuery } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

export default eventHandler(async (event) => {
  try {
    const admin = await serverSupabaseServiceRole(event)

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
    const allowed = ['Master', 'Diretoria', 'Gerência', 'Financeiro']
    if (!allowed.includes(perfilNome)) {
      return { success: false, error: 'Sem permissão para acessar dados financeiros', data: null }
    }

    // Lê filtros gerais de query: loja_id, date_from, date_to
    const query = getQuery(event)
    const lojaId = query.loja_id || null
    const dateFrom = query.date_from || null
    const dateTo = query.date_to || null

    // Buscar contas a pagar pendentes (excluindo pagas)
    // Mantemos apenas a verificação de status != 'pago' para incluir lançamentos pendentes/agendados.
    let base = admin.from('contas_pagar').select('id, data_vencimento, valor, status, loja_id').neq('status', 'pago')
    if (lojaId) base = base.eq('loja_id', lojaId as string)
    if (dateFrom) base = base.gte('data_vencimento', dateFrom as string)
    if (dateTo) base = base.lte('data_vencimento', dateTo as string)

    const { data, error } = await base

    if (error) return { success: false, error: error.message || String(error) }

    // Agrupar por semana e mês
    const now = new Date()
    const grouped = {
      weekly: {},
      monthly: {}
    }

    ;(data || []).forEach(item => {
      if (!item.data_vencimento) return
      const venc = new Date(item.data_vencimento)
      const diffDays = Math.ceil((venc.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      // Semanal: próximas 4 semanas
      if (diffDays >= 0 && diffDays <= 28) {
        const weeksAhead = Math.floor(diffDays / 7)
        const key = `Semana ${weeksAhead + 1}`
        if (!grouped.weekly[key]) grouped.weekly[key] = 0
        grouped.weekly[key] += item.valor || 0
      }

      // Mensal: próximos 6 meses
      if (diffDays >= 0) {
        const monthKey = `${venc.getFullYear()}-${String(venc.getMonth() + 1).padStart(2, '0')}`
        if (!grouped.monthly[monthKey]) grouped.monthly[monthKey] = 0
        grouped.monthly[monthKey] += item.valor || 0
      }
    })

    return { success: true, data: grouped }
  } catch (err: any) {
    console.error('[server/api/dashboard/contas-pagar-vencimento] error:', err)
    return { success: false, error: err?.message || 'Erro interno', data: null }
  }
})
