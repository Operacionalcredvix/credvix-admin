import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Lê o email enviado pelo formulário no corpo da requisição
  const { email } = await readBody(event)

  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'O e-mail é obrigatório.',
    })
  }

  // Usa o cliente Supabase com service role
  const supabaseAdmin = await serverSupabaseServiceRole(event)

  // Chama a função de convite de forma segura
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)

  if (error) {
    // Retorna uma mensagem de erro clara para o formulário
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || 'Ocorreu um erro ao convidar o usuário.',
    })
  }

  // Se tudo deu certo, retorna os dados do usuário criado
  return data.user
})