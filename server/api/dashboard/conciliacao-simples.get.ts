import { eventHandler, getQuery } from 'h3'

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

  // Lê filtros gerais de query: loja_id, date_from, date_to
  const query = getQuery(event)
  const lojaId = query.loja_id || null
  const dateFrom = query.date_from || null
  const dateTo = query.date_to || null

  // Coerce query values to strings when present
  const dateFromStr = dateFrom ? String(dateFrom) : null
  const dateToStr = dateTo ? String(dateTo) : null

  // Período padrão (mês corrente) se não houver override por date_from/date_to
  const now = new Date()
  const startOfMonth = dateFromStr ? new Date(dateFromStr) : new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = dateToStr ? new Date(dateToStr) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Buscar entradas (pagamentos recebidos) - contratos pagos
    // Note: contratos.status is an ENUM (contrato_status) with values like 'Pago' (case-sensitive)
    let contratosQuery = admin
      .from('contratos')
      .select('id, valor_total, data_pagamento, status')
      .eq('status', 'Pago')
      .gte('data_pagamento', startOfMonth.toISOString())
      .lte('data_pagamento', endOfMonth.toISOString())
    if (lojaId) contratosQuery = contratosQuery.eq('loja_id', lojaId as string)

    const { data: entradasData, error: entradasError } = await contratosQuery

    if (entradasError) return { success: false, error: entradasError.message || String(entradasError) }

    // Buscar saídas (contas pagas)
    let saidasQuery = admin
      .from('contas_pagar')
      .select('id, valor, data_pagamento, descricao, status')
      .eq('status', 'pago')
      .gte('data_pagamento', startOfMonth.toISOString())
      .lte('data_pagamento', endOfMonth.toISOString())
    if (lojaId) saidasQuery = saidasQuery.eq('loja_id', lojaId as string)

    const { data: saidasData, error: saidasError } = await saidasQuery

    if (saidasError) return { success: false, error: saidasError.message || String(saidasError) }

    // Calcular totais
    const entradas = (entradasData || []).reduce((sum, item) => sum + (item.valor_total || 0), 0)
    const saidas = (saidasData || []).reduce((sum, item) => sum + (item.valor || 0), 0)
    const saldo = entradas - saidas

    // Criar lista de transações recentes (últimas 20)
    const transacoes: Array<{data: string, descricao: string, tipo: 'entrada' | 'saida', valor: number}> = []

    // Adicionar entradas
    ;(entradasData || []).slice(0, 10).forEach(item => {
      transacoes.push({
        data: item.data_pagamento || '',
        descricao: `Contrato #${item.id}`,
        tipo: 'entrada',
        valor: item.valor_total || 0
      })
    })

    // Adicionar saídas
    ;(saidasData || []).slice(0, 10).forEach(item => {
      transacoes.push({
        data: item.data_pagamento || '',
        descricao: item.descricao || `Conta #${item.id}`,
        tipo: 'saida',
        valor: item.valor || 0
      })
    })

    // Ordenar por data (mais recente primeiro)
    transacoes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

    return { success: true, data: { entradas, saidas, saldo, transacoes } }
  } catch (err: any) {
    console.error('[server/api/dashboard/conciliacao-simples] error:', err)
    return { success: false, error: err?.message || 'Erro interno', data: null }
  }
})