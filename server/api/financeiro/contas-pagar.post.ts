import { eventHandler, readBody } from 'h3'

export default eventHandler(async (event) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
    if (!supabaseUrl || !supabaseServiceKey) return { success: false, error: 'Supabase não configurado no servidor' }

    const { createClient } = await import('@supabase/supabase-js')
    const admin = createClient(supabaseUrl, supabaseServiceKey)

  const body = await readBody(event)
  const { loja_id, descricao, data_vencimento, valor, centro_custo_id } = body || {}
  // descricao agora é opcional (pode ser null). validação exige apenas loja, data_vencimento e valor
  if (!loja_id || !data_vencimento || !valor) return { success: false, error: 'Campos obrigatórios ausentes' }

    // validação básica
    const payload: any = {
      loja_id,
      descricao: descricao || null,
      data_vencimento,
      valor,
      status: 'pendente',
      criado_em: new Date().toISOString()
    }
    if (centro_custo_id) payload.centro_custo_id = centro_custo_id

    const { data, error } = await admin.from('contas_pagar').insert(payload).select().single()
    if (error) return { success: false, error: error.message || String(error) }

    return { success: true, data }
  } catch (err: any) {
    console.error('[server/api/financeiro/contas-pagar] exception:', err)
    return { success: false, error: err?.message || 'Erro interno' }
  }
})
