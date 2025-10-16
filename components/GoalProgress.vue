<template>
  <div class="w-full">
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
        <p class="text-center font-bold" :class="percentageColor">
          {{ percentage.toFixed(2) }}%
        </p>
        <UProgress :value="percentage" :color="progressColor" />
        <p class="text-xs text-gray-500 text-center mt-1">
          {{ formattedCurrent }} / {{ formattedGoal }}
        </p>
      </div>
    </UTooltip>

    <!-- Versão sem tooltip para metas mais simples -->
    <div v-else class="w-full">
      <p class="text-center font-bold" :class="percentageColor">
        {{ percentage.toFixed(2) }}%
      </p>
      <UProgress :value="percentage" :color="progressColor" />
      <p class="text-xs text-gray-500 text-center mt-1">
        {{ formattedCurrent }} / {{ formattedGoal }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
// import type { computed } from 'vue';
import { computed } from 'vue';
import { useGoalCalculations } from '~/composables/useGoalCalculations';

const props = defineProps({
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
