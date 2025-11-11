import { eventHandler } from 'h3'

export default eventHandler(async (event) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      return { success: false, error: 'Configuração do Supabase ausente no servidor', data: null }
    }

    // Extrai token Bearer do header Authorization
    const authHeader = event.node.req.headers?.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader || ''
    if (!token) {
      return { success: false, error: 'Token de autenticação ausente', data: null }
    }

    const { createClient } = await import('@supabase/supabase-js')
    const admin = createClient(supabaseUrl, supabaseServiceKey)

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

    // Buscar despesas dos últimos 6 meses
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const startDate = sixMonthsAgo.toISOString().split('T')[0]

    const { data, error } = await admin
      .from('contas_pagar')
      .select('id, data_vencimento, valor, categoria, centro_custo, status')
      .gte('data_vencimento', startDate)
      .neq('status', 'cancelado')

    if (error) return { success: false, error: error.message || String(error) }

    // Agrupar por categoria e centro de custo
    const grouped = {
      categorias: {},
      centros: {},
      resumoMensal: []
    }

    ;(data || []).forEach(item => {
      const valor = item.valor || 0
      const categoria = item.categoria || 'Não categorizado'
      const centro = item.centro_custo || 'Não definido'

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
      const categoria = item.categoria || 'Não categorizado'
      const centro = item.centro_custo || 'Não definido'

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