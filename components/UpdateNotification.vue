<template>
  <div v-if="hasUpdate" class="fixed bottom-4 right-4 z-50 max-w-md animate-slide-up">
    <UCard class="shadow-2xl border-2 border-primary-500">
      <template #header>
        <div class="flex items-center gap-3">
          <div class="flex-shrink-0">
            <UIcon name="i-heroicons-arrow-path" class="text-3xl text-primary-500" />
          </div>
          <div class="flex-1">
            <h3 class="font-bold text-lg text-gray-800 dark:text-gray-100">
              Nova Atualização Disponível! 🚀
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Versão {{ latestVersion }}
            </p>
          </div>
          <UButton
            icon="i-heroicons-x-mark"
            color="gray"
            variant="ghost"
            size="sm"
            @click="handleDismiss"
            :ui="{ rounded: 'rounded-full' }"
          />
        </div>
      </template>

      <div class="space-y-4">
        <div class="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
          <UIcon name="i-heroicons-information-circle" class="text-lg flex-shrink-0 mt-0.5 text-blue-500" />
          <p>
            Uma nova versão do sistema foi detectada. Recomendamos atualizar agora para aproveitar as melhorias e correções mais recentes.
          </p>
        </div>

        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">Versão atual:</span>
            <span class="font-mono font-semibold text-gray-700 dark:text-gray-300">{{ currentVersion }}</span>
          </div>
          <UIcon name="i-heroicons-arrow-down" class="text-gray-400 mx-auto block" />
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">Nova versão:</span>
            <span class="font-mono font-semibold text-primary-600 dark:text-primary-400">{{ latestVersion }}</span>
          </div>
        </div>

        <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
          <UIcon name="i-heroicons-exclamation-triangle" class="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p class="text-xs text-amber-800 dark:text-amber-300">
            <strong>Aviso:</strong> Ao atualizar, a página será recarregada. Salve seu trabalho antes de continuar.
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-2 justify-end">
          <UButton
            color="gray"
            variant="ghost"
            @click="handleDismiss"
            :disabled="isUpdating"
          >
            Mais Tarde
          </UButton>
          <UButton
            color="primary"
            @click="handleUpdate"
            :loading="isUpdating"
            icon="i-heroicons-arrow-path"
          >
            {{ isUpdating ? 'Atualizando...' : 'Atualizar Agora' }}
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const { hasUpdate, currentVersion, latestVersion, acceptUpdate, dismissUpdate } = useVersionCheck()
const isUpdating = ref(false)

// Debug: monitora mudanças no hasUpdate
watch(hasUpdate, (newVal) => {
  console.log('[UpdateNotification] 📢 hasUpdate mudou para:', newVal)
  console.log('[UpdateNotification] Versão atual:', currentVersion.value)
  console.log('[UpdateNotification] Versão nova:', latestVersion.value)
}, { immediate: true })

const handleUpdate = () => {
  console.log('[UpdateNotification] 🔄 Iniciando atualização...')
  isUpdating.value = true
  // Pequeno delay para feedback visual
  setTimeout(() => {
    acceptUpdate()
  }, 500)
}

const handleDismiss = () => {
  console.log('[UpdateNotification] ⏸️ Atualização adiada')
  dismissUpdate()
}
</script>

<style scoped>
@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
</style>
