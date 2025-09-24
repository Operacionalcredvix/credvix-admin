<template>
  <div class="flex h-screen bg-gray-100">
    <aside class="w-64 flex-shrink-0 bg-gray-800 text-white p-5 flex flex-col">
      <div class="text-center mb-10">
        <img src="/favicon.png" alt="Logo Credvix" class="w-20 mx-auto" />
        <h3 class="text-xl font-bold mt-2">Credvix Admin</h3>
      </div>

      <nav class="flex-grow">
        <ul class="space-y-2">
          <li>
            <NuxtLink to="/" class="nav-link">
              <UIcon name="i-heroicons-home" /> <span>Dashboard</span>
            </NuxtLink>
          </li>

          <li v-for="menu in menuItems" :key="menu.label">
            <UAccordion :items="[menu]" variant="ghost" :ui="{ 'item': { 'padding': 'p-0' } }">
              <template #default="{ item, open }">
                <UButton color="gray" variant="ghost" class="nav-link w-full justify-between">
                  <div class="flex items-center gap-3">
                    <UIcon :name="item.icon" />
                    <span>{{ item.label }}</span>
                  </div>
                  <UIcon name="i-heroicons-chevron-right" class="transition-transform" :class="[open && 'rotate-90']" />
                </UButton>
              </template>

              <template #item="{ item }">
                <ul class="pl-8 py-2 space-y-2">
                  <li v-for="link in item.links" :key="link.to">
                    <NuxtLink :to="link.to" class="nav-link-sub">
                      {{ link.label }}
                    </NuxtLink>
                  </li>
                </ul>
              </template>
            </UAccordion>
          </li>
        </ul>
      </nav>

      <div v-if="profile" class="mt-auto border-t border-gray-700 pt-4">
        <NuxtLink to="/perfil" class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700">
          <UAvatar :src="profile.avatar_url" :alt="profile.nome_completo" icon="i-heroicons-user" size="md" />
          <div class="flex-1 overflow-hidden">
            <p class="text-sm font-semibold truncate">{{ profile.nome_completo }}</p>
            <p class="text-xs text-gray-400">{{ profile.perfis?.nome }}</p>
          </div>
          <UIcon name="i-heroicons-cog-6-tooth" class="text-gray-400" />
        </NuxtLink>
      </div>

      <div class="mt-4">
        <button @click="handleLogout" class="nav-link w-full text-red-400 hover:bg-red-900/50">
          <UIcon name="i-heroicons-arrow-left-on-rectangle" />
          <span>Sair</span>
        </button>
      </div>
    </aside>

    <main class="flex-1 p-8 overflow-y-auto bg-gray-100">
      <slot />
    </main>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient();
const router = useRouter();
const { profile } = useProfile();

// Estrutura completa dos itens do menu principal
const menuItems = [
  {
    label: 'Cadastros',
    icon: 'i-heroicons-archive-box',
    defaultOpen: true, // Para o menu começar aberto
    slot: 'item',
    links: [
      { label: 'Bancos', to: '/cadastros/bancos' },
      { label: 'Lojas', to: '/lojas' },
      { label: 'Funcionários', to: '/funcionarios' },
      { label: 'Produtos', to: '/cadastros/produtos' },
      { label: 'Bancos e Tabelas', to: '/cadastros/banco-tabelas' }
    ]
  },
  {
    label: 'RH',
    icon: 'i-heroicons-briefcase',
    slot: 'item',
    links: [
      { label: 'Vagas', to: '/rh/vagas' },
      { label: 'Currículos', to: '/rh/curriculos' }
      // Futuramente: Relatórios de RH, etc.
    ]
  },
  {
    label: 'Backoffice',
    icon: 'i-heroicons-banknotes',
    slot: 'item',
    links: [
      { label: 'Clientes', to: '/backoffice/clientes' },
      { label: 'Contratos', to: '/backoffice/contratos' }
      // Futuramente: Metas, Produtos, Bancos, etc.
    ]
  }
];

const handleLogout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Erro ao fazer logout:', error);
    return;
  }
  router.push('/login');
};
</script>

<style scoped lang="postcss">
.nav-link {
  @apply flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-left;
}

.nav-link.router-link-exact-active {
  @apply bg-primary-500 text-white;
}

.nav-link-sub {
  @apply flex items-center text-sm px-4 py-1.5 rounded-lg hover:bg-gray-700 transition-colors text-gray-300;
}

.nav-link-sub.router-link-exact-active {
  @apply bg-primary-700 text-white;
}
</style>