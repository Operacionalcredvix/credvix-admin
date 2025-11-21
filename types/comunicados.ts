// Tipos para Sistema de Comunicados Internos

export type CategoriaComunicado = 
  | 'Aviso'
  | 'Informação'
  | 'Notificação'
  | 'Urgente'
  | 'Atualização'

export interface Comunicado {
  id: number
  titulo: string
  conteudo: string
  categoria: CategoriaComunicado
  imagem_url: string | null
  perfis_destino: string[] | null
  regionais_destino: number[] | null
  lojas_destino: number[] | null
  usuarios_destino: number[] | null
  ativo: boolean
  data_envio: string
  criado_por: number | null
  criado_em: string
  atualizado_em: string
}

export interface ComunicadoVisualizado extends Comunicado {
  criado_por_nome: string | null
  visualizado: boolean
  visualizado_em: string | null
}

export interface ComunicadoNaoVisualizado {
  id: number
  titulo: string
  conteudo: string
  categoria: CategoriaComunicado
  imagem_url: string | null
  data_envio: string
  criado_por_nome: string | null
}

export interface ComunicadoVisualizacao {
  id: number
  comunicado_id: number
  funcionario_id: number
  visualizado_em: string
}

export interface CreateComunicadoInput {
  titulo: string
  conteudo: string
  categoria: CategoriaComunicado
  imagem_url?: string | null
  perfis_destino?: string[] | null
  regionais_destino?: number[] | null
  lojas_destino?: number[] | null
  usuarios_destino?: number[] | null
  data_envio?: string
}

export interface UpdateComunicadoInput {
  id: number
  titulo?: string
  conteudo?: string
  categoria?: CategoriaComunicado
  imagem_url?: string | null
  perfis_destino?: string[] | null
  regionais_destino?: number[] | null
  lojas_destino?: number[] | null
  usuarios_destino?: number[] | null
  ativo?: boolean
}
