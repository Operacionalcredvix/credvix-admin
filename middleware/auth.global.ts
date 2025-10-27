// @ts-nocheck
export default defineNuxtRouteMiddleware(async (to, from) => {
  // Obtém o utilizador atual do Supabase.
  // Esta função é reativa: será 'null' se não estiver logado, ou o objeto do utilizador se estiver.
  const user = useSupabaseUser();
  const supabase = useSupabaseClient();
  const { profile, fetchProfile } = useProfile();

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

  // Se o utilizador estiver logado, garante que o perfil foi carregado
  // e bloqueia acesso caso o funcionário esteja inativo.
  if (user.value) {
    if (!profile.value) {
      await fetchProfile();
    }

    // Se o perfil existir e estiver inativo, encerra a sessão e redireciona para login.
    if (profile.value && profile.value.is_active === false) {
      try {
        if (process.client) {
          await supabase.auth.signOut();
        }
      } catch (e) {
        console.error('[auth.global] Erro ao terminar sessão de utilizador inativo:', e);
      }
      return navigateTo('/login?inactive=1');
    }
  }
});