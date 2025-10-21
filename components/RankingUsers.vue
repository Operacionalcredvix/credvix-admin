<template>
  <div class="space-y-6">
    <!-- Card para Ranking da Loja (Somente para Supervisor / Consultor) -->
    <UCard v-if="showStoreRanking" class="mb-8">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-building-office" class="text-xl text-primary-500" />
          <h3 class="font-semibold">
            Ranking da Loja
            <span v-if="currentStoreRank" class="text-primary-500">(Sua posição: {{ currentStoreRank }}º)</span>
          </h3>
        </div>
      </template>

      <UTable :rows="storeRanking" :columns="columns">
        <template #rank-data="{ row }">
          <span v-if="row.rank === 1"><UIcon name="i-heroicons-trophy" class="text-xl text-yellow-500" /></span>
          <span v-else-if="row.rank === 2"><UIcon name="i-heroicons-trophy" class="text-xl text-gray-500" /></span>
          <span v-else-if="row.rank === 3"><UIcon name="i-heroicons-trophy" class="text-xl text-orange-500" /></span>
          <UBadge :color="getRankColor(row.rank)" variant="subtle" size="lg" :label="`#${row.rank}`" />
        </template>

        <template #consultor_nome-data="{ row }">
          <div>
            <p class="font-bold">{{ row.consultor_nome }}</p>
            <p v-if="row.loja_nome" class="text-xs text-gray-500">{{ row.loja_nome }}</p>
          </div>
        </template>

        <template #total_producao-data="{ row }">
          <div class="text-right">
            <p class="font-bold">{{ formatCurrency(row.total_producao) }}</p>
          </div>
        </template>
      </UTable>
    </UCard>

    <!-- Card para Ranking Regional -->
    <UCard v-if="showRegionalRanking" class="mb-8">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-map" class="text-xl text-primary-500" />
          <h3 class="font-semibold">
            Ranking Regional
            <span v-if="currentRegionalRank" class="text-primary-500">(Sua posição: {{ currentRegionalRank }}º)</span>
          </h3>
        </div>
      </template>

      <UTable :rows="regionalRanking" :columns="columns">
        <template #rank-data="{ row }">
          <span v-if="row.rank === 1"><UIcon name="i-heroicons-trophy" class="text-xl text-yellow-500" /></span>
          <span v-else-if="row.rank === 2"><UIcon name="i-heroicons-trophy" class="text-xl text-gray-500" /></span>
          <span v-else-if="row.rank === 3"><UIcon name="i-heroicons-trophy" class="text-xl text-orange-500" /></span>
          <UBadge :color="getRankColor(row.rank)" variant="subtle" size="lg" :label="`#${row.rank}`" />
        </template>

        <template #consultor_nome-data="{ row }">
          <div>
            <p class="font-bold">{{ row.consultor_nome }}</p>
            <p v-if="row.loja_nome" class="text-xs text-gray-500">{{ row.loja_nome }}</p>
          </div>
        </template>

        <template #total_producao-data="{ row }">
          <div class="text-right">
            <p class="font-bold">{{ formatCurrency(row.total_producao) }}</p>
          </div>
        </template>
      </UTable>
    </UCard>

    <!-- Card para Ranking Geral -->
    <UCard v-if="showGlobalRanking" class="mb-8">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-globe-americas" class="text-xl text-primary-500" />
          <h3 class="font-semibold">
            Ranking Geral
            <span v-if="currentGlobalRank" class="text-primary-500">(Sua posição: {{ currentGlobalRank }}º)</span>
          </h3>
        </div>
      </template>

      <UTable :rows="globalRanking" :columns="columns">
        <template #rank-data="{ row }">
          <span v-if="row.rank === 1"><UIcon name="i-heroicons-trophy" class="text-xl text-yellow-500" /></span>
          <span v-else-if="row.rank === 2"><UIcon name="i-heroicons-trophy" class="text-xl text-gray-500" /></span>
          <span v-else-if="row.rank === 3"><UIcon name="i-heroicons-trophy" class="text-xl text-orange-500" /></span>
          <UBadge :color="getRankColor(row.rank)" variant="subtle" size="lg" :label="`#${row.rank}`" />
        </template>

        <template #consultor_nome-data="{ row }">
          <div>
            <p class="font-bold">{{ row.consultor_nome }}</p>
            <p v-if="row.loja_nome" class="text-xs text-gray-500">{{ row.loja_nome }}</p>
          </div>
        </template>

        <template #total_producao-data="{ row }">
          <div class="text-right">
            <p class="font-bold">{{ formatCurrency(row.total_producao) }}</p>
          </div>
        </template>
      </UTable>
    </UCard>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  consultores: { type: Array, default: () => [] },
  currentUserId: { type: [Number, String], required: true },
  profileType: { type: String, required: true }, // 'master', 'coordenador', 'supervisor', 'consultor'
  lojaId: { type: [Number, String], default: null },
  regionalId: { type: [Number, String], default: null },
  formatCurrency: { type: Function, required: true }
});

const columns = [
  { key: 'rank', label: 'Posição' },
  { key: 'consultor_nome', label: 'Consultor' },
  { key: 'total_producao', label: 'Produção Total' }
];

// Função auxiliar para rankear consultores
const rankConsultores = (consultores) => {
  return (consultores || [])
    .slice()
    .sort((a, b) => (b.total_producao || 0) - (a.total_producao || 0))
    .map((consultor, index) => ({
      ...consultor,
      rank: index + 1
    }));
};

// Rankings computados
const globalRanking = computed(() => rankConsultores(props.consultores));

const regionalRanking = computed(() => {
  if (!props.regionalId) return [];
  return rankConsultores(
    props.consultores.filter(c => String(c.regional_id) === String(props.regionalId))
  );
});

const storeRanking = computed(() => {
  if (!props.lojaId) return [];
  return rankConsultores(
    props.consultores.filter(c => String(c.loja_id) === String(props.lojaId))
  );
});

// Posições do usuário atual
const currentGlobalRank = computed(() => {
  const idx = globalRanking.value.findIndex(c => String(c.consultor_id) === String(props.currentUserId));
  return idx === -1 ? null : idx + 1;
});

const currentRegionalRank = computed(() => {
  const idx = regionalRanking.value.findIndex(c => String(c.consultor_id) === String(props.currentUserId));
  return idx === -1 ? null : idx + 1;
});

const currentStoreRank = computed(() => {
  const idx = storeRanking.value.findIndex(c => String(c.consultor_id) === String(props.currentUserId));
  return idx === -1 ? null : idx + 1;
});

// Controle de visibilidade dos rankings baseado no perfil
const showGlobalRanking = computed(() => ['master', 'coordenador'].includes(props.profileType));
const showRegionalRanking = computed(() => ['coordenador', 'supervisor', 'consultor'].includes(props.profileType));
const showStoreRanking = computed(() => ['supervisor', 'consultor'].includes(props.profileType));

const getRankColor = (rank) => {
  if (rank === 1) return 'amber';
  if (rank === 2) return 'gray';
  if (rank === 3) return 'orange';
  return 'gray';
};
</script>