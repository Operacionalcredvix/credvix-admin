<template>
  <UBadge :color="color" :variant="variant" :size="size">
    {{ prioridade }}
  </UBadge>
</template>

<script setup>
import { computed } from 'vue'
import { PRIORIDADE_COLORS } from '~/types/requisicoes'

const props = defineProps({
  prioridade: { type: String, required: true },
  variant: { type: String, default: 'solid' },
  size: { type: String, default: 'md' }
})

const color = computed(() => PRIORIDADE_COLORS[props.prioridade] || 'gray')
</script>
