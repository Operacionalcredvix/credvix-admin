// POST /api/comunicados/visualizar
// Marca um comunicado como visualizado

import { eventHandler, readBody, createError } from 'h3'
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

  const body = await readBody(event)
  const { comunicado_id } = body

  if (!comunicado_id) {
    throw createError({
      statusCode: 400,
      message: 'comunicado_id é obrigatório'
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

  // Marca como visualizado via RPC
  const { data, error } = await admin
    .rpc('marcar_comunicado_visualizado', {
      p_comunicado_id: comunicado_id,
      p_funcionario_id: funcionario.id
    })

  if (error) {
    console.error('Erro ao marcar comunicado como visualizado:', error)
    throw createError({
      statusCode: 500,
      message: 'Erro ao marcar como visualizado'
    })
  }

  return { success: data }
})
