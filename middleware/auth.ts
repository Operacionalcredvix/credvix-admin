// middleware/auth.ts

const profileRoutes = {
  master: (path: string) => true, // Master tem acesso a tudo,
  rh: (path: string) => path.startsWith('/cadastros') || path.startsWith('/rh'), // RH tem acesso a Cadastros e RH
  coordenador: (path: string) => path.startsWith('/cadastros/funcionarios'), // Coordenador só tem acesso a Funcionários
  backoffice: (path: string) => path.startsWith('/backoffice'), // Backoffice tem acesso a Backoffice
  supervisor: (path: string) => false, // Não tem acesso a nenhuma rota protegida
  consultor: (path: string) => false, // Não tem acesso a nenhuma rota protegida
}

export default defineNuxtRouteMiddleware(async (to) => {
  const { profile, fetchProfile } = useProfile()

  // Garante que o perfil do utilizador está carregado
  if (!profile.value) {
    await fetchProfile()
  }

  // Se mesmo após a tentativa, o perfil não carregar, nega o acesso por segurança.
  if (!profile.value) {
    console.error("Middleware de Auth: Perfil do utilizador não encontrado.");
    return navigateTo('/login'); // Redireciona para login se não houver perfil
  }

  const userProfileName = profile.value?.perfis?.nome?.toLowerCase();
  const isAllowedCheck = profileRoutes[userProfileName] || (() => false);
  const isAllowed = isAllowedCheck(to.path);

  // Se o utilizador não tiver permissão, redireciona para a página de acesso negado.
  if (!isAllowed && to.path !== '/acesso-negado') { // Evita loop de redirecionamento
    return navigateTo('/acesso-negado');
  }
})