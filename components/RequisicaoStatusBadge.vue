<template>
  <UBadge :color="color" :variant="variant" :size="size">
    {{ status }}
  </UBadge>
</template>

<script setup>
import { computed } from 'vue'
import { STATUS_COLORS } from '~/types/requisicoes'

const props = defineProps({
  status: { type: String, required: true },
  variant: { type: String, default: 'subtle' },
  size: { type: String, default: 'md' }
})

const color = computed(() => STATUS_COLORS[props.status] || 'gray')
</script>
