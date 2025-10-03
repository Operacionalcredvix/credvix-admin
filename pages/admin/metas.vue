<template>
  <div>
    <header class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-primary-500 text-3xl font-bold">Gestão de Metas</h1>
          <p class="text-gray-500 mt-1">Defina e acompanhe as metas mensais das lojas.</p>
        </div>
        <UButton icon="i-heroicons-plus-circle" size="lg" @click="openModal()">
          Nova Meta
        </UButton>
      </div>
    </header>

    <!-- Filtros -->
    <UCard class="mb-8">
      <div class="flex items-end gap-4">
        <UFormGroup label="Período" name="period">
          <UInput type="month" v-model="selectedPeriod" />
        </UFormGroup>
      </div>
    </UCard>

    <!-- Tabela de Metas -->
    <div v-if="pending" class="text-center py-10 text-gray-500">
      <UIcon name="i-heroicons-arrow-path" class="text-2xl animate-spin" />
      <p>A carregar metas...</p>
    </div>
    <div v-else-if="groupedGoals.length === 0" class="text-center py-10 text-gray-500">
      <UIcon name="i-heroicons-trophy" class="text-4xl" />
      <p class="mt-2">Nenhuma meta encontrada para o período selecionado.</p>
    </div>
    <div v-else class="space-y-8">
      <UCard v-for="group in groupedGoals" :key="group.coordinatorName">
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-primary-600">Coordenador: {{ group.coordinatorName }}</h3>
            <div class="flex gap-6 text-right">
              <div>
                <p class="text-sm text-gray-500">Total Meta Multi Volume</p>
                <p class="text-xl font-bold text-gray-800 dark:text-gray-200">{{ formatCurrency(group.totalMetaMultiVolume) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Total Atingido</p>
                <p class="text-xl font-bold text-primary-500">{{ formatCurrency(group.totalAtingido) }}</p>
              </div>
            </div>
          </div>
        </template>
          <!-- Gráfico de Comparação -->
          <div class="mb-8 h-80">
            <Bar :data="group.chartData" :options="chartOptions" />
          </div>

        <UTable :rows="group.goals" :columns="columns">
          <template #loja-data="{ row }">
            <span class="font-medium">{{ row.loja }}</span>
          </template>

          <template #meta_multi_volume-data="{ row }">
            <span class="font-bold">{{ formatCurrency(row.meta_multi_volume) }}</span>
          </template>

          <template #meta_cnc-data="{ row }">{{ formatCurrency(row.meta_cnc) }}</template>
          <template #meta_card-data="{ row }">{{ formatCurrency(row.meta_card) }}</template>
          <template #meta_card_beneficio-data="{ row }">{{ formatCurrency(row.meta_card_beneficio) }}</template>
          <template #meta_consignado-data="{ row }">{{ formatCurrency(row.meta_consignado) }}</template>
          <template #meta_fgts-data="{ row }">{{ formatCurrency(row.meta_fgts) }}</template>

          <template #actions-data="{ row }">
            <UButton icon="i-heroicons-pencil" size="sm" color="gray" variant="ghost" @click="handleEdit(row)" />
            <UButton icon="i-heroicons-trash" size="sm" color="red" variant="ghost" @click="handleDelete(row)" />
          </template>
        </UTable>
      </UCard>
    </div>

    <!-- Modal para Nova/Edição de Meta -->
    <UModal v-model="isModalOpen">
      <UForm :state="formData" @submit="handleSave">
        <UCard>
          <template #header>
            <h2 class="text-lg font-bold">{{ isEditing ? 'Editar Meta' : 'Definir Nova Meta' }}</h2>
          </template>

          <div class="space-y-4">
            <UFormGroup label="Loja" name="loja_id" required>
              <USelectMenu v-model="formData.loja_id" :options="lojas" value-attribute="id" option-attribute="nome"
                placeholder="Selecione a loja" :disabled="isEditing" />
            </UFormGroup>
            <UFormGroup label="Período" name="periodo" required>
              <UInput type="month" v-model="formData.periodo" :disabled="isEditing" />
            </UFormGroup>

            <div class="grid grid-cols-2 gap-4 pt-4">
              <UFormGroup label="CNC (Valor)" name="meta_cnc"><UInput v-model.number="formData.meta_cnc" type="number" step="0.01" /></UFormGroup>
              <UFormGroup label="CARD (Valor)" name="meta_card"><UInput v-model.number="formData.meta_card" type="number" step="0.01" /></UFormGroup>
              <UFormGroup label="CARD Benefício (Valor)" name="meta_card_beneficio"><UInput v-model.number="formData.meta_card_beneficio" type="number" step="0.01" /></UFormGroup>
              <UFormGroup label="Consignado (Valor)" name="meta_consignado"><UInput v-model.number="formData.meta_consignado" type="number" step="0.01" /></UFormGroup>
              <UFormGroup label="FGTS (Valor)" name="meta_fgts"><UInput v-model.number="formData.meta_fgts" type="number" step="0.01" /></UFormGroup>
              <UFormGroup label="BMG MED (Qtd)" name="meta_bmg_med"><UInput v-model.number="formData.meta_bmg_med" type="number" /></UFormGroup>
              <UFormGroup label="Seguro Familiar (Qtd)" name="meta_seguro_familiar"><UInput v-model.number="formData.meta_seguro_familiar" type="number" /></UFormGroup>
            </div>

            <div class="border-t pt-4 mt-4">
              <p class="text-sm text-gray-500">Meta Multi Volume (Calculado)</p>
              <p class="text-xl font-bold text-primary-500">{{ formatCurrency(metaMultiVolumeCalculada) }}</p>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-4">
              <UButton color="gray" variant="ghost" @click="isModalOpen = false">Cancelar</UButton>
              <UButton type="submit" :loading="saving">Salvar</UButton>
            </div>
          </template>
        </UCard>
      </UForm>
    </UModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

definePageMeta({
  middleware: 'auth'
});

const supabase = useSupabaseClient();
const toast = useToast();

// --- ESTADO DA PÁGINA ---
const isModalOpen = ref(false);
const isEditing = ref(false);
const saving = ref(false);
const selectedPeriod = ref(new Date().toISOString().slice(0, 7)); // Formato YYYY-MM

// --- DADOS DO FORMULÁRIO ---
const getInitialFormData = () => ({
  id: null,
  loja_id: null,
  periodo: selectedPeriod.value,
  meta_cnc: 0,
  meta_card: 0,
  meta_card_beneficio: 0,
  meta_consignado: 0,
  meta_bmg_med: 0,
  meta_seguro_familiar: 0,
  meta_fgts: 0,
});
const formData = reactive(getInitialFormData());

// --- CÁLCULO COMPUTADO PARA O FORMULÁRIO ---
const metaMultiVolumeCalculada = computed(() => {
  return (formData.meta_cnc || 0) + (formData.meta_card || 0) + 
         (formData.meta_card_beneficio || 0) + (formData.meta_consignado || 0) + 
         (formData.meta_fgts || 0);
});

// --- CARREGAMENTO DE DADOS ---
const { data: lojas } = await useAsyncData('lojas-para-metas', async () => {
  const { data } = await supabase.from('lojas').select('id, nome').order('nome');
  return data || [];
});

const { data: goals, pending, refresh } = await useAsyncData('metas', async () => {
  const firstDayOfMonth = `${selectedPeriod.value}-01`;
  const { data } = await supabase
    .from('metas')
    .select('*, lojas(nome, regionais(funcionarios(nome_completo)))')
    .eq('periodo', firstDayOfMonth);
  return data || [];
}, { watch: [selectedPeriod] });

const { data: contractData, pending: pendingContracts } = await useAsyncData('contratos-para-metas', async () => {
  const firstDayOfMonth = `${selectedPeriod.value}-01`;
  const lastDayOfMonth = new Date(new Date(firstDayOfMonth).getFullYear(), new Date(firstDayOfMonth).getMonth() + 1, 0).toISOString().split('T')[0];

  const { data } = await supabase
    .from('contratos')
    .select('loja_id, valor_total')
    .eq('status', 'Pago')
    .gte('data_pagamento', firstDayOfMonth)
    .lte('data_pagamento', lastDayOfMonth);
  return data || [];
}, { watch: [selectedPeriod] });

// --- COLUNAS E FORMATAÇÃO DA TABELA ---
const columns = [
  { key: 'loja', label: 'Loja' },
  { key: 'meta_multi_volume', label: 'Meta Multi Volume' },
  { key: 'meta_cnc', label: 'CNC' },
  { key: 'meta_card', label: 'CARD' },
  { key: 'meta_card_beneficio', label: 'CARD Benefício' },
  { key: 'meta_consignado', label: 'Consignado' },
  { key: 'meta_bmg_med', label: 'BMG MED' },
  { key: 'meta_seguro_familiar', label: 'Seguro Familiar' },
  { key: 'meta_fgts', label: 'FGTS' },
  { key: 'actions', label: 'Ações', sortable: false }
];

const groupedGoals = computed(() => {
  if (!goals.value || !contractData.value) return [];

  // 1. Calcula o valor atingido por loja
  const achievedValues = contractData.value.reduce((acc, contract) => {
    if (contract.loja_id && contract.valor_total) {
      acc[contract.loja_id] = (acc[contract.loja_id] || 0) + contract.valor_total;
    }
    return acc;
  }, {});

  // 2. Agrupa as metas por coordenador
  const groups = goals.value.reduce((acc, goal) => {
    const coordinatorName = goal.lojas?.regionais?.funcionarios?.nome_completo || 'Sem Coordenador';

    if (!acc[coordinatorName]) {
      acc[coordinatorName] = [];
    }

    const atingido = achievedValues[goal.loja_id] || 0;
    acc[coordinatorName].push({
      ...goal,
      loja: goal.lojas?.nome || 'Loja não encontrada',
      meta_multi_volume: (goal.meta_cnc || 0) + (goal.meta_card || 0) + (goal.meta_card_beneficio || 0) + (goal.meta_consignado || 0) + (goal.meta_fgts || 0),
      atingido: atingido
    });

    return acc;
  }, {});

  // 3. Formata os dados para a tabela e para o gráfico
  return Object.entries(groups).map(([coordinatorName, goalsInGroup]) => {
    const chartLabels = goalsInGroup.map(g => g.lojas?.nome || 'N/A');
    const chartDataMeta = goalsInGroup.map(g => g.meta_multi_volume);
    const chartDataAtingido = goalsInGroup.map(g => g.atingido);

    const totalMetaMultiVolume = goalsInGroup.reduce((sum, goal) => sum + goal.meta_multi_volume, 0);
    const totalAtingido = goalsInGroup.reduce((sum, goal) => sum + goal.atingido, 0);

    return {
      coordinatorName,
      goals: goalsInGroup,
      totalMetaMultiVolume,
      totalAtingido,
      chartData: {
        labels: chartLabels,
        datasets: [
          {
            label: 'Meta Multi Volume',
            backgroundColor: '#a5b4fc', // Indigo-300
            data: chartDataMeta
          },
          {
            label: 'Valor Atingido',
            backgroundColor: '#4f46e5', // Indigo-600
            data: chartDataAtingido
          }
        ]
      }
    };
  });
});

const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
};

// --- AÇÕES CRUD ---
const openModal = () => {
  isEditing.value = false;
  Object.assign(formData, getInitialFormData());
  isModalOpen.value = true;
};

const handleEdit = (row) => {
  // Encontra o registo original não formatado na lista 'goals'
  const originalGoal = goals.value.find(g => g.id === row.id);
  if (!originalGoal) {
    toast.add({ title: 'Erro', description: 'Não foi possível encontrar os dados originais da meta.', color: 'red' });
    return;
  }

  isEditing.value = true;
  // Usa o registo original para preencher o formulário
  Object.assign(formData, { ...originalGoal, periodo: originalGoal.periodo.slice(0, 7) });
  isModalOpen.value = true;
};

const handleSave = async () => {
  saving.value = true;
  try {
    const dataToSave = { ...formData, periodo: `${formData.periodo}-01` };

    // CORREÇÃO: Remove a propriedade 'lojas' que vem da junção de tabelas e não existe na tabela 'metas'.
    delete dataToSave.lojas;

    let error;

    if (isEditing.value) {
      const { id, ...updateData } = dataToSave;
      ({ error } = await supabase.from('metas').update(updateData).eq('id', id));
    } else {
      const { id, ...insertData } = dataToSave;
      ({ error } = await supabase.from('metas').insert(insertData));
    }

    if (error) {
      if (error.code === '23505') { // Código de violação de constraint única
        throw new Error('Já existe uma meta definida para esta loja neste período.');
      }
      throw error;
    }

    toast.add({ title: 'Sucesso!', description: `Meta ${isEditing.value ? 'atualizada' : 'criada'} com sucesso.` });
    isModalOpen.value = false;
    await refresh();
  } catch (err) {
    toast.add({ title: 'Erro!', description: err.message, color: 'red' });
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (row) => {
  if (confirm(`Tem a certeza que quer apagar a meta da loja "${row.loja}" para o período de ${selectedPeriod.value}?`)) {
    try {
      const { error } = await supabase.from('metas').delete().eq('id', row.id);
      if (error) throw error;
      toast.add({ title: 'Sucesso!', description: 'Meta apagada com sucesso.' });
      await refresh();
    } catch (err) {
      toast.add({ title: 'Erro!', description: err.message, color: 'red' });
    }
  }
};
</script>