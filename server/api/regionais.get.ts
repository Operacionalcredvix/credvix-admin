// GET /api/regionais
// Retorna lista de regionais

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

  const { data, error } = await admin
    .from('regionais')
    .select('id, nome_regional')
    .order('nome_regional')

  if (error) {
    console.error('Erro ao buscar regionais:', error)
    throw createError({
      statusCode: 500,
      message: 'Erro ao buscar regionais'
    })
  }

  return data || []
})
