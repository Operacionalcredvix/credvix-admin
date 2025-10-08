<template>
  <div>
    <UCard class="mb-8">
      <div class="flex flex-wrap items-center gap-4">
        <UFormGroup label="Período de:" name="startDate" class="flex-grow">
          <UInput type="date" v-model="dateRange.start" />
        </UFormGroup>
        <UFormGroup label="Até:" name="endDate" class="flex-grow">
          <UInput type="date" v-model="dateRange.end" />
        </UFormGroup>
        <UFormGroup label="Regional" name="regional" class="flex-grow">
          <USelectMenu v-model="selectedRegional" :options="regionais" value-attribute="id"
            option-attribute="nome_regional" placeholder="Todas as Regionais" clearable />
        </UFormGroup>
        <div class="pt-6 flex gap-2">
          <UButton @click="setDateRange('current_month')" label="Mês Atual" color="gray" variant="ghost" />
          <UButton @click="setDateRange('last_30_days')" label="Últimos 30 dias" color="gray" variant="ghost" />
        </div>
      </div>
    </UCard>

    <div v-if="pending" class="text-center py-10 text-gray-500">
      <UIcon name="i-heroicons-arrow-path" class="text-2xl animate-spin" />
      <p>A carregar dados do dashboard...</p>
    </div>

    <div v-else>
      <!-- Cards de Estatísticas -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <UCard class="lg:col-span-2">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-document-text" class="text-xl text-primary-500" />
              <h3 class="font-semibold">Resumo de Contratos</h3>
            </div>
          </template>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
            <div><p class="text-sm text-gray-500">Totais</p><p class="text-2xl font-bold">{{ stats.total }}</p></div>
            <div><p class="text-sm text-gray-500">Pagos</p><p class="text-2xl font-bold text-green-500">{{ stats.pagos }}</p></div>
            <div><p class="text-sm text-gray-500">Pendentes</p><p class="text-2xl font-bold text-amber-500">{{ stats.pendentes }}</p></div>
            <div><p class="text-sm text-gray-500">Cancelados</p><p class="text-2xl font-bold text-red-500">{{ stats.cancelados }}</p></div>
            <div class="col-span-2 md:col-span-3 lg:col-span-1 border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-4 mt-4 lg:mt-0"><p class="text-sm text-gray-500">Valor Total Pago</p><p class="text-2xl font-bold text-green-400">{{ formatCurrency(stats.valorTotal) }}</p></div>
          </div>
        </UCard>

        <UCard>
           <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-arrow-trending-up" class="text-xl text-primary-500" />
              <h3 class="font-semibold">Vendas Externas</h3>
            </div>
          </template>
          <div class="grid grid-cols-2 gap-4 text-center">
            <div class="flex flex-col items-center justify-center">
              <UIcon name="i-heroicons-heart" class="text-3xl text-rose-500" />
              <p class="text-sm text-gray-500 mt-2">BMG MED</p>
              <p class="text-2xl font-bold">{{ stats.bmgMed }}</p>
            </div>
            <div class="flex flex-col items-center justify-center">
              <UIcon name="i-heroicons-shield-check" class="text-3xl text-sky-500" />
              <p class="text-sm text-gray-500 mt-2">Seguro Familiar</p>
              <p class="text-2xl font-bold">{{ stats.seguroFamiliar }}</p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Tabela de Desempenho Individual -->
      <UCard v-if="desempenhoConsultores.length > 0" class="mb-8">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-users" class="text-xl text-primary-500" />
            <h3 class="font-semibold">Desempenho por Consultor</h3>
          </div>
        </template>
        <UTable :rows="desempenhoConsultores" :columns="desempenhoColumns">
          <template #consultor_nome-data="{ row }">
            <div>
              <p class="font-bold">{{ row.consultor_nome }}</p>
              <p class="text-xs text-gray-500">{{ row.loja_nome }}</p>
            </div>
          </template>
          <template #desempenho_cnc-data="{ row }"><PerformanceCell :atingido="row.atingido_cnc" :meta="row.meta_individual_cnc" type="currency" /></template>
          <template #desempenho_card-data="{ row }"><PerformanceCell :atingido="row.atingido_card" :meta="row.meta_individual_card" type="currency" /></template>
          <template #desempenho_consignado-data="{ row }"><PerformanceCell :atingido="row.atingido_consignado" :meta="row.meta_individual_consignado" type="currency" /></template>
          <template #desempenho_fgts-data="{ row }"><PerformanceCell :atingido="row.atingido_fgts" :meta="row.meta_individual_fgts" type="currency" /></template>
        </UTable>
      </UCard>

      <!-- Gráficos -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <UCard>
          <template #header><h3 class="font-semibold">Contratos por Status</h3></template>
          <div v-if="hasData" class="h-80"><Doughnut :data="chartData.status" :options="chartOptions" /></div>
          <p v-else class="text-center text-gray-500">Sem dados para exibir.</p>
        </UCard>
        <UCard class="lg:col-span-2">
          <template #header><h3 class="font-semibold">Top 10 Lojas por Contrato</h3></template>
          <div v-if="hasData" class="h-80"><Bar :data="chartData.lojas" :options="chartOptions" /></div>
          <p v-else class="text-center text-gray-500">Sem dados para exibir.</p>
        </UCard>
        <UCard class="lg:col-span-3">
          <template #header><h3 class="font-semibold">Contratos por Produto</h3></template>
          <div v-if="hasData" class="h-80"><Bar :data="chartData.produtos" :options="chartOptions" /></div>
          <p v-else class="text-center text-gray-500">Sem dados para exibir.</p>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { Bar, Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

const supabase = useSupabaseClient();
const { profile } = useProfile();
const toast = useToast();

// --- ESTADO ---
const selectedRegional = ref(null);
const dateRange = reactive({ start: '', end: '' });

// --- LÓGICA DE DATAS ---
const setDateRange = (period) => {
  const now = new Date();
  let startDate, endDate = now;
  if (period === 'current_month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'last_30_days') {
    startDate = new Date();
    startDate.setDate(now.getDate() - 30);
  }
  dateRange.start = startDate.toISOString().split('T')[0];
  dateRange.end = endDate.toISOString().split('T')[0];
};
setDateRange('current_month');

// --- BUSCA DE DADOS ---
const { data: regionais } = await useAsyncData('regionais-filtro-master', async () => {
  const { data } = await supabase.from('regionais').select('id, nome_regional').order('nome_regional');
  return data || [];
});

const { data: dashboardData, pending } = useAsyncData('dashboard-data-master', async () => {
  if (!profile.value?.user_id || !dateRange.start || !dateRange.end) return { stats: {}, statusChart: {}, lojasChart: {}, produtosChart: {} };
  const { data, error } = await supabase.rpc('get_dashboard_data_master', {
    p_start_date: dateRange.start,
    p_end_date: dateRange.end,
    p_regional_id: selectedRegional.value
  });
  if (error) {
    toast.add({ title: 'Erro ao carregar dados', description: error.message, color: 'red' });
    return { stats: {}, statusChart: {}, lojasChart: {}, produtosChart: {} };
  }
  return data;
}, { watch: [profile, dateRange, selectedRegional] });

const { data: desempenhoConsultores } = await useAsyncData('desempenho-consultores-master', async () => {
  let query = supabase.from('desempenho_consultores').select('consultor_nome, loja_nome, atingido_cnc, meta_individual_cnc, atingido_card, meta_individual_card, atingido_consignado, meta_individual_consignado, atingido_fgts, meta_individual_fgts').gte('periodo', dateRange.start).lte('periodo', dateRange.end);
  if (selectedRegional.value) {
    query = query.eq('regional_id', selectedRegional.value);
  }
  const { data } = await query;
  return data || [];
}, { watch: [dateRange, selectedRegional] });

// --- CÁLCULOS E FORMATAÇÃO ---
const hasData = computed(() => dashboardData.value && dashboardData.value.stats?.total > 0);
const stats = computed(() => {
  const defaultStats = { total: 0, pagos: 0, pendentes: 0, cancelados: 0, valorTotal: 0, bmgMed: 0, seguroFamiliar: 0 };
  return dashboardData.value?.stats ? { ...defaultStats, ...dashboardData.value.stats } : defaultStats;
});

const chartData = computed(() => {
  const emptyChart = { labels: [], datasets: [] };
  if (!hasData.value || !dashboardData.value) return { status: emptyChart, produtos: emptyChart, lojas: emptyChart };
  const { statusChart, lojasChart, produtosChart } = dashboardData.value;
  const productColors = ['#3b82f6', '#22c55e', '#ef4444', '#eab308', '#8b5cf6', '#f97316', '#14b8a6', '#ec4899', '#64748b', '#d946ef'];
  const statusLabels = Object.keys(statusChart);
  const statusBackgroundColors = statusLabels.map(label => {
    if (['Pago', 'Aprovado'].includes(label)) return '#10b981';
    if (['Pendente', 'Em Análise'].includes(label)) return '#f59e0b';
    if (['Cancelado', 'Reprovado'].includes(label)) return '#ef4444';
    return '#6b7280';
  });
  return {
    status: { labels: statusLabels, datasets: [{ backgroundColor: statusBackgroundColors, data: Object.values(statusChart) }] },
    lojas: { labels: Object.keys(lojasChart), datasets: [{ label: 'Contratos', backgroundColor: '#8b5cf6', data: Object.values(lojasChart) }] },
    produtos: { labels: Object.keys(produtosChart), datasets: [{ label: 'Contratos', backgroundColor: Object.keys(produtosChart).map((_, i) => productColors[i % productColors.length]), data: Object.values(produtosChart) }] }
  };
});

const chartOptions = { responsive: true, maintainAspectRatio: false };
const desempenhoColumns = [{ key: 'consultor_nome', label: 'Consultor' }, { key: 'desempenho_cnc', label: 'CNC' }, { key: 'desempenho_card', label: 'CARD' }, { key: 'desempenho_consignado', label: 'Consignado' }, { key: 'desempenho_fgts', label: 'FGTS' }];
const formatCurrency = (value) => value == null ? 'R$ 0,00' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
</script>