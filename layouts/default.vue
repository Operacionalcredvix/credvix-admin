<template>
  <div>
    <!-- Barra de Progresso de Navegação -->
    <NuxtLoadingIndicator color="repeating-linear-gradient(to right, #0ea5e9 0%, #2563eb 50%, #0ea5e9 100%)" />
    <div class="flex h-screen bg-gray-100 dark:bg-gray-900">
      <aside class="flex-shrink-0 bg-gray-800 text-white p-4 flex flex-col transition-all duration-300" :class="[isSidebarCollapsed ? 'w-20 items-center' : 'w-64']">
      <div class="text-center mb-10">
        <img src="/favicon.png" alt="Logo Credvix" class="w-12 mx-auto" />
        <h3 class="text-xl font-bold mt-2 transition-all duration-300" :class="{'opacity-0 w-0 h-0 overflow-hidden': isSidebarCollapsed}">Farol Credvix</h3>
      </div>

      <nav class="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pr-2">
            <ul class="space-y-2">
              <li>
                <NuxtLink to="/" class="nav-link">
                  <UIcon name="i-heroicons-home" class="flex-shrink-0" /> <span v-if="!isSidebarCollapsed"></span>
                  <span class="transition-all duration-300" :class="{'opacity-0 max-w-0 overflow-hidden': isSidebarCollapsed}">Dashboard</span>
                </NuxtLink>
              </li>

              <li v-for="menu in displayedMenuItems" :key="menu.label">
              <UAccordion :items="[menu]" variant="ghost" :ui="{ 'item': { 'padding': 'p-0' } }">
                <template #default="{ item, open }">
                  <UButton color="gray" variant="ghost" class="nav-link w-full" :class="[isSidebarCollapsed ? 'justify-center' : 'justify-between']">
                    <div class="flex items-center gap-3 overflow-hidden">
                      <UIcon :name="item.icon" class="flex-shrink-0" />
                      <span class="transition-all duration-300" :class="{'opacity-0 max-w-0 overflow-hidden': isSidebarCollapsed}">{{ item.label }}</span>
                    </div>
                    <UIcon name="i-heroicons-chevron-right" class="transition-transform"
                      :class="[open && 'rotate-90']" />
                  </UButton>
                </template>

                <template #item="{ item }">
                  <ul
                    class="py-2 space-y-2"
                    :class="[isSidebarCollapsed ? 'pl-2' : 'pl-8']"
                    :key="`${menu.label}-${isSidebarCollapsed}`"
                    @click="isSidebarCollapsed && (isSidebarCollapsed.value = false)"
                  >
                    <li v-for="link in item.links" :key="link.to">
                      <NuxtLink :to="link.to" class="nav-link-sub" :title="link.label" :class="{'justify-center': isSidebarCollapsed}">
                        <UIcon v-if="link.icon" :name="link.icon" class="text-lg" /> <span class="transition-all duration-300" :class="{'opacity-0 max-w-0 overflow-hidden': isSidebarCollapsed}">{{ link.label }}</span>
                      </NuxtLink>
                    </li>
                  </ul>
                </template>
              </UAccordion>
            </li>
        </ul>
      </nav>

      <!-- Versão do sistema com popover (sidebar expandida) -->
      <div v-if="systemVersion && !isSidebarCollapsed" class="px-2 mb-2">
        <UPopover :popper="{ placement: 'right' }" mode="click">
          <template #default>
            <button class="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white group">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-information-circle" class="w-4 h-4 flex-shrink-0" />
                <span class="text-xs font-medium">v{{ systemVersion.version }}</span>
              </div>
              <UIcon name="i-heroicons-chevron-right" class="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </template>

          <template #panel="{ close }">
            <div class="w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
              <!-- Header -->
              <div class="bg-gradient-to-r from-primary-600 to-primary-700 p-4 text-white">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-base font-bold">Versão Atual</h3>
                    <p class="text-sm text-primary-100 mt-0.5">v{{ systemVersion.version }}</p>
                  </div>
                  <UBadge color="white" variant="solid" size="sm">Atual</UBadge>
                </div>
              </div>

              <!-- Últimas versões -->
              <div class="p-4 max-h-96 overflow-y-auto">
                <div v-if="loadingVersionHistory" class="text-center py-4">
                  <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin mx-auto text-gray-400" />
                </div>
                
                <div v-else-if="versionHistory.length > 0" class="space-y-3">
                  <div v-for="(version, index) in versionHistory" :key="version.id" class="relative">
                    <!-- Timeline line -->
                    <div v-if="index < versionHistory.length - 1" class="absolute left-2 top-8 w-0.5 h-full bg-gray-200 dark:bg-gray-700"></div>
                    
                    <div class="flex gap-3">
                      <!-- Timeline dot -->
                      <div class="relative z-10 flex-shrink-0">
                        <div class="w-4 h-4 rounded-full mt-1" :class="index === 0 ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'"></div>
                      </div>
                      
                      <!-- Content -->
                      <div class="flex-1 pb-4">
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-sm font-semibold text-gray-900 dark:text-white">v{{ version.version }}</span>
                          <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatRelativeDate(version.created_at) }}</span>
                        </div>
                        <p v-if="version.description" class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{{ version.description }}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else class="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                  Nenhum histórico disponível
                </div>
              </div>

              <!-- Footer -->
              <div class="border-t border-gray-200 dark:border-gray-700 p-3 flex justify-between items-center">
                <NuxtLink to="/admin/versao-sistema" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium" @click="close">
                  Ver todas as versões →
                </NuxtLink>
                <UButton size="xs" color="gray" variant="ghost" @click="close">Fechar</UButton>
              </div>
            </div>
          </template>
        </UPopover>
      </div>

      <!-- Versão do sistema (sidebar recolhida) -->
      <div v-if="systemVersion && isSidebarCollapsed" class="mb-2 flex justify-center">
        <UPopover :popper="{ placement: 'right' }" mode="click">
          <template #default>
            <button class="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors" aria-label="Versão do sistema">
              <UIcon name="i-heroicons-information-circle" class="w-5 h-5" />
            </button>
          </template>

          <template #panel="{ close }">
            <div class="w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
              <!-- Header -->
              <div class="bg-gradient-to-r from-primary-600 to-primary-700 p-4 text-white">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-base font-bold">Versão Atual</h3>
                    <p class="text-sm text-primary-100 mt-0.5">v{{ systemVersion.version }}</p>
                  </div>
                  <UBadge color="white" variant="solid" size="sm">Atual</UBadge>
                </div>
              </div>

              <!-- Últimas versões -->
              <div class="p-4 max-h-96 overflow-y-auto">
                <div v-if="loadingVersionHistory" class="text-center py-4">
                  <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin mx-auto text-gray-400" />
                </div>
                
                <div v-else-if="versionHistory.length > 0" class="space-y-3">
                  <div v-for="(version, index) in versionHistory" :key="version.id" class="relative">
                    <!-- Timeline line -->
                    <div v-if="index < versionHistory.length - 1" class="absolute left-2 top-8 w-0.5 h-full bg-gray-200 dark:bg-gray-700"></div>
                    
                    <div class="flex gap-3">
                      <!-- Timeline dot -->
                      <div class="relative z-10 flex-shrink-0">
                        <div class="w-4 h-4 rounded-full mt-1" :class="index === 0 ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'"></div>
                      </div>
                      
                      <!-- Content -->
                      <div class="flex-1 pb-4">
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-sm font-semibold text-gray-900 dark:text-white">v{{ version.version }}</span>
                          <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatRelativeDate(version.created_at) }}</span>
                        </div>
                        <p v-if="version.description" class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{{ version.description }}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else class="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                  Nenhum histórico disponível
                </div>
              </div>

              <!-- Footer -->
              <div class="border-t border-gray-200 dark:border-gray-700 p-3 flex justify-between items-center">
                <NuxtLink to="/admin/versao-sistema" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium" @click="close">
                  Ver todas as versões →
                </NuxtLink>
                <UButton size="xs" color="gray" variant="ghost" @click="close">Fechar</UButton>
              </div>
            </div>
          </template>
        </UPopover>
      </div>

      <!-- Botão para recolher/expandir -->
      <div class="mt-auto border-t border-gray-700 pt-4">
        <UButton color="gray" variant="ghost" class="nav-link w-full" :class="[isSidebarCollapsed ? 'justify-center' : 'justify-between']" @click="isSidebarCollapsed = !isSidebarCollapsed">
          <UIcon name="i-heroicons-arrows-right-left" class="flex-shrink-0" /> <span class="transition-all duration-300" :class="{'opacity-0 max-w-0 overflow-hidden': isSidebarCollapsed}">{{ isSidebarCollapsed ? '' : 'Recolher' }}</span>
        </UButton>
      </div>

      <!-- A seção de perfil e logout foi movida para o cabeçalho principal -->
    </aside>

    <main class="flex-1 p-8 overflow-y-auto">
      <!-- NOVO CABEÇALHO -->
      <header v-if="profile" class="flex justify-end items-center -mt-4 -mx-4 mb-8">
        <div class="flex items-center gap-4">
           <!-- Badge de Notificações -->
           <ClientOnly>
             <NotificacoesBadge />
           </ClientOnly>
         
           <!-- Botão de Tema -->
          <ClientOnly>
            <UButton
              :icon="isDark ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'"
              color="gray" variant="ghost"
              aria-label="Theme"
              @click="isDark = !isDark"
            />
          </ClientOnly>
         
           <!-- Dropdown do Usuário -->
          <UDropdown v-model:open="isDropdownOpen" :items="profileDropdownItems" :popper="{ placement: 'bottom-end' }" :ui="{ width: 'w-80' }">
            <UButton color="gray" variant="ghost" class="flex items-center gap-3 p-2">
              <UAvatar :src="profile.avatar_url" :alt="profile.nome_completo" size="sm" />
              <div class="text-left hidden sm:block">
                <p class="text-sm font-medium truncate text-gray-700 dark:text-gray-200">{{ profile.nome_completo }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ profile.perfis?.nome }}</p>
              </div>
              <UIcon name="i-heroicons-chevron-down" class="text-gray-400 dark:text-gray-500" />
            </UButton>

            <template #item="{ item }">
              <div v-if="item.isAccordion" class="w-full" @click.stop>
                <UAccordion :items="[item.accordion]" variant="ghost" :ui="{ item: { padding: 'p-0' } }">
                  <template #default="{ item: accordionItem, open }">
                    <UButton color="gray" variant="ghost" class="w-full justify-between px-3 py-2" @click.stop>
                      <div class="flex items-center gap-2">
                        <UIcon :name="accordionItem.icon" class="text-lg" />
                        <span>{{ accordionItem.label }}</span>
                      </div>
                      <UIcon name="i-heroicons-chevron-right" class="transition-transform" :class="[open && 'rotate-90']" />
                    </UButton>
                  </template>

                  <template #item="{ item: accordionItem }">
                    <div class="py-1 pl-4" @click.stop>
                      <button 
                        v-for="link in accordionItem.links" 
                        :key="link.to" 
                        @click.stop="handleNavigate(link.to)"
                        class="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full text-left"
                      >
                        <UIcon :name="link.icon" class="text-base" />
                        <span>{{ link.label }}</span>
                      </button>
                    </div>
                  </template>
                </UAccordion>
              </div>
              <span v-else class="flex items-center gap-2 truncate">
                <UIcon v-if="item.icon" :name="item.icon" class="flex-shrink-0 w-5 h-5" />
                {{ item.label }}
              </span>
            </template>
          </UDropdown>
        </div>
      </header>

      <!-- Breadcrumb -->
      <UBreadcrumb :links="breadcrumbItems" class="mb-8" />

      <slot />
    </main>
    </div>
    <!-- Rodapé antigo removido: versão agora exibida de forma discreta na sidebar -->

    <!-- Ecrã de Carregamento Global -->
    <LoadingScreen />
    <!-- Modal de Aviso de Inatividade -->
    <InactivityWarningModal />
  </div>
</template>

<script setup>
// Heartbeat de sessão para renovar o token automaticamente
useSessionHeartbeat();
const supabase = useSupabaseClient();
const router = useRouter();
const route = useRoute();
import { computed, ref, nextTick, onMounted, watch } from 'vue';
const { profile } = useProfile();
// NOVO: Usa o composable para obter os itens de menu filtrados
const { menuItems, filteredMenuItems } = useMenu();

// Ref para controlar o estado do dropdown
const isDropdownOpen = ref(false);

// Computed que determina quais itens devem ser exibidos no menu
// Por padrão usamos o filteredMenuItems. Porém, quando o utilizador está
// na página principal (Dashboard) e o perfil for 'Backoffice', mostramos
// apenas os menus 'Propostas' e 'Backoffice' conforme solicitado.

const displayedMenuItems = computed(() => {
  try {
    const isDashboardRoot = route.path === '/';
    const userProfile = profile?.perfis?.nome;
    if (isDashboardRoot && userProfile === 'Backoffice') {
      // Filtra apenas Propostas e Backoffice do conjunto já filtrado por perfis
      return filteredMenuItems.value.filter(item => ['Propostas', 'Backoffice'].includes(item.label));
    }
    return filteredMenuItems.value;
  } catch (e) {
    return filteredMenuItems.value;
  }
});

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

// Estado para controlar se o menu está recolhido
const isSidebarCollapsed = useCookie('sidebar-collapsed', { default: () => false });

// --- LÓGICA DO TÍTULO DA PÁGINA DINÂMICO ---
const pageTitle = computed(() => {
  const baseTitle = 'Farol Credvix';
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

// Função para navegar e fechar o dropdown
const handleNavigate = async (path) => {
  isDropdownOpen.value = false;
  await nextTick();
  await navigateTo(path);
};

// NOVO: Itens para o dropdown do perfil
const profileDropdownItems = computed(() => {
  const items = [
    [{
      label: 'Meu Perfil',
      icon: 'i-heroicons-user-circle',
      to: '/perfil'
    }]
  ];

  // Adiciona o menu de Segurança com accordion apenas para Master
  if (profile.value?.perfis?.nome === 'Master') {
    items.push([{
      isAccordion: true,
      accordion: {
        label: 'Segurança',
        icon: 'i-heroicons-shield-check',
        slot: 'item',
        links: [
          { label: 'Auditoria', icon: 'i-heroicons-clipboard-document-list', to: '/auditoria' },
          { label: 'Auditoria de Logins', icon: 'i-heroicons-finger-print', to: '/admin/auditoria-logins' },
          { label: 'Rate Limit', icon: 'i-heroicons-shield-exclamation', to: '/admin/rate-limit' },
          { label: 'Alertas de Segurança', icon: 'i-heroicons-bell-alert', to: '/admin/alertas-seguranca' },
          { label: 'Sessões Ativas', icon: 'i-heroicons-user-group', to: '/admin/sessoes-ativas' },
          { label: 'Auditoria de Falhas', icon: 'i-heroicons-exclamation-triangle', to: '/admin/auditoria-falhas' },
          { label: 'Versão do Sistema', icon: 'i-heroicons-code-bracket', to: '/admin/versao-sistema' }
        ]
      }
    }]);
  }

  items.push([{
    label: 'Sair',
    icon: 'i-heroicons-arrow-left-on-rectangle',
    click: () => handleLogout()
  }]);

  return items;
});

const handleLogout = async () => {
  try {
    // Tenta registrar o logout na auditoria, se houver um login_id
    const loginId = typeof window !== 'undefined' ? sessionStorage.getItem('login_id') : null;
    if (loginId) {
      try {
        await supabase.rpc('registrar_logout', { p_login_id: Number(loginId) });
        sessionStorage.removeItem('login_id');
        sessionStorage.removeItem('login_tracked');
      } catch (e) {
        console.warn('[Auditoria] Falha ao registrar logout manual:', e);
      }
    }
  } finally {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Erro ao fazer logout:', error);
    }
    // Força um recarregamento completo para a página de login para limpar todo o estado.
    window.location.href = '/login';
  }
};

// --- BUSCA DA VERSÃO DO SISTEMA (rodapé e sidebar) ---
const { data: _sysVersionResp } = useFetch('/api/system-version');
const systemVersion = computed(() => _sysVersionResp.value?.data || null);

// Histórico de versões
const versionHistory = ref([]);
const loadingVersionHistory = ref(false);

const fetchVersionHistory = async () => {
  loadingVersionHistory.value = true;
  try {
    const { data } = await supabase
      .from('system_version')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (data) {
      versionHistory.value = data;
    }
  } catch (error) {
    console.error('Erro ao buscar histórico de versões:', error);
  } finally {
    loadingVersionHistory.value = false;
  }
};

// Buscar histórico quando a versão atual for carregada
watch(systemVersion, (newVal) => {
  if (newVal) {
    fetchVersionHistory();
  }
}, { immediate: true });

// Formatar data relativa
const formatRelativeDate = (date) => {
  if (!date) return '';
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  return past.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};
</script>



<style scoped lang="postcss">
.nav-link {
  @apply flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-left text-white;
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

/* Scrollbar personalizado para o sidebar */
nav::-webkit-scrollbar {
  width: 6px;
}

nav::-webkit-scrollbar-track {
  background: #1f2937; /* gray-800 */
  border-radius: 3px;
}

nav::-webkit-scrollbar-thumb {
  background: #4b5563; /* gray-600 */
  border-radius: 3px;
}

nav::-webkit-scrollbar-thumb:hover {
  background: #6b7280; /* gray-500 */
}

/* Firefox scrollbar */
nav {
  scrollbar-width: thin;
  scrollbar-color: #4b5563 #1f2937;
}
</style>