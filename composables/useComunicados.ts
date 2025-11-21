// Composable para gerenciar comunicados internos

import type { ComunicadoNaoVisualizado, ComunicadoVisualizado } from '~/types/comunicados'

// Estado compartilhado (fora da função para persistir entre chamadas)
const comunicadosNaoVistos = ref<ComunicadoNaoVisualizado[]>([])
const mostrarModal = ref(false)
const comunicadoAtual = ref<ComunicadoNaoVisualizado | null>(null)
const carregando = ref(false)
let intervaloVerificacao: NodeJS.Timeout | null = null

export const useComunicados = () => {
  // Busca comunicados não visualizados
  const buscarNaoVisualizados = async () => {
    try {
      carregando.value = true
      const data = await $fetch<ComunicadoNaoVisualizado[]>('/api/comunicados/nao-visualizados')
      comunicadosNaoVistos.value = data
      
      // Se houver comunicados não vistos, mostra o primeiro
      if (data.length > 0) {
        comunicadoAtual.value = data[0]
        mostrarModal.value = true
      }
    } catch (error) {
      console.error('Erro ao buscar comunicados não visualizados:', error)
    } finally {
      carregando.value = false
    }
  }

  // Marca comunicado como visualizado
  const marcarComoVisualizado = async (comunicadoId: number) => {
    try {
      await $fetch('/api/comunicados/visualizar', {
        method: 'POST',
        body: { comunicado_id: comunicadoId }
      })

      // Remove da lista de não visualizados
      comunicadosNaoVistos.value = comunicadosNaoVistos.value.filter(c => c.id !== comunicadoId)

      // Se ainda houver mais comunicados, mostra o próximo
      if (comunicadosNaoVistos.value.length > 0) {
        comunicadoAtual.value = comunicadosNaoVistos.value[0]
      } else {
        // Senão, fecha o modal
        fecharModal()
      }
    } catch (error) {
      console.error('Erro ao marcar comunicado como visualizado:', error)
      throw error
    }
  }

  // Fecha o modal
  const fecharModal = () => {
    mostrarModal.value = false
    comunicadoAtual.value = null
  }

  // Busca histórico de comunicados
  const buscarHistorico = async () => {
    try {
      const data = await $fetch<ComunicadoVisualizado[]>('/api/comunicados/historico')
      return data
    } catch (error) {
      console.error('Erro ao buscar histórico:', error)
      return []
    }
  }

  // Inicia verificação automática (a cada X minutos)
  const iniciarVerificacaoAutomatica = (intervaloMinutos = 5) => {
    // Se já existe um intervalo ativo, não cria outro
    if (intervaloVerificacao) {
      console.debug('[Comunicados] Verificação automática já está ativa')
      return
    }

    console.debug('[Comunicados] Iniciando verificação automática')
    
    // Verifica imediatamente
    buscarNaoVisualizados()

    // Depois verifica periodicamente
    intervaloVerificacao = setInterval(() => {
      buscarNaoVisualizados()
    }, intervaloMinutos * 60 * 1000)
  }

  // Para a verificação automática
  const pararVerificacaoAutomatica = () => {
    if (intervaloVerificacao) {
      clearInterval(intervaloVerificacao)
      intervaloVerificacao = null
    }
  }

  return {
    comunicadosNaoVistos: readonly(comunicadosNaoVistos),
    mostrarModal: readonly(mostrarModal),
    comunicadoAtual: readonly(comunicadoAtual),
    carregando: readonly(carregando),
    buscarNaoVisualizados,
    marcarComoVisualizado,
    fecharModal,
    buscarHistorico,
    iniciarVerificacaoAutomatica,
    pararVerificacaoAutomatica
  }
}
