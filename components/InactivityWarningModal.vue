<template>
  <UModal v-model="showWarningModal" :prevent-close="true">
    <UCard>
      <template #header>
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <UIcon name="i-heroicons-exclamation-triangle" class="text-2xl text-amber-500" />
          </div>
          <div>
            <h3 class="text-lg font-semibold">Sessão Inativa</h3>
            <p class="text-sm text-gray-500">Você será desconectado em breve</p>
          </div>
        </div>
      </template>

      <div class="space-y-4">
        <p class="text-gray-700 dark:text-gray-300">
          Detectamos que você está inativo há algum tempo. Por segurança, sua sessão será encerrada automaticamente.
        </p>

        <div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Tempo restante:</p>
          <p class="text-4xl font-bold text-amber-500">
            {{ formatTime(remainingSeconds) }}
          </p>
        </div>

        <p class="text-sm text-gray-600 dark:text-gray-400">
          Clique no botão abaixo para continuar conectado ou aguarde para ser desconectado automaticamente.
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            label="Continuar Conectado"
            color="primary"
            size="lg"
            icon="i-heroicons-arrow-path"
            @click="handleContinue"
          />
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup>
// @ts-nocheck
const { $resetInactivityTimer } = useNuxtApp();

const showWarningModal = useState('inactivity-warning-modal', () => false);
const remainingSeconds = useState('inactivity-remaining-seconds', () => 120);

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const handleContinue = () => {
  showWarningModal.value = false;
  if ($resetInactivityTimer) {
    $resetInactivityTimer();
  }
};
</script>
