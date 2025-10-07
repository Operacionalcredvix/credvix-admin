<template>
  <div>
    <header class="mb-8">
      <h1 class="text-primary-500 text-3xl font-bold">Desempenho Individual</h1>
      <p class="text-gray-500 mt-1">Acompanhe o desempenho de cada consultor em relação às suas metas.</p>
    </header>

    <!-- Filtros -->
    <UCard class="mb-8">
      <div class="flex items-end gap-4">
        <UFormGroup label="Período" name="period" class="flex-grow">
          <UInput type="month" v-model="selectedPeriod" />
        </UFormGroup>
        <UFormGroup label="Loja" name="store" class="flex-grow">
          <USelectMenu v-model="selectedLoja" :options="lojas" value-attribute="id" option-attribute="nome" placeholder="Todas as Lojas" clearable />
        </UFormGroup>
      </div>
    </UCard>

    <!-- Tabela de Desempenho -->
    <UCard>
      <UTable :rows="desempenho" :columns="columns" :loading="pending">
        <template #consultor_nome-data="{ row }">
          <div>
            <p class="font-bold">{{ row.consultor_nome }}</p>
            <p class="text-xs text-gray-500">{{ row.loja_nome }}</p>
          </div>
        </template>

        <template #desempenho_cnc-data="{ row }">
          <PerformanceCell :atingido="row.atingido_cnc" :meta="row.meta_individual_cnc" type="currency" />
        </template>
        <template #desempenho_card-data="{ row }">
          <PerformanceCell :atingido="row.atingido_card" :meta="row.meta_individual_card" type="currency" />
        </template>
        <template #desempenho_card_beneficio-data="{ row }">
          <PerformanceCell :atingido="row.atingido_card_beneficio" :meta="row.meta_individual_card_beneficio" type="currency" />
        </template>
        <template #desempenho_consignado-data="{ row }">
          <PerformanceCell :atingido="row.atingido_consignado" :meta="row.meta_individual_consignado" type="currency" />
        </template>
        <template #desempenho_fgts-data="{ row }">
          <PerformanceCell :atingido="row.atingido_fgts" :meta="row.meta_individual_fgts" type="currency" />
        </template>
        <template #desempenho_bmg_med-data="{ row }">
          <PerformanceCell :atingido="row.atingido_bmg_med" :meta="row.meta_individual_bmg_med" type="integer" />
        </template>
        <template #desempenho_seguro_familiar-data="{ row }">
          <PerformanceCell :atingido="row.atingido_seguro_familiar" :meta="row.meta_individual_seguro_familiar" type="integer" />
        </template>
      </UTable>
    </UCard>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

definePageMeta({
  middleware: 'auth',
  profiles: ['Master', 'Coordenador', 'Supervisor']
});

const supabase = useSupabaseClient();

// --- ESTADO E FILTROS ---
const selectedPeriod = ref(new Date().toISOString().slice(0, 7)); // YYYY-MM
const selectedLoja = ref(null);

// --- CARREGAMENTO DE DADOS ---
const { data: lojas } = await useAsyncData('lojas-para-filtro', async () => {
  const { data } = await supabase.from('lojas').select('id, nome').order('nome');
  return data || [];
});

const { data: desempenho, pending, refresh } = await useAsyncData(
  'desempenho-consultores',
  async () => {
    const firstDayOfMonth = `${selectedPeriod.value}-01`;
    let query = supabase
      .from('desempenho_consultores')
      .select('*')
      .eq('periodo', firstDayOfMonth);

    if (selectedLoja.value) {
      query = query.eq('loja_id', selectedLoja.value);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Erro ao buscar desempenho:", error);
      return [];
    }
    return data;
  },
  { watch: [selectedPeriod, selectedLoja] }
);

// --- CONFIGURAÇÃO DA TABELA ---
const columns = [
  { key: 'consultor_nome', label: 'Consultor' },
  { key: 'desempenho_cnc', label: 'CNC' },
  { key: 'desempenho_card', label: 'CARD' },
  { key: 'desempenho_card_beneficio', label: 'CARD Benefício' },
  { key: 'desempenho_consignado', label: 'Consignado' },
  { key: 'desempenho_fgts', label: 'FGTS' },
  { key: 'desempenho_bmg_med', label: 'BMG MED' },
  { key: 'desempenho_seguro_familiar', label: 'Seguro Familiar' },
];
</script>