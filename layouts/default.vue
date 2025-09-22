<template>
  <div class="flex h-screen bg-gray-100">
    <aside class="w-64 flex-shrink-0 bg-gray-800 text-white p-5 flex flex-col">
      <div class="text-center mb-10">
        <img src="/favicon.png" alt="Logo Credvix" class="w-2 mx-auto" />
        <h3 class="text-xl font-bold mt-2">Credvix Admin</h3>
      </div>
      <nav class="flex-grow">
        <ul class="space-y-2">
          <li>
            <NuxtLink to="/" class="nav-link">
              <UIcon name="i-heroicons-home" /> <span>Dashboard</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/funcionarios" class="nav-link">
              <UIcon name="i-heroicons-user-group" /> <span>Funcionários</span>
            </NuxtLink>
          </li>
          </ul>
      </nav>
      <div>
        <button @click="handleLogout" class="nav-link w-full text-red-400 hover:bg-red-900/50">
          <UIcon name="i-heroicons-arrow-left-on-rectangle" />
          <span>Sair</span>
        </button>
      </div>
    </aside>

    <main class="flex-1 p-8 overflow-y-auto">
      <slot />
    </main>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient();
const router = useRouter();

const handleLogout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Erro ao fazer logout:', error);
    return;
  }
  // Redireciona para a página de login após o logout
  router.push('/login');
};
</script>

<style scoped lang="postcss">
.nav-link {
  @apply flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors;
}
.nav-link.router-link-exact-active {
  @apply bg-primary-500 text-white;
}
</style>