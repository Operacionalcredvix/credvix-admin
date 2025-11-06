import { eventHandler, getQuery } from 'h3'

export default eventHandler(async (event) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
    if (!supabaseUrl || !supabaseServiceKey) return { success: false, error: 'Supabase não configurado no servidor' }

    const { createClient } = await import('@supabase/supabase-js')
    const admin = createClient(supabaseUrl, supabaseServiceKey)

    const query = getQuery(event)
  const loja_id = query.loja_id || null
  const status = query.status || null
  const vencidos = query.vencidos === 'true' || query.vencidos === '1' || false
    const limit = parseInt(query.limit as string) || 100
    const offset = parseInt(query.offset as string) || 0

    // Autenticação e autorização por perfil
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

  // constrói query com contagem (count exact) e inclui objetos relacionados (lojas, centros_custo)
  // trazemos nomes de loja/centro para evitar depender de consultas client-side e problemas de RLS
  let base = admin.from('contas_pagar').select('id,loja_id,descricao,data_vencimento,valor,status,pago,data_pagamento,pago_por,nota,criado_em,centro_custo_id,lojas(id,nome),centros_custo(id,nome)', { count: 'exact' })
    if (loja_id) base = base.eq('loja_id', loja_id as string)
    if (query.centro_custo_id) base = base.eq('centro_custo_id', query.centro_custo_id as string)
    if (status) base = base.eq('status', status as string)
    if (vencidos) {
      // filtro de vencidos: data_vencimento < hoje e não pago
      const hoje = new Date().toISOString().split('T')[0]
      base = base.lt('data_vencimento', hoje).eq('pago', false)
    } else {
      if (query.date_from) base = base.gte('data_vencimento', query.date_from as string)
      if (query.date_to) base = base.lte('data_vencimento', query.date_to as string)
    }

  const { data, error, count } = await base.order('data_vencimento', { ascending: true }).range(offset, offset + limit - 1)
  if (error) return { success: false, error: error.message || String(error) }

  return { success: true, data, count: count ?? null }
  } catch (err: any) {
    console.error('[server/api/financeiro/contas-pagar.get] exception:', err)
    return { success: false, error: err?.message || 'Erro interno' }
  }
})
