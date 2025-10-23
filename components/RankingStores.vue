<template>
  <UCard class="mb-8">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-trophy" class="text-xl text-amber-500" />
        <div class="flex flex-col">
          <h3 class="font-semibold">{{ title }}</h3>
          <div v-if="currentStoreGlobalRank || currentStoreRegionalRank" class="flex items-center gap-2 text-sm mt-1">
            <UBadge v-if="currentStoreGlobalRank" :color="getStoreRankColor(currentStoreGlobalRank)" variant="subtle" :label="`Sua loja: #${currentStoreGlobalRank} Global`" />
            <UBadge v-if="currentStoreRegionalRank" :color="getStoreRankColor(currentStoreRegionalRank)" variant="subtle" :label="`#${currentStoreRegionalRank} Regional`" />
          </div>
        </div>
      </div>
    </template>

    <div v-if="!rankedStores || rankedStores.length === 0" class="text-center py-6 text-gray-500">
      <p>Nenhum item no ranking.</p>
    </div>

    <div v-else>
      <UTable :rows="rankedStores" :columns="columns">
       <template #rank-data="{ row }">
          <span v-if="row.rank === 1">
            <UIcon name="i-heroicons-trophy" class="text-xl text-yellow-500" />
          </span>
          <span v-else-if="row.rank === 2">
            <UIcon name="i-heroicons-trophy" class="text-xl text-gray-500" />
          </span>
          <span v-else-if="row.rank === 3">
            <UIcon name="i-heroicons-trophy" class="text-xl text-orange-500" />
          </span>
          <UBadge :color="getRankColor(row.rank)" variant="subtle" size="lg" :label="`#${row.rank}`" />
        </template>

        <template #loja_nome-data="{ row }">
          <div>
            <p class="font-bold">{{ row.loja_nome }}</p>
            <p v-if="row.nome_regional" class="text-xs text-gray-500">{{ row.nome_regional }}</p>
          </div>
        </template>

        <template #percentual_multi_volume-data="{ row }">
          <div class="w-full">
            <div class="flex items-center justify-between mb-2">
              <span :class="getPercentageColor(row.percentual_multi_volume)">{{ Math.round(row.percentual_multi_volume || 0) }}%</span>
              <span class="text-sm text-gray-500">{{ (row.atingido_multi_volume || 0) }} / {{ (row.meta_multi_volume || 0) }}</span>
            </div>
            <UProgress :value="Math.min(100, Math.round(row.percentual_multi_volume || 0))" :color="getProgressBarColor(row.percentual_multi_volume)" />
          </div>
        </template>
      </UTable>
    </div>
  </UCard>
</template>

<script setup>
import { computed } from 'vue';

const computeRanked = (list) => {
  if (!list) return [];
  return list.slice().sort((a, b) => (b.percentual_multi_volume || 0) - (a.percentual_multi_volume || 0)).map((item, i) => ({ ...item, rank: i + 1 }));
};

const props = defineProps({
  stores: { type: Array, default: () => [] },
  allStores: { type: Array, default: null },
  currentStoreId: { type: [Number, String], default: null },
  columns: { type: Array, default: () => [{ key: 'rank', label: 'Posição' }, { key: 'loja_nome', label: 'Loja' }, { key: 'percentual_multi_volume', label: '% Atingido' }] },
  title: { type: String, default: 'Ranking de Lojas' }
});

// Computed para rankear o array de stores que será exibido na tabela
const rankedStores = computed(() => computeRanked(props.stores));

const globalRanked = computed(() => computeRanked(props.allStores || props.stores));
const regionalRanked = computed(() => {
  if (!props.currentStoreId) return [];
  const store = (props.allStores || props.stores).find(s => String(s.loja_id) === String(props.currentStoreId) || String(s.id) === String(props.currentStoreId));
  if (!store) return [];
  const regionalId = store.regional_id || store.regionalId || store.regional || store.nome_regional;
  // if regional is a name, filter by nome_regional, else by regional_id
  const filtered = (props.allStores || props.stores).filter(s => {
    if (store.nome_regional && s.nome_regional) return s.nome_regional === store.nome_regional;
    if (regionalId && s.regional_id !== undefined) return s.regional_id === regionalId;
    return false;
  });
  return computeRanked(filtered);
});

const currentStoreGlobalRank = computed(() => {
  if (!props.currentStoreId) return null;
  const idx = globalRanked.value.findIndex(s => String(s.loja_id) === String(props.currentStoreId) || String(s.id) === String(props.currentStoreId));
  return idx === -1 ? null : idx + 1;
});

const currentStoreRegionalRank = computed(() => {
  if (!props.currentStoreId) return null;
  const idx = regionalRanked.value.findIndex(s => String(s.loja_id) === String(props.currentStoreId) || String(s.id) === String(props.currentStoreId));
  return idx === -1 ? null : idx + 1;
});


const getPercentageColor = (percentage) => {
  if (percentage >= 100) return 'text-green-500';
  if (percentage >= 75) return 'text-yellow-500';
  return 'text-red-500'; // This is for text color, it's ok.
};

const getProgressBarColor = (percentage) => {
  if (percentage >= 100) return 'green';
  if (percentage >= 75) return 'yellow';
  return 'red';
};

const getRankColor = (rank) => {
  if (rank === 1) return 'amber';
  if (rank === 2) return 'gray';
  if (rank === 3) return 'orange';
  return 'gray';
};

const getStoreRankColor = (rank) => {
  if (!rank) return 'gray';
  if (rank === 1) return 'yellow'; // Ouro
  if (rank === 2) return 'gray'; // Prata
  if (rank === 3) return 'orange'; // Bronze
  return 'primary'; // Demais posições
};

</script>
