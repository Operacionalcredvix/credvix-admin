<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
onMounted(() => {
  // redireciona para a rota create existente
  router.replace('/financeiro/fornecedores/create')
})
</script>

<template>
  <div class="p-6 text-center">
    <p>Redirecionando para a tela de novo fornecedor...</p>
  </div>
</template>
