import { ref, onMounted, onUnmounted } from 'vue'

// Estado global compartilhado entre todas as instâncias
const globalState = {
  currentVersion: ref<string>(''),
  latestVersion: ref<string>(''),
  hasUpdate: ref(false),
  isChecking: ref(false),
  updateDismissed: ref(false),
  checkInterval: ref<NodeJS.Timeout | null>(null)
}

export const useVersionCheck = () => {
  const currentVersion = globalState.currentVersion
  const latestVersion = globalState.latestVersion
  const hasUpdate = globalState.hasUpdate
  const isChecking = globalState.isChecking
  const updateDismissed = globalState.updateDismissed
  const checkInterval = globalState.checkInterval

  // Checa a versão atual do sistema
  const checkVersion = async () => {
    if (isChecking.value) return

    try {
      isChecking.value = true
      console.log('[VersionCheck] 🔍 Verificando versão...')
      
      const response = await $fetch<{ version: string }>('/api/system/version')
      console.log('[VersionCheck] 📡 Resposta da API:', response)
      
      if (!response || !response.version) {
        console.warn('[VersionCheck] ⚠️ Resposta inválida da API')
        return
      }

      latestVersion.value = response.version
      console.log('[VersionCheck] 📦 Versão mais recente:', latestVersion.value)

      // Se não temos versão atual ainda, define como a atual
      if (!currentVersion.value) {
        currentVersion.value = response.version
        console.log('[VersionCheck] 💾 Salvando versão inicial:', currentVersion.value)
        // Salva no localStorage para persistir entre reloads
        if (process.client) {
          localStorage.setItem('app_version', response.version)
        }
        return
      }

      console.log('[VersionCheck] 🔄 Comparando versões - Atual:', currentVersion.value, 'Nova:', latestVersion.value)
      
      // Compara versões
      if (currentVersion.value !== latestVersion.value && !updateDismissed.value) {
        hasUpdate.value = true
        console.log(`[VersionCheck] 🚀 Nova versão disponível! ${latestVersion.value} (atual: ${currentVersion.value})`)
        console.log('[VersionCheck] ✅ hasUpdate ativado:', hasUpdate.value)
      } else {
        console.log('[VersionCheck] ✓ Versão está atualizada')
      }
    } catch (error) {
      console.error('[VersionCheck] ❌ Erro ao verificar versão:', error)
    } finally {
      isChecking.value = false
    }
  }

  // Inicia verificação automática (a cada 2 minutos)
  const startAutoCheck = (intervalMinutes: number = 2) => {
    if (checkInterval.value) {
      clearInterval(checkInterval.value)
    }

    console.log(`[VersionCheck] ⏰ Iniciando verificação automática (intervalo: ${intervalMinutes} min)`)
    
    // Primeira verificação imediata
    checkVersion()

    // Verificações periódicas
    checkInterval.value = setInterval(() => {
      console.log('[VersionCheck] ⏰ Executando verificação periódica...')
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
    console.log('[VersionCheck] ✅ Aceitando atualização...')
    hasUpdate.value = false // Esconde o popup imediatamente
    
    if (process.client) {
      // Atualiza a versão no localStorage para a nova versão
      localStorage.setItem('app_version', latestVersion.value)
      
      // Limpa o cache e recarrega
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name))
        })
      }
      
      // Força reload sem cache
      setTimeout(() => {
        window.location.reload()
      }, 300)
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
