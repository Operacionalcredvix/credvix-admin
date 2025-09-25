export default defineNuxtRouteMiddleware((to, from) => {
  const { profile } = useProfile();
  const toast = useToast();

  // Aguarda o perfil ser carregado
  if (profile.value && profile.value.perfis?.nome !== 'Master') {
    toast.add({
      title: 'Acesso Negado',
      description: 'Você não tem permissão para aceder a esta página.',
      color: 'red'
    });
    return navigateTo('/'); // Redireciona para a página inicial
  }
});