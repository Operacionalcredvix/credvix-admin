import { eventHandler, readBody } from 'h3'

export default eventHandler(async (event) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
    if (!supabaseUrl || !supabaseServiceKey) return { success: false, error: 'Supabase não configurado no servidor' }

    const { createClient } = await import('@supabase/supabase-js')
    const admin = createClient(supabaseUrl, supabaseServiceKey)

    const id = event.context.params?.id
    if (!id) return { success: false, error: 'ID ausente na rota' }

    const authHeader = event.node.req.headers?.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader || ''
    if (!token) return { success: false, error: 'Token ausente' }

    const { data: userData, error: userErr } = await admin.auth.getUser(token)
    if (userErr || !userData?.user) return { success: false, error: 'Usuário não autenticado' }

    const { data: func, error: funcErr } = await admin.from('funcionarios').select('id,perfil_id').eq('user_id', userData.user.id).single()
    if (funcErr || !func) return { success: false, error: 'Funcionário não encontrado' }
    let perfil = null
    if (func.perfil_id) {
      const { data: p } = await admin.from('perfis').select('nome').eq('id', func.perfil_id).single()
      perfil = p?.nome || null
    }
    if (!perfil || !['Master','Diretoria','Financeiro'].includes(perfil)) return { success: false, error: 'Acesso negado' }

  // aceita detalhes opcionais de pagamento no body: valor_pago, juros, multas, nota
  // garantir que `body` é sempre um objeto (readBody pode resolver com undefined)
  const _rawBody = await readBody(event).catch(() => ({}))
  const body = _rawBody ?? {}
    const payload: any = {
      pago: true,
      status: 'pago',
      data_pagamento: new Date().toISOString(),
      pago_por: func.id
    }
    if (body.valor_pago !== undefined) payload.valor_pago = Number(body.valor_pago)
    if (body.juros !== undefined) payload.juros = Number(body.juros)
    if (body.multas !== undefined) payload.multas = Number(body.multas)
    if (body.nota !== undefined) payload.nota = body.nota

    const { data, error } = await admin.from('contas_pagar').update(payload).eq('id', id).select().single()
    if (error) return { success: false, error: error.message || String(error) }

    return { success: true, data }
  } catch (err: any) {
    console.error('[server/api/financeiro/contas-pagar/[id]/pagar.post] exception:', err)
    return { success: false, error: err?.message || 'Erro interno' }
  }
})
