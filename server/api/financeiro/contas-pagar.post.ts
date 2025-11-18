import { eventHandler, readBody } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

export default eventHandler(async (event) => {
  try {
    const admin = await serverSupabaseServiceRole(event)

  const body = await readBody(event)
  const { loja_id, descricao, data_vencimento, valor, centro_custo_id, fornecedor_id, plano_conta_id, agendado_para } = body || {}
  // validação: exigir Fornecedor, Valor Total, Data de Vencimento, Centro de Custo e Conta Contábil
  if (!fornecedor_id) return { success: false, error: 'Fornecedor é obrigatório' }
  if (!centro_custo_id) return { success: false, error: 'Centro de Custo é obrigatório' }
  if (!plano_conta_id) return { success: false, error: 'Conta contábil (plano de contas) é obrigatória' }
  if (!data_vencimento) return { success: false, error: 'Data de Vencimento é obrigatória' }
  if (valor === undefined || valor === null || Number(valor) <= 0) return { success: false, error: 'Valor Total deve ser maior que zero' }

  // validação de agendamento: se informado, deve ser uma data válida e não no passado
  if (agendado_para) {
    const parsed = new Date(agendado_para)
    if (isNaN(parsed.getTime())) return { success: false, error: 'Data de agendamento inválida' }
    // permitimos agendar para hoje ou futuro; rejeitamos datas menores que agora
    if (parsed.getTime() < (Date.now() - 1000)) return { success: false, error: 'Data de agendamento não pode ser no passado' }
  }

    // validação básica
    const payload: any = {
      loja_id,
      descricao: descricao || null,
      data_vencimento,
      valor,
      criado_em: new Date().toISOString()
    }
    // se houver agendamento, definimos status agendado e gravamos a data
    if (agendado_para) {
      payload.agendado_para = agendado_para
      payload.status = 'agendado'
    } else {
      payload.status = 'pendente'
    }
    if (centro_custo_id) payload.centro_custo_id = centro_custo_id
    if (fornecedor_id) payload.fornecedor_id = fornecedor_id
    if (plano_conta_id) payload.plano_conta_id = plano_conta_id

    // retornamos os objetos relacionados quando possível
  const { data, error } = await admin.from('contas_pagar').insert(payload).select('*,lojas(id,nome),centros_custo(id,nome),fornecedores(id,nome_razao),plano_contas(id,codigo,nome)').single()
    if (error) return { success: false, error: error.message || String(error) }

    return { success: true, data }
  } catch (err: any) {
    console.error('[server/api/financeiro/contas-pagar] exception:', err)
    return { success: false, error: err?.message || 'Erro interno' }
  }
})
