// @ts-ignore - Nuxt auto-imports
export default defineNuxtRouteMiddleware(async (to) => {
  // @ts-ignore - Nuxt auto-imports
  const { profile, fetchProfile } = useProfile()

  // Garante que o perfil do utilizador está carregado
  if (!profile.value) {
    await fetchProfile()
  }

  // Se mesmo após a tentativa, o perfil não carregar, nega o acesso por segurança.
  if (!profile.value) {
    console.error("Middleware de Auth: Perfil do utilizador não encontrado.");
    // @ts-ignore - Nuxt auto-imports
    return navigateTo('/login'); // Redireciona para login se não houver perfil
  }

  // Pega os perfis permitidos dos metadados da rota.
  const requiredProfiles = to.meta.profiles as string[] | undefined;

  // Se a rota não definir perfis, o acesso é público (dentro das rotas autenticadas).
  if (!requiredProfiles || requiredProfiles.length === 0) {
    return; // Acesso permitido
  }

  const userProfileName = profile.value.perfis?.nome;

  // Se o perfil do usuário não estiver carregado, nega o acesso.
  if (!userProfileName) {
    console.error("Middleware de Auth: Nome do perfil do utilizador não encontrado.");
    // @ts-ignore - Nuxt auto-imports
    return navigateTo('/acesso-negado');
  }

  // Perfis com acesso total (Master, Diretoria, Gerência)
  const perfisComAcessoTotal = ['Master', 'Diretoria', 'Gerência'];
  if (perfisComAcessoTotal.includes(userProfileName)) {
    return;
  }

  // Verifica se o perfil do usuário está na lista de perfis permitidos.
  if (!requiredProfiles.includes(userProfileName)) {
    // @ts-ignore - Nuxt auto-imports
    return navigateTo('/acesso-negado');
  }
})