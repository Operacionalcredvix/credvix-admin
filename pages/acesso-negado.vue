<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <UCard class="w-full max-w-md p-8 space-y-6 text-center">
      <UIcon name="i-heroicons-lock-closed" class="text-red-500 text-6xl mx-auto" />
      <h2 class="text-3xl font-bold text-gray-800">Acesso Negado</h2>
      <p class="text-gray-600">
        Você não tem permissão para aceder a esta página.
        Por favor, entre em contato com o administrador do sistema se acreditar que isso é um erro.
      </p>
      <UButton to="/" color="primary" size="lg">
        Voltar para o Dashboard
      </UButton>
    </UCard>
  </div>
</template>

<script setup>
// Esta página não precisa de layout padrão (sidebar, etc.)
// e não deve ser protegida pelo middleware 'auth' para evitar loops de redirecionamento.
definePageMeta({
  layout: 'empty' // Usaremos o layout 'empty' que já existe para o login
});
</script>