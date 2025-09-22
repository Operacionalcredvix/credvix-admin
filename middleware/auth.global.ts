export default defineNuxtRouteMiddleware((to, from) => {
  // Obtém o utilizador atual do Supabase.
  // Esta função é reativa: será 'null' se não estiver logado, ou o objeto do utilizador se estiver.
  const user = useSupabaseUser();

  // Se o utilizador NÃO estiver logado e tentar aceder a qualquer página
  // que NÃO seja a de login, redireciona-o para a página de login.
  if (!user.value && to.path !== '/login') {
    return navigateTo('/login');
  }

  // Se o utilizador ESTIVER logado e tentar aceder à página de login,
  // redireciona-o para a página principal (dashboard).
  if (user.value && to.path === '/login') {
    return navigateTo('/');
  }
});