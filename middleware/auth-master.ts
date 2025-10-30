// @ts-ignore - Nuxt auto-imports
export default defineNuxtRouteMiddleware((to, from) => {
  // @ts-ignore - Nuxt auto-imports
  const { profile } = useProfile();
  // @ts-ignore - Nuxt auto-imports
  const toast = useToast();

  // Perfis com acesso total (Master, Diretoria, Gerência)
  const perfisComAcessoTotal = ['Master', 'Diretoria', 'Gerência'];
  
  // Aguarda o perfil ser carregado
  if (profile.value && !perfisComAcessoTotal.includes(profile.value.perfis?.nome)) {
    toast.add({
      title: 'Acesso Negado',
      description: 'Você não tem permissão para aceder a esta página.',
      color: 'red'
    });
    // @ts-ignore - Nuxt auto-imports
    return navigateTo('/'); // Redireciona para a página inicial
  }
});