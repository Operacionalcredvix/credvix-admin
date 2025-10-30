// =====================================================================
// Types: Sistema de Requisições Internas
// =====================================================================
// Tipos TypeScript para o sistema de requisições entre lojas e setores
// =====================================================================

export type SetorDestino = 'Administrativo' | 'Financeiro' | 'RH' | 'TI' | 'Operacional' | 'Marketing' | 'Endomarketing' | 'Backoffice';

export type CategoriaRequisicao =
  | 'Material Escritório'
  | 'Manutenção'
  | 'TI/Equipamento'
  | 'Reembolso'
  | 'Adiantamento'
  | 'Pagamento Fornecedor'
  | 'Folha de Pagamento'
  | 'Férias'
  | 'Admissão'
  | 'Desligamento'
  | 'Benefícios'
  | 'Treinamento'
  | 'Outros';

export type PrioridadeRequisicao = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

export type StatusRequisicao =
  | 'Nova'
  | 'Em Análise'
  | 'Aceita'
  | 'Necessita Informação'
  | 'Devolvida'
  | 'Concluída'
  | 'Cancelada';

export type AcaoAuditoria =
  | 'visualizou'
  | 'editou'
  | 'comentou'
  | 'mudou_status'
  | 'reatribuiu'
  | 'cancelou'
  | 'anexou_arquivo'
  | 'aceitou'
  | 'solicitou_informacao'
  | 'enviou_informacao'
  | 'concluiu';

// ===== Interface: Requisição Principal =====
export interface Requisicao {
  id: number;
  numero_requisicao: string;
  
  // Solicitante
  titulo: string;
  solicitante_id: number;
  loja_id: number;
  regional_id: number;
  
  // Destinatário
  setor_destino: SetorDestino;
  destinatario_id?: number | null;
  
  // Detalhes
  categoria: CategoriaRequisicao;
  descricao: string;
  prioridade_sugerida: PrioridadeRequisicao;
  
  // Gerenciamento
  status: StatusRequisicao;
  responsavel_id?: number | null;
  prioridade_final?: PrioridadeRequisicao | null;
  
  // Datas
  data_aceite?: string | null;
  prazo_final?: string | null;
  data_conclusao?: string | null;
  created_at: string;
  updated_at: string;
  
  // Textos
  parecer_resposta?: string | null;
  detalhamento_execucao?: string | null;
  motivo_cancelamento?: string | null;
}

// ===== Interface: Requisição Completa (com relacionamentos) =====
export interface RequisicaoCompleta extends Requisicao {
  // Solicitante
  solicitante_nome: string;
  solicitante_email: string;
  solicitante_perfil: string;
  
  // Loja e Regional
  loja_nome: string;
  nome_regional: string;
  
  // Destinatário
  destinatario_nome?: string | null;
  
  // Responsável
  responsavel_nome?: string | null;
  
  // SLA
  horas_restantes_sla?: number | null;
  em_atraso: boolean;
  concluida_no_prazo?: boolean | null;
  
  // Contadores
  total_anexos: number;
  total_comentarios: number;
  total_comentarios_internos: number;
}

// ===== Interface: Anexo =====
export interface RequisicaoAnexo {
  id: number;
  requisicao_id: number;
  nome_arquivo: string;
  url_arquivo: string;
  tamanho_bytes?: number | null;
  tipo_mime?: string | null;
  uploaded_by: number;
  created_at: string;
}

// ===== Interface: Histórico =====
export interface RequisicaoHistorico {
  id: number;
  requisicao_id: number;
  status_anterior?: StatusRequisicao | null;
  status_novo: StatusRequisicao;
  comentario?: string | null;
  alterado_por: number;
  created_at: string;
}

// ===== Interface: Comentário =====
export interface RequisicaoComentario {
  id: number;
  requisicao_id: number;
  autor_id: number;
  comentario: string;
  is_interno: boolean;
  created_at: string;
  
  // Relacionamentos (opcional)
  autor?: {
    nome_completo: string;
    perfil: string;
  };
}

// ===== Interface: SLA Config =====
export interface RequisicaoSLAConfig {
  id: number;
  categoria: CategoriaRequisicao;
  prioridade: PrioridadeRequisicao;
  prazo_horas: number;
  created_at: string;
  updated_at: string;
}

// ===== Interface: Form de Nova Requisição =====
export interface NovaRequisicaoForm {
  titulo: string;
  setor_destino: SetorDestino;
  destinatario_id?: number | null;
  categoria: CategoriaRequisicao;
  descricao: string;
  prioridade_sugerida: PrioridadeRequisicao;
  anexos?: File[];
}

// ===== Interface: Form de Aceitar Requisição =====
export interface AceitarRequisicaoForm {
  responsavel_id: number;
  prazo_final: string;
  prioridade_final?: PrioridadeRequisicao;
  parecer_resposta: string;
}

// ===== Interface: Form de Concluir Requisição =====
export interface ConcluirRequisicaoForm {
  detalhamento_execucao: string;
}

// ===== Interface: Form de Cancelar Requisição =====
export interface CancelarRequisicaoForm {
  motivo_cancelamento: string;
}

// ===== Interface: Dashboard Setor =====
export interface DashboardSetor {
  setor_destino: SetorDestino;
  total_novas: number;
  total_em_analise: number;
  total_aceitas: number;
  total_necessita_info: number;
  total_devolvidas: number;
  total_concluidas: number;
  total_canceladas: number;
  total_em_atraso: number;
  total_no_prazo: number;
  tempo_medio_conclusao_horas?: number | null;
  tempo_medio_aceite_horas?: number | null;
  total_criticas: number;
  total_altas: number;
  primeira_requisicao?: string | null;
  ultima_requisicao?: string | null;
}

// ===== Interface: Dashboard Regional =====
export interface DashboardRegional {
  regional_id: number;
  nome_regional: string;
  total_requisicoes: number;
  total_abertas: number;
  total_concluidas: number;
  total_canceladas: number;
  total_adm: number;
  total_fin: number;
  total_rh: number;
  total_ti: number;
  total_em_atraso: number;
  tempo_medio_conclusao_horas?: number | null;
  top_lojas?: string[] | null;
}

// ===== Interface: Requisição Urgente =====
export interface RequisicaoUrgente {
  id: number;
  numero_requisicao: string;
  titulo: string;
  setor_destino: SetorDestino;
  status: StatusRequisicao;
  prioridade: PrioridadeRequisicao;
  prazo_final: string;
  horas_restantes: number;
  solicitante_nome: string;
  loja_nome: string;
  nome_regional: string;
  responsavel_nome?: string | null;
  created_at: string;
}

// ===== Interface: Auditoria =====
export interface RequisicaoAuditoria {
  id: string;
  requisicao_id: string;
  usuario_id: string;
  acao: AcaoAuditoria;
  detalhes: Record<string, any>;
  ip_address?: string | null;
  user_agent?: string | null;
  data_acao: string;
  
  // Relacionamentos (opcional)
  usuario?: {
    nome_completo: string;
    perfil: string;
    email: string;
  };
  requisicao?: {
    numero_requisicao: string;
    titulo: string;
  };
}

// ===== Constantes =====
export const SETORES_DESTINO: SetorDestino[] = ['Administrativo', 'Financeiro', 'RH', 'TI', 'Operacional', 'Marketing', 'Endomarketing', 'Backoffice'];

export const CATEGORIAS_REQUISICAO: CategoriaRequisicao[] = [
  'Material Escritório',
  'Manutenção',
  'TI/Equipamento',
  'Reembolso',
  'Adiantamento',
  'Pagamento Fornecedor',
  'Folha de Pagamento',
  'Férias',
  'Admissão',
  'Desligamento',
  'Benefícios',
  'Treinamento',
  'Outros'
];

export const PRIORIDADES: PrioridadeRequisicao[] = ['Baixa', 'Média', 'Alta', 'Crítica'];

export const STATUS_REQUISICAO: StatusRequisicao[] = [
  'Nova',
  'Em Análise',
  'Aceita',
  'Necessita Informação',
  'Devolvida',
  'Concluída',
  'Cancelada'
];

// ===== Helpers: Cores para UI =====
export const STATUS_COLORS: Record<StatusRequisicao, string> = {
  'Nova': 'blue',
  'Em Análise': 'yellow',
  'Aceita': 'green',
  'Necessita Informação': 'orange',
  'Devolvida': 'cyan',
  'Concluída': 'emerald',
  'Cancelada': 'red'
};

export const PRIORIDADE_COLORS: Record<PrioridadeRequisicao, string> = {
  'Baixa': 'gray',
  'Média': 'blue',
  'Alta': 'orange',
  'Crítica': 'red'
};

export const SETOR_ICONS: Record<SetorDestino, string> = {
  'Administrativo': 'i-heroicons-clipboard-document-list',
  'Financeiro': 'i-heroicons-currency-dollar',
  'RH': 'i-heroicons-users',
  'TI': 'i-heroicons-computer-desktop',
  'Operacional': 'i-heroicons-wrench-screwdriver',
  'Marketing': 'i-heroicons-megaphone',
  'Endomarketing': 'i-heroicons-sparkles',
  'Backoffice': 'i-heroicons-briefcase'
};

export const ACOES_AUDITORIA: Record<AcaoAuditoria, { label: string; icon: string; color: string }> = {
  'visualizou': { label: 'Visualizou', icon: 'i-heroicons-eye', color: 'gray' },
  'editou': { label: 'Editou', icon: 'i-heroicons-pencil', color: 'blue' },
  'comentou': { label: 'Comentou', icon: 'i-heroicons-chat-bubble-left', color: 'cyan' },
  'mudou_status': { label: 'Mudou Status', icon: 'i-heroicons-arrow-path', color: 'yellow' },
  'reatribuiu': { label: 'Reatribuiu', icon: 'i-heroicons-arrow-right-circle', color: 'purple' },
  'cancelou': { label: 'Cancelou', icon: 'i-heroicons-x-circle', color: 'red' },
  'anexou_arquivo': { label: 'Anexou Arquivo', icon: 'i-heroicons-paper-clip', color: 'green' },
  'aceitou': { label: 'Aceitou', icon: 'i-heroicons-check-circle', color: 'green' },
  'solicitou_informacao': { label: 'Solicitou Informação', icon: 'i-heroicons-question-mark-circle', color: 'orange' },
  'enviou_informacao': { label: 'Enviou Informação', icon: 'i-heroicons-paper-airplane', color: 'blue' },
  'concluiu': { label: 'Concluiu', icon: 'i-heroicons-check-badge', color: 'emerald' }
};

// ===== Types: Notificações =====
export type TipoNotificacao =
  | 'nova_requisicao'
  | 'mudanca_status'
  | 'novo_comentario'
  | 'reatribuicao'
  | 'prazo_proximo'
  | 'requisicao_atrasada';

export interface Notificacao {
  id: number;
  usuario_id: number;
  requisicao_id: number;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string | null;
  lida: boolean;
  data_criacao: string;
  data_leitura: string | null;
  
  // Relacionamentos (opcional)
  requisicao?: {
    numero_requisicao: string;
    titulo: string;
    status: StatusRequisicao;
  };
}

export const TIPOS_NOTIFICACAO: Record<TipoNotificacao, { label: string; icon: string; color: string }> = {
  'nova_requisicao': { label: 'Nova Requisição', icon: 'i-heroicons-sparkles', color: 'blue' },
  'mudanca_status': { label: 'Status Atualizado', icon: 'i-heroicons-arrow-path', color: 'yellow' },
  'novo_comentario': { label: 'Novo Comentário', icon: 'i-heroicons-chat-bubble-left', color: 'cyan' },
  'reatribuicao': { label: 'Reatribuição', icon: 'i-heroicons-arrow-right-circle', color: 'purple' },
  'prazo_proximo': { label: 'Prazo Próximo', icon: 'i-heroicons-clock', color: 'orange' },
  'requisicao_atrasada': { label: 'Atrasada', icon: 'i-heroicons-exclamation-triangle', color: 'red' }
};
