import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const { email } = await readBody(event)
  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'O e-mail é obrigatório.',
    })
  }

  const supabaseAdmin = await serverSupabaseServiceRole(event)

  // CORREÇÃO: Utilizando a variável correta "supabaseAdmin"
  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
    // CORREÇÃO AQUI: Apontar para a página de update-password
    // Certifique-se de que a Site URL em seu painel Supabase está configurada para http://localhost:3000
    redirectTo: `${config.public.supabase.url}/update-password` 
  });

  if (error) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || 'Ocorreu um erro ao tentar redefinir a senha.',
    })
  }

  return { message: 'E-mail de redefinição de senha enviado com sucesso.' }
})