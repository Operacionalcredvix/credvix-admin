<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <UNotifications />
    <UpdateNotification />
  </div>
</template>

<script setup>
const { startAutoCheck } = useVersionCheck()

// Inicia verificação automática ao montar o app
onMounted(() => {
  startAutoCheck(2) // Verifica a cada 2 minutos
})
</script>