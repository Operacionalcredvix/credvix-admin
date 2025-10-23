<template>
  <div class="text-center">
    <p class="font-bold" :class="colorClass">{{ formattedAtingido }}</p>
    <p class="text-xs text-gray-500">de {{ formattedMeta }}</p>
    <UProgress :value="percentage" :color="progressColor" class="mt-1" />
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  atingido: { type: Number, required: true },
  meta: { type: Number, required: true },
  type: { type: String, default: 'currency' } // 'currency' or 'integer'
});

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const percentage = computed(() => (props.meta > 0 ? (props.atingido / props.meta) * 100 : 0));

const formattedAtingido = computed(() => props.type === 'currency' ? formatCurrency(props.atingido) : props.atingido);
const formattedMeta = computed(() => props.type === 'currency' ? formatCurrency(props.meta) : props.meta);

const colorClass = computed(() => {
  if (percentage.value >= 100) return 'text-green-500';
  if (percentage.value >= 75) return 'text-yellow-500';
  return 'text-red-500';
});

const progressColor = computed(() => {
  if (percentage.value >= 100) return 'green';
  if (percentage.value >= 75) return 'yellow';
  return 'red';
});
</script>