import { ref, onMounted, onUnmounted } from 'vue'

export const useVersionCheck = () => {
  const currentVersion = ref<string>('')
  const latestVersion = ref<string>('')
  const hasUpdate = ref(false)
  const isChecking = ref(false)
  const updateDismissed = ref(false)
  const checkInterval = ref<NodeJS.Timeout | null>(null)

  // Checa a versão atual do sistema
  const checkVersion = async () => {
    if (isChecking.value) return

    try {
      isChecking.value = true
      
      const response = await $fetch<{ version: string }>('/api/system/version')
      
      if (!response || !response.version) {
        console.warn('[VersionCheck] Resposta inválida da API')
        return
      }

      latestVersion.value = response.version

      // Se não temos versão atual ainda, define como a atual
      if (!currentVersion.value) {
        currentVersion.value = response.version
        // Salva no localStorage para persistir entre reloads
        if (process.client) {
          localStorage.setItem('app_version', response.version)
        }
        return
      }

      // Compara versões
      if (currentVersion.value !== latestVersion.value && !updateDismissed.value) {
        hasUpdate.value = true
        console.log(`[VersionCheck] Nova versão disponível: ${latestVersion.value} (atual: ${currentVersion.value})`)
      }
    } catch (error) {
      console.error('[VersionCheck] Erro ao verificar versão:', error)
    } finally {
      isChecking.value = false
    }
  }

  // Inicia verificação automática (a cada 2 minutos)
  const startAutoCheck = (intervalMinutes: number = 2) => {
    if (checkInterval.value) {
      clearInterval(checkInterval.value)
    }

    // Primeira verificação imediata
    checkVersion()

    // Verificações periódicas
    checkInterval.value = setInterval(() => {
      checkVersion()
    }, intervalMinutes * 60 * 1000)
  }

  // Para a verificação automática
  const stopAutoCheck = () => {
    if (checkInterval.value) {
      clearInterval(checkInterval.value)
      checkInterval.value = null
    }
  }

  // Aceita a atualização e recarrega a página
  const acceptUpdate = () => {
    if (process.client) {
      // Limpa o cache e recarrega
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name))
        })
      }
      
      // Força reload sem cache
      window.location.reload()
    }
  }

  // Adiar atualização (por 30 minutos)
  const dismissUpdate = () => {
    hasUpdate.value = false
    updateDismissed.value = true
    
    // Após 30 minutos, permite mostrar novamente
    setTimeout(() => {
      updateDismissed.value = false
      checkVersion()
    }, 30 * 60 * 1000)
  }

  // Restaura versão do localStorage ao montar
  onMounted(() => {
    if (process.client) {
      const storedVersion = localStorage.getItem('app_version')
      if (storedVersion) {
        currentVersion.value = storedVersion
      }
    }
  })

  // Limpa interval ao desmontar
  onUnmounted(() => {
    stopAutoCheck()
  })

  return {
    currentVersion,
    latestVersion,
    hasUpdate,
    isChecking,
    checkVersion,
    startAutoCheck,
    stopAutoCheck,
    acceptUpdate,
    dismissUpdate
  }
}
