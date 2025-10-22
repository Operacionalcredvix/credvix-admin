import { computed } from 'vue';
import { useProfile } from './useProfile';

// --- ESTRUTURA DE DADOS DO MENU COM PERMISSÕES INTEGRADAS ---
// Cada item e subitem agora tem uma propriedade `profiles` que define
// quais perfis podem vê-lo. A ausência de `profiles` significa acesso público (para todos os logados).
const menuItems = [
  {
    label: 'Cadastros',
    icon: 'i-heroicons-archive-box',
    defaultOpen: false,
    slot: 'item',
    profiles: ['Master', 'RH', 'Coordenador'],
    links: [
      { label: 'Regionais', to: '/cadastros/regionais', icon: 'i-heroicons-map-pin', profiles: ['Master', 'RH'] },
      { label: 'Funcionários', to: '/funcionarios', icon: 'i-heroicons-users', profiles: ['Master', 'RH', 'Coordenador'] },
      { label: 'Lojas', to: '/lojas', icon: 'i-heroicons-building-storefront', profiles: ['Master', 'RH'] }
    ]
  },
  {
    label: 'RH',
    icon: 'i-heroicons-briefcase',
    slot: 'item',
    profiles: ['Master', 'RH'],
    links: [
      { label: 'Vagas', to: '/rh/vagas', icon: 'i-heroicons-megaphone' },
      { label: 'Currículos', to: '/rh/curriculos', icon: 'i-heroicons-document-text' },
      { label: 'Histórico de Alocações', to: '/rh/historico-alocacoes', icon: 'i-heroicons-folder-open' }
    ]
  },
  {
    label: 'Propostas',
    icon: 'i-heroicons-bookmark-square',
    slot: 'item',
    profiles: ['Master', 'Backoffice', 'Coordenador', 'Supervisor', 'Consultor'],
    links: [
      { label: 'Contratos', to: '/backoffice/contratos', icon: 'i-heroicons-document-chart-bar' },
      { label: 'Clientes', to: '/backoffice/clientes', icon: 'i-heroicons-user-group' }
    ]
  },
  {
    label: 'Backoffice',
    icon: 'i-heroicons-banknotes',
    slot: 'item',
    profiles: ['Master', 'Backoffice'],
    links: [
      { label: 'Bancos', to: '/cadastros/bancos', icon: 'i-heroicons-building-library' },
      { label: 'Produtos', to: '/cadastros/produtos', icon: 'i-heroicons-shopping-bag' },
      { label: 'Tabelas de Comissão', to: '/cadastros/tabelas', icon: 'i-heroicons-table-cells' }
    ]
  },
  {
    label: 'Admin',
    icon: 'i-heroicons-shield-check',
    slot: 'item',
    profiles: ['Master', 'Backoffice'],
    links: [
      { label: 'Metas', to: '/admin/metas', icon: 'i-heroicons-trophy' },
      { label: 'Importações', to: '/admin/importacoes', icon: 'i-heroicons-arrow-up-tray' }
    ]
  },
  {
    label: 'Relatórios',
    icon: 'i-heroicons-chart-bar-square',
    slot: 'item',
    profiles: ['Master', 'Coordenador', 'Backoffice'],
    links: [
      { label: 'Desempenho por Equipe', to: '/relatorios/desempenho', icon: 'i-heroicons-chart-bar' },
      { label: 'Desempenho Individual', to: '/relatorios/desempenho-individual', icon: 'i-heroicons-user-circle' },
      { label: 'Importações Externas', to: '/admin/relatorio-importacoes', icon: 'i-heroicons-arrow-down-on-square-stack' }
    ]
  }
];

/**
 * Composable para gerir a lógica do menu de navegação. Filtra os itens do menu
 * com base no perfil do utilizador logado, de forma declarativa e segura.
 */
export const useMenu = () => {
  const { profile } = useProfile();

  const filteredMenuItems = computed(() => {
    const userProfile = profile.value?.perfis?.nome;
    if (!userProfile) {
      return [];
    }

    /**
     * Verifica se um item (menu ou link) é permitido para o perfil atual.
     * @param {object} item - O item de menu ou link.
     * @returns {boolean} - True se o acesso for permitido.
     */
    const isAllowed = (item) => {
      // O perfil 'Master' tem acesso a tudo.
      if (userProfile === 'Master') return true;
      // Se o item não define perfis, é público para todos os logados.
      if (!item.profiles) return true;
      // Verifica se o perfil do utilizador está na lista de perfis permitidos.
      return item.profiles.includes(userProfile);
    };

    // 1. Filtra os menus principais que o utilizador pode ver.
    return menuItems.filter(isAllowed)
      // 2. Para cada menu permitido, filtra os seus links internos.
      .map(menu => ({
        ...menu,
        links: menu.links?.filter(isAllowed) || []
      }))
      // 3. Garante que um menu principal só aparece se tiver pelo menos um link visível.
      .filter(menu => menu.links && menu.links.length > 0);
  });

  return {
    menuItems,
    filteredMenuItems
  };
};