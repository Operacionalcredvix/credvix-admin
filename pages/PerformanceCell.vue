<template>
  <div>
    <div class="flex justify-between items-end text-sm mb-1">
      <div class="text-gray-500">Atingido</div>
      <div class="font-bold" :class="colorClass">{{ formattedAtingido }}</div>
    </div>
    <div class="flex justify-between items-end text-xs mb-1">
      <div class="text-gray-500">Meta</div>
      <div class="font-medium text-gray-400">{{ formattedMeta }}</div>
    </div>
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

const progressColor = computed(() => colorClass.value.replace('text-', ''));
</script>