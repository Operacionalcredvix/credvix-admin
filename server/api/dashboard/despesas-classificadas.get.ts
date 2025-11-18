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

  // Buscar despesas (por padrão últimos 6 meses)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const defaultStart = sixMonthsAgo.toISOString().split('T')[0]
  const startDate = dateFrom || defaultStart

    // Note: `contas_pagar` stores centro via centro_custo_id and may not have a 'categoria' text column.
    // Selecionamos as relações para obter nomes legíveis (centros, plano_contas, fornecedores)
    let base = admin
      .from('contas_pagar')
      .select('id, data_vencimento, valor, status, centro_custo_id, plano_conta_id, fornecedor_id, centros_custo(id,nome),plano_contas(id,nome),fornecedores(id,nome_razao)')
      .neq('status', 'cancelado')
    if (lojaId) base = base.eq('loja_id', lojaId as string)
    if (dateFrom) base = base.gte('data_vencimento', dateFrom as string)
    else base = base.gte('data_vencimento', startDate)
    if (dateTo) base = base.lte('data_vencimento', dateTo as string)

    const { data, error } = await base

    if (error) return { success: false, error: error.message || String(error) }

    // Agrupar por categoria e centro de custo
    const grouped = {
      categorias: {},
      centros: {},
      resumoMensal: []
    }

    ;(data || []).forEach(item => {
  const valor = item.valor || 0
  // Normalizar possíveis arrays retornados pelo supabase (relações podem ser arrays)
  const plano = Array.isArray(item.plano_contas) ? item.plano_contas[0] : item.plano_contas
  const fornecedor = Array.isArray(item.fornecedores) ? item.fornecedores[0] : item.fornecedores
  const centroObj = Array.isArray(item.centros_custo) ? item.centros_custo[0] : item.centros_custo

  // Derivar categoria a partir do plano de contas ou do fornecedor quando existir
  const categoria = ((plano as any)?.nome) || ((fornecedor as any)?.nome_razao || (fornecedor as any)?.nome) || 'Não categorizado'
  const centro = ((centroObj as any)?.nome) || 'Não definido'

      // Agrupar por categoria
      if (!grouped.categorias[categoria]) grouped.categorias[categoria] = 0
      grouped.categorias[categoria] += valor

      // Agrupar por centro de custo
      if (!grouped.centros[centro]) grouped.centros[centro] = 0
      grouped.centros[centro] += valor
    })

    // Criar resumo mensal
    const monthlySummary: Record<string, Record<string, Record<string, number>>> = {}
    ;(data || []).forEach(item => {
      if (!item.data_vencimento) return
      const date = new Date(item.data_vencimento)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  const plano = Array.isArray(item.plano_contas) ? item.plano_contas[0] : item.plano_contas
  const fornecedor = Array.isArray(item.fornecedores) ? item.fornecedores[0] : item.fornecedores
  const centroObj = Array.isArray(item.centros_custo) ? item.centros_custo[0] : item.centros_custo

  const categoria = ((plano as any)?.nome) || ((fornecedor as any)?.nome_razao || (fornecedor as any)?.nome) || 'Não categorizado'
  const centro = ((centroObj as any)?.nome) || 'Não definido'

      if (!monthlySummary[monthKey]) {
        monthlySummary[monthKey] = {}
      }
      if (!monthlySummary[monthKey][categoria]) {
        monthlySummary[monthKey][categoria] = {}
      }
      if (!monthlySummary[monthKey][categoria][centro]) {
        monthlySummary[monthKey][categoria][centro] = 0
      }
      monthlySummary[monthKey][categoria][centro] += item.valor || 0
    })

    // Converter para array para a tabela
    const resumoMensal: Array<{mes: string, categoria: string, centro_custo: string, valor_total: number}> = []
    Object.entries(monthlySummary).forEach(([mes, categorias]) => {
      Object.entries(categorias).forEach(([categoria, centros]) => {
        Object.entries(centros).forEach(([centro, valor]) => {
          resumoMensal.push({
            mes,
            categoria,
            centro_custo: centro,
            valor_total: valor
          })
        })
      })
    })

    // Ordenar resumo mensal por mês (mais recente primeiro)
    resumoMensal.sort((a, b) => b.mes.localeCompare(a.mes))

    return { success: true, data: { ...grouped, resumoMensal } }
  } catch (err: any) {
    console.error('[server/api/dashboard/despesas-classificadas] error:', err)
    return { success: false, error: err?.message || 'Erro interno', data: null }
  }
})