// GET /api/comunicados
// Lista todos os comunicados (com filtros)

import { eventHandler, getQuery, createError } from 'h3'
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
    .select('id, perfis!inner(nome)')
    .eq('user_id', user.id)
    .single()

  if (funcError || !funcionario) {
    throw createError({
      statusCode: 404,
      message: 'Funcionário não encontrado'
    })
  }

  const query = getQuery(event)
  const { categoria, ativo } = query

  let queryBuilder = admin
    .from('comunicados')
    .select(`
      *,
      criado_por_funcionario:funcionarios!comunicados_criado_por_fkey(id, nome_completo)
    `)
    .order('data_envio', { ascending: false })

  // Filtros opcionais
  if (categoria) {
    queryBuilder = queryBuilder.eq('categoria', categoria)
  }

  if (ativo !== undefined) {
    queryBuilder = queryBuilder.eq('ativo', ativo === 'true')
  }

  const { data, error } = await queryBuilder

  if (error) {
    console.error('Erro ao buscar comunicados:', error)
    throw createError({
      statusCode: 500,
      message: 'Erro ao buscar comunicados'
    })
  }

  return data || []
})
