// @ts-nocheck
/**
 * Composable: useNotificacoes
 * Gerencia notificações de requisições com realtime
 */

import { ref, computed } from 'vue'

export function useNotificacoes() {
  const supabase = useSupabaseClient()
  const { profile } = useProfile()
  
  const notificacoes = ref([])
  const carregando = ref(false)
  let channel = null

  // Contadores
  const naoLidas = computed(() => notificacoes.value.filter(n => !n.lida).length)
  const todas = computed(() => notificacoes.value)

  /**
   * Busca notificações do usuário
   */
  async function buscarNotificacoes(limite = 20) {
    carregando.value = true
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select(`
          *,
          requisicao:requisicoes(numero_requisicao, titulo, status)
        `)
        .order('data_criacao', { ascending: false })
        .limit(limite)

      if (error) throw error

      notificacoes.value = data || []
      return data
    } catch (err) {
      console.error('[useNotificacoes] Erro ao buscar:', err)
      return []
    } finally {
      carregando.value = false
    }
  }

  /**
   * Marca uma notificação como lida
   */
  async function marcarComoLida(notificacaoId) {
    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ 
          lida: true, 
          data_leitura: new Date().toISOString() 
        })
        .eq('id', notificacaoId)

      if (error) throw error

      // Atualiza localmente
      const notif = notificacoes.value.find(n => n.id === notificacaoId)
      if (notif) {
        notif.lida = true
        notif.data_leitura = new Date().toISOString()
      }

      return true
    } catch (err) {
      console.error('[useNotificacoes] Erro ao marcar como lida:', err)
      return false
    }
  }

  /**
   * Marca todas as notificações como lidas
   */
  async function marcarTodasLidas() {
    try {
      // Busca IDs das não lidas
      const naoLidasIds = notificacoes.value.filter(n => !n.lida).map(n => n.id)
      
      if (naoLidasIds.length === 0) return true

      const { error } = await supabase
        .from('notificacoes')
        .update({ 
          lida: true, 
          data_leitura: new Date().toISOString() 
        })
        .in('id', naoLidasIds)

      if (error) throw error

      // Atualiza localmente
      notificacoes.value.forEach(n => {
        if (!n.lida) {
          n.lida = true
          n.data_leitura = new Date().toISOString()
        }
      })

      return true
    } catch (err) {
      console.error('[useNotificacoes] Erro ao marcar todas como lidas:', err)
      return false
    }
  }

  /**
   * Deleta uma notificação
   */
  async function deletarNotificacao(notificacaoId) {
    try {
      const { error } = await supabase
        .from('notificacoes')
        .delete()
        .eq('id', notificacaoId)

      if (error) throw error

      // Remove localmente
      notificacoes.value = notificacoes.value.filter(n => n.id !== notificacaoId)

      return true
    } catch (err) {
      console.error('[useNotificacoes] Erro ao deletar:', err)
      return false
    }
  }

  /**
   * Subscreve para atualizações em tempo real
   */
  function subscribe() {
    if (!profile?.value?.id) {
      console.warn('[useNotificacoes] Profile não carregado, aguardando...')
      return
    }

    // Remove subscription anterior se existir
    if (channel) {
      supabase.removeChannel(channel)
    }

    channel = supabase
      .channel('notificacoes_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
          filter: `usuario_id=eq.${profile.value.id}`
        },
        async (payload) => {
          console.log('[useNotificacoes] Nova notificação:', payload.new)
          
          // Busca dados completos com join
          const { data } = await supabase
            .from('notificacoes')
            .select(`
              *,
              requisicao:requisicoes(numero_requisicao, titulo, status)
            `)
            .eq('id', payload.new.id)
            .single()

          if (data) {
            // Adiciona no início da lista
            notificacoes.value.unshift(data)
            
            // Limita a 50 itens
            if (notificacoes.value.length > 50) {
              notificacoes.value = notificacoes.value.slice(0, 50)
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notificacoes',
          filter: `usuario_id=eq.${profile.value.id}`
        },
        (payload) => {
          console.log('[useNotificacoes] Notificação atualizada:', payload.new)
          
          // Atualiza localmente
          const index = notificacoes.value.findIndex(n => n.id === payload.new.id)
          if (index !== -1) {
            notificacoes.value[index] = { ...notificacoes.value[index], ...payload.new }
          }
        }
      )
      .subscribe()

    console.log('[useNotificacoes] Subscrito para notificações do usuário', profile.value.id)
  }

  /**
   * Remove subscription
   */
  function unsubscribe() {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
      console.log('[useNotificacoes] Unsubscribed')
    }
  }

  return {
    notificacoes,
    carregando,
    naoLidas,
    todas,
    buscarNotificacoes,
    marcarComoLida,
    marcarTodasLidas,
    deletarNotificacao,
    subscribe,
    unsubscribe
  }
}
