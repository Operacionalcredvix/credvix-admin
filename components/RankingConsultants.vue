<template>
  <UCard class="mb-8">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-star" class="text-xl text-yellow-400" />
        <h3 class="font-semibold">{{ title }}</h3>
      </div>
    </template>

    <div v-if="!consultants || consultants.length === 0" class="text-center py-6 text-gray-500">
      <p>Nenhum consultor no ranking.</p>
    </div>

    <div v-else>
      <UTable :rows="consultants" :columns="columns">
        <template #rank-data="{ row }">
          <UBadge :color="getRankColor(row.rank)" variant="subtle" size="lg" :label="`#${row.rank}`" />
        </template>

        <template #consultor_nome-data="{ row }">
          <div>
            <p class="font-bold">{{ row.consultor_nome }}</p>
            <p v-if="row.loja_nome" class="text-xs text-gray-500">{{ row.loja_nome }}</p>
          </div>
        </template>

        <template #total_producao-data="{ row }">
          <span class="font-semibold text-lg text-primary-500">{{ formatCurrency(row.total_producao || 0) }}</span>
        </template>
      </UTable>
    </div>
  </UCard>
</template>

<script setup>
const props = defineProps({
  consultants: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [{ key: 'rank', label: 'Posição' }, { key: 'consultor_nome', label: 'Consultor' }, { key: 'total_producao', label: 'Produção Total' }] },
  title: { type: String, default: 'Ranking de Consultores' },
  formatCurrency: { type: Function, default: (v) => v }
});

const getRankColor = (rank) => {
  if (rank === 1) return 'amber';
  if (rank === 2) return 'gray';
  if (rank === 3) return 'orange';
  return 'gray';
};
</script>
