<template>
  <div class="max-w-4xl mx-auto py-6">
    <!-- Página pai para Importações: apenas renderiza a rota filha -->
    <NuxtPage />
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth', profiles: ['Backoffice', 'Master'] })
</script>