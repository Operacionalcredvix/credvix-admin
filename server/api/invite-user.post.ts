import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  // Lê as configurações do Nuxt (que contêm as chaves do .env)
  const config = useRuntimeConfig()
  
  // Lê o email enviado pelo formulário no corpo da requisição
  const { email } = await readBody(event)

  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'O e-mail é obrigatório.',
    })
  }

  // Cria um novo cliente Supabase **no servidor** usando a chave de administrador
  const supabaseAdmin = createClient(
    config.public.supabase.url, 
    config.supabaseServiceKey
  )

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