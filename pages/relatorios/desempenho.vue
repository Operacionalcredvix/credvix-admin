<template>
  <div>
    <header class="mb-8">
      <h1 class="text-primary-500 text-3xl font-bold">Relatório de Desempenho</h1>
      <p class="text-gray-500 mt-1">Compare o desempenho entre lojas ou regionais num período específico.</p>
    </header>

    <!-- Card de Filtros -->
    <UCard class="mb-8">
      <div class="flex flex-wrap items-end gap-4">
        <UFormGroup label="Agrupar por" name="groupBy">
          <USelectMenu v-model="filters.groupBy" :options="groupByOptions" />
        </UFormGroup>

        <UFormGroup label="Data de Início" name="startDate">
          <UInput v-model="filters.startDate" type="date" />
        </UFormGroup>

        <UFormGroup label="Data de Fim" name="endDate">
          <UInput v-model="filters.endDate" type="date" />
        </UFormGroup>

        <UButton @click="fetchReportData" :loading="loading" icon="i-heroicons-chart-bar" size="lg">
          Gerar Relatório
        </UButton>
      </div>
    </UCard>

    <!-- Card de Resultados -->
    <UCard v-if="reportData.length > 0 || loading">
      <template #header>
        <h2 class="font-semibold text-lg">Resultados do Relatório</h2>
      </template>

      <UTable :rows="reportData" :columns="columns" :loading="loading">
        <template #volume_total-data="{ row }">
          <span>{{ formatCurrency(row.volume_total) }}</span>
        </template>
        <template #ticket_medio-data="{ row }">
          <span>{{ formatCurrency(row.ticket_medio) }}</span>
        </template>
      </UTable>

      <!-- NOVO: Gráfico de Barras -->
      <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 class="font-semibold text-lg mb-4">Gráfico de Volume Total</h3>
        <div class="h-96"><Bar :data="chartData" :options="chartOptions" /></div>
      </div>

    </UCard>

    <div v-else-if="searched" class="text-center py-8">
      <UIcon name="i-heroicons-exclamation-triangle" class="text-4xl text-gray-400 mb-2" />
      <p class="text-gray-500">Nenhum dado encontrado para os filtros selecionados.</p>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

definePageMeta({
  middleware: 'auth',
  // Defina os perfis que podem acessar este relatório
  profiles: ['Master', 'Backoffice', 'Coordenador']
});

const supabase = useSupabaseClient();
const toast = useToast();

// --- Estado dos Filtros ---
const groupByOptions = ['loja', 'regional'];
const filters = reactive({
  groupBy: 'loja',
  // Define as datas padrão para o mês atual
  startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
});

// --- Estado dos Dados ---
const loading = ref(false);
const searched = ref(false); // Para saber se uma busca já foi feita
const reportData = ref([]);

// --- Colunas da Tabela ---
const columns = computed(() => [
  { key: 'nome', label: filters.groupBy === 'loja' ? 'Loja' : 'Regional', sortable: true },
  { key: 'total_contratos', label: 'Nº de Contratos', sortable: true },
  { key: 'volume_total', label: 'Volume Total', sortable: true },
  { key: 'ticket_medio', label: 'Ticket Médio', sortable: true },
]);

// --- NOVO: Configuração do Gráfico ---
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
};

const chartData = computed(() => {
  if (!reportData.value || reportData.value.length === 0) {
    return { labels: [], datasets: [] };
  }

  return {
    labels: reportData.value.map(item => item.nome),
    datasets: [
      {
        label: `Volume Total por ${filters.groupBy === 'loja' ? 'Loja' : 'Regional'}`,
        backgroundColor: '#3b82f6', // Cor primária
        data: reportData.value.map(item => item.volume_total),
      },
    ],
  };
});

// --- Lógica de Busca ---
const fetchReportData = async () => {
  loading.value = true;
  searched.value = true;
  reportData.value = [];

  try {
    const { data, error } = await supabase.rpc('gerar_relatorio_desempenho', {
      data_inicio: filters.startDate,
      data_fim: filters.endDate,
      agrupar_por: filters.groupBy
    });

    if (error) throw error;

    // Ordena os dados pelo volume total para um ranking mais claro
    reportData.value = data.sort((a, b) => b.volume_total - a.volume_total);

  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    toast.add({ title: 'Erro!', description: 'Não foi possível gerar o relatório.', color: 'red' });
  } finally {
    loading.value = false;
  }
};

// --- Funções de Formatação ---
const formatCurrency = (value) => {
  if (value === null || isNaN(value)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Carrega os dados iniciais ao montar a página
onMounted(() => {
  fetchReportData();
});
</script>