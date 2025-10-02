<template>
  <div class="flex h-screen bg-gray-100">
    <aside class="flex-shrink-0 bg-gray-800 text-white p-4 flex flex-col transition-all duration-300" :class="[isSidebarCollapsed ? 'w-20 items-center' : 'w-64']">
      <div class="text-center mb-10">
        <img src="/favicon.png" alt="Logo Credvix" class="w-12 mx-auto" />
        <h3 v-if="!isSidebarCollapsed" class="text-xl font-bold mt-2">Credvix Admin</h3>
      </div>

      <nav class="flex-grow">
        <ul class="space-y-2">
          <li>
            <NuxtLink to="/" class="nav-link">
              <UIcon name="i-heroicons-home" class="flex-shrink-0" /> <span v-if="!isSidebarCollapsed">Dashboard</span>
            </NuxtLink>
          </li>

          <template v-if="profile?.perfis?.nome !== 'Consultor'">
            <li v-for="menu in filteredMenuItems" :key="menu.label">
              <UAccordion :items="[menu]" variant="ghost" :ui="{ 'item': { 'padding': 'p-0' } }">
                <template #default="{ item, open }">
                  <UButton color="gray" variant="ghost" class="nav-link w-full" :class="[isSidebarCollapsed ? 'justify-center' : 'justify-between']">
                    <div class="flex items-center gap-3">
                      <UIcon :name="item.icon" class="flex-shrink-0" />
                      <span v-if="!isSidebarCollapsed">{{ item.label }}</span>
                    </div>
                    <UIcon name="i-heroicons-chevron-right" class="transition-transform"
                      :class="[open && 'rotate-90']" />
                  </UButton>
                </template>

                <template #item="{ item }">
                  <ul class="py-2 space-y-2" :class="[isSidebarCollapsed ? 'pl-2' : 'pl-8']">
                    <li v-for="link in item.links" :key="link.to">
                      <NuxtLink :to="link.to" class="nav-link-sub" :title="link.label">
                        <UIcon v-if="link.icon" :name="link.icon" class="text-lg" />
                        <span v-if="!isSidebarCollapsed">{{ link.label }}</span>
                      </NuxtLink>
                    </li>
                  </ul>
                </template>
              </UAccordion>
            </li>
          </template>
          <li v-if="profile?.perfis?.nome === 'Master'">
            <NuxtLink to="/auditoria" class="nav-link">
              <UIcon name="i-heroicons-shield-check" class="flex-shrink-0" /> <span v-if="!isSidebarCollapsed">Auditoria</span>
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <!-- Botão para recolher/expandir -->
      <div class="mt-auto border-t border-gray-700 pt-4">
        <UButton color="gray" variant="ghost" class="nav-link w-full" :class="[isSidebarCollapsed ? 'justify-center' : '']" @click="isSidebarCollapsed = !isSidebarCollapsed">
          <UIcon name="i-heroicons-arrows-right-left" class="flex-shrink-0" />
        </UButton>
      </div>

      <!-- A seção de perfil e logout foi movida para o cabeçalho principal -->
    </aside>

    <main class="flex-1 p-8 overflow-y-auto">
      <!-- NOVO CABEÇALHO -->
      <header v-if="profile" class="flex justify-end items-center -mt-4 -mx-4 mb-8">
        <div class="flex items-center gap-4">
          <ClientOnly>
            <UButton
              :icon="isDark ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'"
              color="green"
              aria-label="Theme"
              @click="isDark = !isDark"
            />
          </ClientOnly>
          <UDropdown :items="profileDropdownItems" :popper="{ placement: 'bottom-end' }">
            <UButton color="green" class="flex items-center gap-3 p-2">
              <UAvatar :src="profile.avatar_url" :alt="profile.nome_completo" size="sm" />
              <div class="text-left hidden sm:block">
                <p class="text-sm font-medium truncate text-gray-700 dark:text-gray-200">{{ profile.nome_completo }}</p>
                <p class="text-xs text-black-500 dark:text-gray-400">{{ profile.perfis?.nome }}</p>
              </div>
              <UIcon name="i-heroicons-chevron-down" class="text-gray-400 dark:text-gray-500" />
            </UButton>
          </UDropdown>
        </div>
      </header>

      <!-- Breadcrumb -->
      <UBreadcrumb :links="breadcrumbItems" class="mb-8" />

      <slot />
    </main>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient();
const router = useRouter();
const route = useRoute();
import { computed } from 'vue';
const { profile } = useProfile();

// Lógica para o modo escuro (dark mode)
const colorMode = useColorMode();
const isDark = computed({
  get () {
    return colorMode.value === 'dark';
  },
  set () {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
  }
});

// --- LÓGICA DO TÍTULO DA PÁGINA DINÂMICO ---
const pageTitle = computed(() => {
  const baseTitle = 'Credvix Admin';
  const currentPath = route.path;

  // Lista de todas as rotas com seus títulos
  const allLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/perfil', label: 'Meu Perfil' },
    { to: '/auditoria', label: 'Auditoria' },
    ...menuItems.flatMap(menu => menu.links || [])
  ];

  const matchedLink = allLinks.find(link => link.to === currentPath);

  return matchedLink ? `${matchedLink.label} | ${baseTitle}` : baseTitle;
});

useHead({ title: pageTitle });

// Estado para controlar se o menu está recolhido
const isSidebarCollapsed = useCookie('sidebar-collapsed', { default: () => false });

// Estrutura completa dos itens do menu principal
const menuItems = [
  {
    label: 'Cadastros',
    icon: 'i-heroicons-archive-box',
    defaultOpen: true, // Para o menu começar aberto
    slot: 'item',
    links: [
      { label: 'Regionais', to: '/cadastros/regionais', icon: 'i-heroicons-map-pin' },
      { label: 'Funcionários', to: '/funcionarios', icon: 'i-heroicons-users' },
      { label: 'Lojas', to: '/lojas', icon: 'i-heroicons-building-storefront' }
    ]
  },
  {
    label: 'RH',
    icon: 'i-heroicons-briefcase',
    slot: 'item',
    links: [
      { label: 'Vagas', to: '/rh/vagas', icon: 'i-heroicons-megaphone' },
      { label: 'Currículos', to: '/rh/curriculos', icon: 'i-heroicons-document-text' }
      // Futuramente: Relatórios de RH, etc.
    ]
  },
  {
    label: 'Backoffice',
    icon: 'i-heroicons-banknotes',
    slot: 'item',
    links: [
      { label: 'Clientes', to: '/backoffice/clientes', icon: 'i-heroicons-user-group' },
      { label: 'Contratos', to: '/backoffice/contratos', icon: 'i-heroicons-document-chart-bar' },
      { label: 'Bancos', to: '/cadastros/bancos', icon: 'i-heroicons-building-library' },
      { label: 'Produtos', to: '/cadastros/produtos', icon: 'i-heroicons-shopping-bag' },
      { label: 'Bancos e Tabelas', to: '/cadastros/banco-tabelas', icon: 'i-heroicons-table-cells' }
      // Futuramente: Metas, Produtos, Bancos, etc.
    ]
  }
];

// --- LÓGICA DO BREADCRUMB DINÂMICO ---
const breadcrumbItems = computed(() => {
  const items = [{ label: 'Dashboard', to: '/' }];
  const currentPath = route.path;

  // 1. Lidar com páginas de nível superior que não estão aninhadas nos menuItems
  if (currentPath === '/perfil') {
    items.push({ label: 'Meu Perfil', to: '/perfil' });
    return items;
  }
  if (currentPath === '/auditoria') {
    items.push({ label: 'Auditoria', to: '/auditoria' });
    return items;
  }

  let matchedMainMenu = null;
  let matchedSubMenuLink = null;

  // 2. Iterar sobre os itens do menu principal para encontrar uma correspondência
  for (const menu of menuItems) {
    // Verificar se o caminho atual corresponde exatamente a um link de submenu
    const exactSubmenuMatch = menu.links?.find(link => link.to === currentPath);
    if (exactSubmenuMatch) {
      matchedMainMenu = menu;
      matchedSubMenuLink = exactSubmenuMatch;
      break;
    }

    // Verificar se o caminho atual é um sub-caminho de algum link de submenu (para rotas dinâmicas)
    // Ex: /backoffice/contratos/editar/123 deve corresponder a /backoffice/contratos
    const potentialParentLink = menu.links?.find(link =>
      currentPath.startsWith(link.to + '/') && link.to !== '/'
    );
    if (potentialParentLink) {
      matchedMainMenu = menu;
      matchedSubMenuLink = potentialParentLink;
      break;
    }
  }

  if (matchedMainMenu) {
    // Adicionar o item do menu principal ao breadcrumb
    // O 'to' aponta para o primeiro link do submenu como ponto de entrada da seção
    items.push({ label: matchedMainMenu.label, to: matchedMainMenu.links[0].to });

    if (matchedSubMenuLink) {
      // Adicionar o item do submenu ao breadcrumb
      items.push({ label: matchedSubMenuLink.label, to: matchedSubMenuLink.to });

      // Se for uma rota dinâmica, adicionar a parte dinâmica
      if (currentPath.startsWith(matchedSubMenuLink.to + '/') && currentPath !== matchedSubMenuLink.to) {
        const remainingPath = currentPath.substring(matchedSubMenuLink.to.length); // Ex: "/editar/123"
        const segments = remainingPath.split('/').filter(Boolean); // Ex: ["editar", "123"]

        if (segments.length > 0 && segments[0] === 'editar' && route.params.id) {
          items.push({ label: `Editar Contrato #${route.params.id}`, to: currentPath });
        }
      }
    }
  }

  return items;
});

// NOVO: Itens para o dropdown do perfil
const profileDropdownItems = [
  [{
    label: 'Meu Perfil',
    icon: 'i-heroicons-user-circle',
    to: '/perfil'
  }],
  [{
    label: 'Sair',
    icon: 'i-heroicons-arrow-left-on-rectangle',
    click: () => handleLogout()
  }]
];

// Filtra os itens do menu com base no perfil do utilizador
const filteredMenuItems = computed(() => {
  const userProfile = profile.value?.perfis?.nome;
  if (!userProfile) return [];

  // Mapeamento de permissões por menu
  const menuPermissions = {
    'Cadastros': ['Master', 'RH', 'Coordenador'],
    'RH': ['Master', 'RH'],
    'Backoffice': ['Master', 'Backoffice']
  };

  return menuItems.filter(menu => {
    // Se o perfil do utilizador estiver na lista de permissões do menu, mostra o menu
    return menuPermissions[menu.label]?.includes(userProfile);
  }).map(menu => {
    // Para o Coordenador, mostra apenas o link "Funcionários" dentro de "Cadastros"
    if (userProfile === 'Coordenador' && menu.label === 'Cadastros') {
      return { ...menu, links: menu.links.filter(link => link.label === 'Funcionários') };
    }
    return menu;
  });
});

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
  @apply flex items-center gap-3 text-sm px-4 py-1.5 rounded-lg hover:bg-gray-700 transition-colors text-gray-300;
}

.nav-link-sub.router-link-exact-active {
  @apply bg-primary-700 text-white;
}
</style>