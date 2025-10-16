<template>
  <div class="w-full">
    <!-- Título opcional -->
    <div v-if="title" class="flex justify-between items-start mb-1">
      <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ title }}</h3>
      <span class="font-bold text-sm" :class="percentageColor">{{ percentage.toFixed(1) }}%</span>
    </div>

    <!-- ATUALIZADO: Valor atingido e meta com destaque -->
    <div class="flex items-baseline gap-2 mt-1">
      <p class="text-xl font-bold" :class="percentageColor">{{ formattedCurrent }}</p>
      <p class="text-sm text-gray-500 dark:text-gray-400">/ {{ formattedGoal }}</p>
    </div>

    <UTooltip v-if="tooltipInfo">
      <template #text>
        <div class="text-xs p-1">
          <p>Divisor da Meta: <span class="font-bold">{{ tooltipInfo.divisor_meta }}</span></p>
          <p class="mt-1 text-gray-400">Cálculo: Menor valor entre Orçados e Ativos.</p>
          <ul class="list-disc list-inside mt-1">
            <li>Nº Orçados: {{ tooltipInfo.orçados }}</li>
            <li>Consultores Ativos: {{ tooltipInfo.qtd_consultores_ativos }}</li>
          </ul>
        </div>
      </template>
      <!-- O conteúdo que ativa o tooltip -->
      <div class="w-full">
        <p v-if="!title" class="text-center font-bold" :class="percentageColor">
          {{ percentage.toFixed(2) }}%
        </p>
        <UProgress :value="percentage" :color="progressColor" class="mt-2" />
        <p class="text-xs text-gray-500 text-center mt-1">Meta: {{ formattedGoal }}</p>
      </div>
    </UTooltip>

    <!-- Versão sem tooltip para metas mais simples -->
    <div v-else class="w-full">
      <p v-if="!title" class="text-center font-bold" :class="percentageColor">
        {{ percentage.toFixed(2) }}%
      </p>
      <UProgress :value="percentage" :color="progressColor" class="mt-2" />
      <p class="text-xs text-gray-500 text-center mt-1">Meta: {{ formattedGoal }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// import type { computed } from 'vue';
import { computed } from 'vue';
import { useGoalCalculations } from '~/composables/useGoalCalculations';

const props = defineProps({
  title: { type: String, required: false },
  currentValue: { type: Number, default: 0 },
  goalValue: { type: Number, default: 0 },
  formatAs: { type: String as () => 'currency' | 'number', default: 'currency' },
  tooltipInfo: { type: Object, required: false }
});

const { formatCurrency, getPercentageColor, getProgressBarColor } = useGoalCalculations();

const percentage = computed(() => (props.goalValue > 0 ? (props.currentValue / props.goalValue) * 100 : 0));
const formattedCurrent = computed(() => props.formatAs === 'currency' ? formatCurrency(props.currentValue) : props.currentValue);
const formattedGoal = computed(() => props.formatAs === 'currency' ? formatCurrency(props.goalValue) : props.goalValue);
const percentageColor = computed(() => getPercentageColor(percentage.value));
const progressColor = computed(() => getProgressBarColor(percentage.value));
</script>
