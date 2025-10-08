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

          <template #percentual_multi_volume-data="{ row }">
            <UTooltip>
              <template #text>
                <div class="text-xs p-1">
                  <p>Divisor da Meta: <span class="font-bold">{{ row.divisor_meta }}</span></p>
                  <p class="mt-1 text-gray-400">Cálculo: Menor valor entre Orçados e Ativos.</p>
                  <ul class="list-disc list-inside mt-1">
                    <li>Nº Orçados: {{ row.orçados }}</li>
                    <li>Consultores Ativos: {{ row.qtd_consultores_ativos }}</li>
                  </ul>
                </div>
              </template>
              <div class="w-full">
                <p class="text-center font-bold" :class="getPercentageColor(row.percentual_multi_volume)">
                  {{ row.percentual_multi_volume.toFixed(2) }}%
                </p>
                <UProgress :value="row.percentual_multi_volume" :color="getProgressBarColor(row.percentual_multi_volume)" />
                <p class="text-xs text-gray-500 text-center mt-1">
                  {{ formatCurrency(row.atingido_multi_volume) }} / {{ formatCurrency(row.meta_multi_volume) }}
                </p>
              </div>
            </UTooltip>
          </template>

          <!-- As colunas de valor agora mostram o atingido vs a meta -->
          <template #meta_cnc-data="{ row }">{{ formatCurrency(row.meta_cnc) }}</template>
          <template #meta_card-data="{ row }">{{ formatCurrency(row.meta_card) }}</template>
          <template #meta_card_beneficio-data="{ row }">{{ formatCurrency(row.meta_card_beneficio) }}</template>
          <template #meta_consignado-data="{ row }">{{ formatCurrency(row.meta_consignado) }}</template>
          <template #meta_fgts-data="{ row }">{{ formatCurrency(row.meta_fgts) }}</template>

          <template #meta_bmg_med-data="{ row }">
            <span :class="row.atingido_bmg_med >= row.meta_bmg_med ? 'text-green-500 font-bold' : ''">{{ row.atingido_bmg_med }} / {{ row.meta_bmg_med }}</span>
          </template>
          <template #meta_seguro_familiar-data="{ row }">
            <span :class="row.atingido_seguro_familiar >= row.meta_seguro_familiar ? 'text-green-500 font-bold' : ''">{{ row.atingido_seguro_familiar }} / {{ row.meta_seguro_familiar }}</span>
          </template>

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

            <UFormGroup label="Qtd. Orçados" name="orçados" required>
              <UInput v-model.number="formData.orçados" type="number" placeholder="Nº ideal de consultores" />
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
  middleware: 'auth',
  profiles: ['Master']
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
  orçados: 1,
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

const { data: goals, pending, refresh } = await useAsyncData('metas-progresso', async () => {
  const firstDayOfMonth = `${selectedPeriod.value}-01`;
  const { data } = await supabase
    .from('metas_progresso') // <-- MUDANÇA: Usando a nova VIEW
    .select('*')
    .eq('periodo', firstDayOfMonth);
  return data || [];
}, { watch: [selectedPeriod] });

// --- COLUNAS E FORMATAÇÃO DA TABELA ---
const columns = [
  { key: 'loja_nome', label: 'Loja', class: 'w-1/12' },
  { key: 'percentual_multi_volume', label: '% Multi Volume', class: 'w-2/12' },
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
  if (!goals.value) return [];

  // 1. Agrupa as metas por coordenador (os dados já vêm calculados da VIEW)
  const groups = goals.value.reduce((acc, goal) => {
    const coordinatorName = goal.coordenador_nome || 'Sem Coordenador';
    if (!acc[coordinatorName]) {
      acc[coordinatorName] = { goals: [] };
    }
    acc[coordinatorName].goals.push(goal);
    return acc;
  }, {});

  // 2. Formata os dados para a tabela e para o gráfico
  return Object.entries(groups).map(([coordinatorName, groupData]) => {
    const goalsInGroup = groupData.goals;
    const chartLabels = goalsInGroup.map(g => g.loja_nome || 'N/A');
    const chartDataMeta = goalsInGroup.map(g => g.meta_multi_volume);
    const chartDataAtingido = goalsInGroup.map(g => g.atingido_multi_volume);

    const totalMetaMultiVolume = goalsInGroup.reduce((sum, goal) => sum + goal.meta_multi_volume, 0);
    const totalAtingido = goalsInGroup.reduce((sum, goal) => sum + goal.atingido_multi_volume, 0);

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

const getPercentageColor = (percentage) => {
  if (percentage >= 100) return 'text-green-500';
  if (percentage >= 75) return 'text-yellow-500';
  return 'text-red-500';
};

const getProgressBarColor = (percentage) => {
  if (percentage >= 100) return 'green';
  if (percentage >= 75) return 'yellow';
  return 'red';
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
  // A VIEW já traz todos os dados necessários, não precisa mais buscar o original.
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
    // Filtra o formData para enviar apenas as colunas que existem na tabela 'metas'
    const dataToSave = {
      id: formData.id,
      loja_id: formData.loja_id,
      periodo: `${formData.periodo}-01`,
      orçados: formData.orçados,
      meta_cnc: formData.meta_cnc,
      meta_card: formData.meta_card,
      meta_card_beneficio: formData.meta_card_beneficio,
      meta_consignado: formData.meta_consignado,
      meta_bmg_med: formData.meta_bmg_med,
      meta_seguro_familiar: formData.meta_seguro_familiar,
      meta_fgts: formData.meta_fgts,
    };

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