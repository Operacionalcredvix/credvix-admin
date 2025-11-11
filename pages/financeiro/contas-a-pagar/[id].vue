<template>
  <div>
    <ContaDetail :id="route.params.id" />
  </div>
</template>

<script setup>
import ContaDetail from '~/components/financeiro/ContaDetail.vue'
import { useRoute } from 'vue-router'
const route = useRoute()
</script>
