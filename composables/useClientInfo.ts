// @ts-nocheck
/**
 * Composable: useClientInfo
 * Captura informações do cliente (IP e User Agent) para auditoria
 */

import { ref } from 'vue'

export function useClientInfo() {
  const clientIp = ref<string | null>(null)
  const userAgent = ref<string | null>(null)

  // Captura User Agent do navegador
  if (process.client) {
    userAgent.value = navigator.userAgent
  }

  // Função para capturar IP (via API pública - opcional)
  async function fetchClientIp() {
    if (process.client && !clientIp.value) {
      try {
        // Usa serviço público gratuito para obter IP
        const response = await fetch('https://api.ipify.org?format=json')
        const data = await response.json()
        clientIp.value = data.ip
      } catch (error) {
        console.warn('[useClientInfo] Não foi possível obter IP:', error)
        clientIp.value = 'unknown'
      }
    }
  }

  // Retorna objeto com informações do cliente
  function getClientInfo() {
    return {
      ip_address: clientIp.value,
      user_agent: userAgent.value
    }
  }

  return {
    clientIp,
    userAgent,
    fetchClientIp,
    getClientInfo
  }
}
