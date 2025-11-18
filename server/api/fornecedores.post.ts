import { readBody, eventHandler } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

export default eventHandler(async (event) => {
  try {
    const admin = await serverSupabaseServiceRole(event)

  const body = await readBody(event)
  const { nome_razao, documento = null, banco = null, agencia = null, conta = null, email = null, telefone1 = null, telefone2 = null, dados_contato = null, ativo = true } = body || {}
    if (!nome_razao) return { success: false, error: 'nome_razao é obrigatório' }

  const payload: any = { nome_razao, documento, dados_contato, ativo }
  // opções: conservar campos legados banco/agencia/conta se enviados
  if (banco) payload.banco = banco
  if (agencia) payload.agencia = agencia
  if (conta) payload.conta = conta
  if (email) payload.email = email
  if (telefone1) payload.telefone1 = telefone1
  if (telefone2) payload.telefone2 = telefone2
  const { data, error } = await admin.from('fornecedores').insert(payload).select().limit(1).single()
    if (error) return { success: false, error: error.message || String(error) }

    return { success: true, data }
  } catch (err: any) {
    console.error('[server/api/fornecedores.post] exception:', err)
    return { success: false, error: err?.message || 'Erro interno' }
  }
})
