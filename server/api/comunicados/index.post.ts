// POST /api/comunicados
// Cria um novo comunicado (apenas Master, RH, Financeiro, Administrativo)

import { eventHandler, readBody, createError } from 'h3'
import type { CreateComunicadoInput } from '~/types/comunicados'
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

  // Verifica permissão
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

  const perfisAutorizados = ['Master', 'RH', 'Financeiro', 'Administrativo']
  if (!perfisAutorizados.includes(funcionario.perfis?.nome)) {
    throw createError({
      statusCode: 403,
      message: 'Sem permissão para criar comunicados'
    })
  }

  const body = await readBody<CreateComunicadoInput>(event)

  // Validações
  if (!body.titulo || body.titulo.length < 3) {
    throw createError({
      statusCode: 400,
      message: 'Título deve ter no mínimo 3 caracteres'
    })
  }

  // Precisa ter texto OU imagem
  const temTexto = body.conteudo && body.conteudo.trim().length >= 10
  const temImagem = body.imagem_url && body.imagem_url.trim().length > 0

  if (!temTexto && !temImagem) {
    throw createError({
      statusCode: 400,
      message: 'É obrigatório ter uma mensagem de texto (mín. 10 caracteres) OU uma imagem'
    })
  }

  // Cria comunicado
  const { data, error } = await admin
    .from('comunicados')
    .insert({
      titulo: body.titulo,
      conteudo: body.conteudo,
      categoria: body.categoria || 'Informação',
      imagem_url: body.imagem_url || null,
      perfis_destino: body.perfis_destino || null,
      regionais_destino: body.regionais_destino || null,
      lojas_destino: body.lojas_destino || null,
      usuarios_destino: body.usuarios_destino || null,
      data_envio: body.data_envio || new Date().toISOString(),
      criado_por: funcionario.id
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar comunicado:', error)
    throw createError({
      statusCode: 500,
      message: 'Erro ao criar comunicado'
    })
  }

  return data
})
