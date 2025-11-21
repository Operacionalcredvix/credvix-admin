// GET /api/comunicados/historico
// Retorna histórico de comunicados do usuário autenticado

import { eventHandler, createError } from 'h3'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default eventHandler(async (event) => {
  const admin = await serverSupabaseServiceRole(event)
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Não autenticado'
    })
  }

  // Busca funcionário
  const { data: funcionario, error: funcError } = await admin
    .from('funcionarios')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (funcError || !funcionario) {
    throw createError({
      statusCode: 404,
      message: 'Funcionário não encontrado'
    })
  }

  // Busca histórico via RPC
  const { data, error } = await admin
    .rpc('get_comunicados_historico', {
      p_funcionario_id: funcionario.id
    })

  if (error) {
    console.error('Erro ao buscar histórico de comunicados:', error)
    throw createError({
      statusCode: 500,
      message: 'Erro ao buscar histórico'
    })
  }

  return data || []
})
