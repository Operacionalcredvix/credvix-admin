import { readBody, eventHandler } from 'h3'

export default eventHandler(async (event) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
    if (!supabaseUrl || !supabaseServiceKey) return { success: false, error: 'Supabase não configurado no servidor' }

    const { createClient } = await import('@supabase/supabase-js')
    const admin = createClient(supabaseUrl, supabaseServiceKey)

    const body = await readBody(event)
    const id = event.context.params?.id
    if (!id) return { success: false, error: 'ID ausente' }

  const { nome_razao, documento, banco, agencia, conta, email = null, telefone1 = null, telefone2 = null, dados_contato, ativo } = body || {}
    const updates: any = {}
    if (nome_razao !== undefined) updates.nome_razao = nome_razao
    if (documento !== undefined) updates.documento = documento
    if (banco !== undefined) updates.banco = banco
    if (agencia !== undefined) updates.agencia = agencia
    if (conta !== undefined) updates.conta = conta
  if (email !== undefined) updates.email = email
  if (telefone1 !== undefined) updates.telefone1 = telefone1
  if (telefone2 !== undefined) updates.telefone2 = telefone2
    if (dados_contato !== undefined) updates.dados_contato = dados_contato
    if (ativo !== undefined) updates.ativo = ativo

    const { data, error } = await admin.from('fornecedores').update(updates).eq('id', id).select().single()
    if (error) return { success: false, error: error.message || String(error) }

    return { success: true, data }
  } catch (err: any) {
    console.error('[server/api/fornecedores/[id].put] exception:', err)
    return { success: false, error: err?.message || 'Erro interno' }
  }
})
