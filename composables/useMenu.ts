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
    links: [
      { label: 'Regionais', to: '/cadastros/regionais', icon: 'i-heroicons-map-pin' },
      { label: 'Funcionários', to: '/funcionarios', icon: 'i-heroicons-users' },
      { label: 'Lojas', to: '/lojas', icon: 'i-heroicons-building-storefront' },
  { label: 'Sistemas por Funcionário', to: '/cadastros/sistemas-funcionarios', icon: 'i-heroicons-rectangle-stack', profiles: ['Master','Diretoria','Gerência','RH'] }
    ]
  },
  {
    label: 'RH',
    icon: 'i-heroicons-briefcase',
    slot: 'item',
    links: [
      { label: 'Vagas', to: '/rh/vagas', icon: 'i-heroicons-megaphone' },
      { label: 'Currículos', to: '/rh/curriculos', icon: 'i-heroicons-document-text' },
      { label: 'Histórico de Alocações', to: '/rh/historico-alocacoes', icon: 'i-heroicons-folder-open' },
  { label: 'Funcionários em Experiência', to: '/rh/funcionarios-experiencia', icon: 'i-heroicons-clock', profiles: ['Master','Diretoria','Gerência', 'RH'] }
    ]
  },
  {
    label: 'Propostas',
    icon: 'i-heroicons-bookmark-square',
    slot: 'item',
    links: [
      { label: 'Contratos', to: '/backoffice/contratos', icon: 'i-heroicons-document-chart-bar' },
      { label: 'Clientes', to: '/backoffice/clientes', icon: 'i-heroicons-user-group' }
    ]
  },
  {
    label: 'Backoffice',
    icon: 'i-heroicons-banknotes',
    slot: 'item',
    links: [
      { label: 'Bancos', to: '/cadastros/bancos', icon: 'i-heroicons-building-library' },
      { label: 'Produtos', to: '/cadastros/produtos', icon: 'i-heroicons-shopping-bag' },
      { label: 'Tabelas de Comissão', to: '/cadastros/tabelas', icon: 'i-heroicons-table-cells' }
    ]
  },
  {
    label: 'Requisições',
    icon: 'i-heroicons-clipboard-document-list',
    slot: 'item',
    links: [
      { label: 'Minhas Requisições', to: '/requisicoes', icon: 'i-heroicons-document-text' },
      { label: 'Nova Requisição', to: '/requisicoes/nova', icon: 'i-heroicons-plus-circle' },
      // O link Dashboard deve ser visível apenas para perfis administrativos/sêniores
      // (não exibido para Coordenador, Supervisor e Consultor conforme regra de negócio)
      { label: 'Dashboard', to: '/requisicoes/dashboard', icon: 'i-heroicons-chart-bar', profiles: ['Master','Diretoria','Gerência','Backoffice','RH','Administrativo','Financeiro','TI'] }
    ]
  },
  {
    label: 'Importações',
    // ícone atualizado para representar upload/importações
    icon: 'i-heroicons-cloud-arrow-up',
    slot: 'item',
    links: [
      { label: 'Metas', to: '/admin/metas', icon: 'i-heroicons-trophy' },
      { label: 'Seguros', to: '/admin/importacoes', icon: 'i-heroicons-arrow-up-tray' }
    ]
  },
  {
    label: 'Financeiro',
    icon: 'i-heroicons-currency-dollar',
    slot: 'item',
    links: [
      { label: 'Contas a Pagar', to: '/financeiro/contas-a-pagar', icon: 'i-heroicons-document-text', profiles: ['Master','Diretoria','Financeiro'] }
    ]
  },
  {
    label: 'Relatórios',
    icon: 'i-heroicons-chart-bar-square',
    slot: 'item',
    links: [
      { label: 'Desempenho por Equipe', to: '/relatorios/desempenho', icon: 'i-heroicons-chart-bar' },
      { label: 'Desempenho Individual', to: '/relatorios/desempenho-individual', icon: 'i-heroicons-user-circle' },
  { label: 'Diárias de Consignado', to: '/relatorios/diarias-consignado', icon: 'i-heroicons-calendar-days', profiles: ['Master','Diretoria','Gerência'] },
      { label: 'Relatório de Seguros', to: '/admin/relatorio-importacoes', icon: 'i-heroicons-shield-check' }
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
    // Leitura segura do perfil (evita erros de tipagem em tempo de build)
  // Evita erro de tipagem convertendo profile.value para any
  const anyProfile: any = profile && profile.value ? profile.value : null;
  const userProfile = anyProfile ? (anyProfile.perfis?.nome || anyProfile.perfil || null) : null;
    if (!userProfile) return [];

    // Mapa centralizado de permissões por perfil
    const permissionMap: Record<string, 'ALL' | string[]> = {
      Master: 'ALL',
      Diretoria: 'ALL',
      Gerência: 'ALL',
      Coordenador: ['Propostas', 'Relatórios', 'Requisições'],
      Supervisor: ['Propostas', 'Relatórios', 'Requisições'],
      Consultor: ['Propostas', 'Requisições'],
      Backoffice: ['Propostas', 'Relatórios', 'Backoffice', 'Requisições'],
      RH: ['Cadastros', 'RH', 'Requisições'],
      Administrativo: ['Requisições'],
  Financeiro: ['Requisições','Financeiro'],
      TI: ['Requisições']
    };

    const allowed = permissionMap[userProfile] || ['Propostas', 'Requisições']; // fallback com Requisições incluída

    const canAccessMenu = (menuLabel: string) => {
      if (allowed === 'ALL') return true;
      return (allowed as string[]).includes(menuLabel);
    };

    const canAccessLink = (link: any) => {
      // Se o link não tem restrição de profiles, está disponível para todos
      if (!link.profiles || link.profiles.length === 0) return true;
      // Se tem restrição, verifica se o perfil do usuário está na lista
      return link.profiles.includes(userProfile);
    };

    return menuItems
      .filter(menu => canAccessMenu(menu.label))
      .map(menu => ({ 
        ...menu, 
        links: (menu.links || []).filter(link => canAccessLink(link))
      }))
      .filter(menu => menu.links.length > 0); // Remove menus sem links visíveis
  });

  return {
    menuItems,
    filteredMenuItems
  };
};