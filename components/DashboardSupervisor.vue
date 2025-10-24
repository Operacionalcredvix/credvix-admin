<template>
  <div>
    <UCard class="mb-8">
      <div class="flex flex-wrap items-end gap-4">
        <UFormGroup label="Período de:" name="startDate" class="flex-grow">
          <UInput type="date" v-model="dateRange.start" />
        </UFormGroup>
        <UFormGroup label="Até:" name="endDate" class="flex-grow">
          <UInput type="date" v-model="dateRange.end" />
        </UFormGroup>
        <UFormGroup label="Mês da Meta" name="goalMonth" class="flex-grow">
          <UInput type="month" v-model="selectedPeriod" />
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
              <h3 class="font-semibold">Resumo de Contratos da Regional</h3>
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
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-shield-check" class="text-xl text-primary-500" />
                <div>
                  <h3 class="font-semibold">Seguros</h3>
                  <p class="text-xs text-gray-500 mt-0.5">Mês atual</p>
                </div>
              </div>
              <UPopover :popper="{ placement: 'bottom-end' }">
                <UButton icon="i-heroicons-calendar" size="xs" color="gray" variant="ghost" />
                <template #panel>
                  <div class="p-4">
                    <UInput type="date" v-model="segurosDateFilter" label="Filtrar por data" />
                  </div>
                </template>
              </UPopover>
            </div>
          </template>
          <div class="grid grid-cols-2 gap-4 text-center">
            <div class="flex flex-col items-center justify-center">
              <UIcon name="i-heroicons-heart" class="text-3xl text-rose-500" />
              <p class="text-sm text-gray-500 mt-2">BMG MED</p>
              <p class="text-2xl font-bold">{{ segurosStats.bmgMed || 0 }}</p>
            </div>
            <div class="flex flex-col items-center justify-center">
              <UIcon name="i-heroicons-shield-check" class="text-3xl text-sky-500" />
              <p class="text-sm text-gray-500 mt-2">Seguro Familiar</p>
              <p class="text-2xl font-bold">{{ segurosStats.seguroFamiliar || 0 }}</p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Rankings -->
      <div class="space-y-6">
        <RankingConsultants v-if="rankedConsultants.length > 0" :consultants="rankedConsultants" :columns="rankingColumns" title="Ranking de Consultores (Produção)" :formatCurrency="formatCurrency" />
        <RankingUsers v-if="consultores && consultores.length > 0" :consultores="consultores" :currentUserId="profile.value?.id" profileType="supervisor" :lojaId="profile.value?.loja_id" :formatCurrency="formatCurrency" />
        <RankingStores 
          v-if="metasProgressoRegional && metasProgressoRegional.length > 0" 
          :stores="rankedStores" 
          :allStores="metasProgressoRegional" 
          :currentStoreId="currentStoreId" 
          title="Ranking de Lojas - Sua Regional" 
        />
      </div>

      <!-- Gráficos -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <UCard>
          <template #header><h3 class="font-semibold">Contratos por Status</h3></template>
          <div v-if="hasData" class="h-80"><Doughnut :data="chartData.status" :options="chartOptions" /></div>
          <p v-else class="text-center text-gray-500">Sem dados para exibir.</p>
        </UCard>
        <UCard class="lg:col-span-2">
          <template #header><h3 class="font-semibold">Produção por Loja</h3></template>
          <div v-if="hasData" class="h-80"><Pie :data="chartData.lojas" :options="chartOptions" /></div>
          <p v-else class="text-center text-gray-500">Sem dados para exibir.</p>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { format } from 'date-fns';
import { Bar, Doughnut, Pie } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';
import RankingConsultants from '~/components/RankingConsultants.vue';
import RankingStores from '~/components/RankingStores.vue';
import RankingUsers from '~/components/RankingUsers.vue';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

const supabase = useSupabaseClient();
const { profile } = useProfile();
const currentStoreId = computed(() => profile?.value?.loja_id ?? null);
const toast = useToast();

// --- ESTADO ---
const dateRange = reactive({ start: '', end: '' });
const selectedPeriod = ref(new Date().toISOString().slice(0, 7));
const segurosDateFilter = ref(new Date().toISOString().split('T')[0]);

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
const { data: dashboardData, pending } = useAsyncData('dashboard-data-supervisor', async () => {
  if (!profile.value?.user_id || !dateRange.start || !dateRange.end) return { stats: {}, statusChart: {}, lojasChart: {} };
  const { data, error } = await supabase.rpc('get_dashboard_data_supervisor', {
    p_user_id: profile.value.user_id,
    p_start_date: dateRange.start,
    p_end_date: dateRange.end,
  });
  if (error) {
    toast.add({ title: 'Erro ao carregar dados', description: error.message, color: 'red' });
    return { stats: {}, statusChart: {}, lojasChart: {} };
  }
  return data;
}, { watch: [profile, dateRange] });

const { data: desempenhoConsultores } = await useAsyncData('desempenho-consultores-supervisor', async () => {
  if (!profile.value?.loja_id || !selectedPeriod.value) return [];

  // Busca a regional do supervisor a partir da sua loja
  const { data: lojaData } = await supabase.from('lojas').select('regional_id').eq('id', profile.value.loja_id).single();
  if (!lojaData?.regional_id) return [];

  const firstDayOfMonth = `${selectedPeriod.value}-01`;

  const { data } = await supabase.from('desempenho_consultores')
    .select('consultor_nome, loja_nome, atingido_cnc, atingido_card, atingido_card_beneficio, atingido_consignado, atingido_fgts')
    .eq('periodo', firstDayOfMonth)
    .eq('regional_id', lojaData.regional_id);

  return data || [];
}, { watch: [selectedPeriod, profile] });

// Busca metas da regional do supervisor para ranking de lojas
const { data: metasProgressoRegional, pending: metasPending } = await useAsyncData('metas-progresso-supervisor', async () => {
  if (!profile.value?.loja_id || !selectedPeriod.value) return [];
  const { data: lojaData } = await supabase.from('lojas').select('regional_id').eq('id', profile.value.loja_id).single();
  if (!lojaData?.regional_id) return [];
  const firstDayOfMonth = `${selectedPeriod.value}-01`;
  const { data } = await supabase.from('metas_progresso').select('*').eq('periodo', firstDayOfMonth).eq('regional_id', lojaData.regional_id);
  return data || [];
}, { watch: [selectedPeriod, profile] });

// --- BUSCA DE CONSULTORES (para ranking de usuários) ---
const { data: consultores } = await useAsyncData('consultores-ranking-supervisor', async () => {
  if (!profile.value?.loja_id || !selectedPeriod.value) return [];
  const { data: lojaData } = await supabase.from('lojas').select('regional_id').eq('id', profile.value.loja_id).single();
  if (!lojaData?.regional_id) return [];
  const firstDayOfMonth = `${selectedPeriod.value}-01`;
  const { data } = await supabase.from('desempenho_consultores').select('consultor_id, consultor_nome, loja_id, loja_nome, regional_id, nome_regional, atingido_cnc, atingido_card, atingido_card_beneficio, atingido_consignado, atingido_fgts').eq('periodo', firstDayOfMonth).eq('regional_id', lojaData.regional_id);
  return (data || []).map(c => ({
    ...c,
    total_producao: (c.atingido_cnc || 0) + (c.atingido_card || 0) + (c.atingido_card_beneficio || 0) + (c.atingido_consignado || 0) + (c.atingido_fgts || 0)
  }));
}, { watch: [selectedPeriod, profile] });

// --- BUSCA SEPARADA DE SEGUROS (VENDAS EXTERNAS) ---
const { data: segurosData } = await useAsyncData('seguros-supervisor', async () => {
  if (!segurosDateFilter.value || !profile.value?.loja_id) return null;

  // Calcular início e fim do mês selecionado
  const selectedDate = new Date(segurosDateFilter.value);
  const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59);
  
  const startStr = startOfMonth.toISOString().split('T')[0];
  const endStr = endOfMonth.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('vendas_externas')
    .select('tipo_produto, quantidade')
    .gte('data_venda', startStr)
    .lte('data_venda', endStr)
    .eq('loja_id', profile.value.loja_id);

  if (error) {
    toast.add({ title: 'Erro ao buscar seguros', description: error.message, color: 'red' });
    return null;
  }

  // Agregar por tipo de produto (robusto a variações de texto)
  const normalizeTipo = (v) => String(v || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_');

  const result = { bmgMed: 0, seguroFamiliar: 0 };
  (data || []).forEach(item => {
    const t = normalizeTipo(item.tipo_produto);
    if (t === 'bmg_med') {
      result.bmgMed += item.quantidade || 0;
    } else if (t === 'seguro_familiar') {
      result.seguroFamiliar += item.quantidade || 0;
    }
  });

  return result;
}, { watch: [segurosDateFilter, profile] });

const segurosStats = computed(() => segurosData.value || { bmgMed: 0, seguroFamiliar: 0 });

// --- CÁLCULOS E FORMATAÇÃO ---
const hasData = computed(() => dashboardData.value && dashboardData.value.stats?.total > 0);
const stats = computed(() => {
  const defaultStats = { total: 0, pagos: 0, pendentes: 0, cancelados: 0, valorTotal: 0, bmgMed: 0, seguroFamiliar: 0 };
  return dashboardData.value?.stats ? { ...defaultStats, ...dashboardData.value.stats } : defaultStats;
});

const chartData = computed(() => {
  const emptyChart = { labels: [], datasets: [] };
  if (!hasData.value || !dashboardData.value) return { status: emptyChart, lojas: emptyChart };
  const { statusChart, lojasChart } = dashboardData.value;
  const statusLabels = Object.keys(statusChart);
  const statusBackgroundColors = statusLabels.map(label => {
    if (['Pago', 'Aprovado'].includes(label)) return '#10b981';
    if (['Pendente', 'Em Análise'].includes(label)) return '#f59e0b';
    if (['Cancelado', 'Reprovado'].includes(label)) return '#ef4444';
    return '#6b7280';
  });
  const pieColors = ['#3b82f6', '#22c55e', '#ef4444', '#eab308', '#8b5cf6', '#f97316', '#14b8a6', '#ec4899', '#64748b', '#d946ef'];
  return {
    status: { labels: statusLabels, datasets: [{ backgroundColor: statusBackgroundColors, data: Object.values(statusChart) }] },
    lojas: { labels: Object.keys(lojasChart), datasets: [{ label: 'Produção', backgroundColor: pieColors, data: Object.values(lojasChart) }] },
  };
});

const chartOptions = { responsive: true, maintainAspectRatio: false };
const formatCurrency = (value) => value == null ? 'R$ 0,00' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// --- LÓGICA PARA O RANKING DE CONSULTORES ---
const rankingColumns = [
  { key: 'rank', label: 'Posição' },
  { key: 'consultor_nome', label: 'Consultor' },
  { key: 'total_producao', label: 'Produção Total' },
];

const rankedStores = computed(() => {
  if (!metasProgressoRegional.value || metasProgressoRegional.value.length === 0) return [];
  return metasProgressoRegional.value
    .slice()
    .sort((a, b) => (b.percentual_multi_volume || 0) - (a.percentual_multi_volume || 0))
    .map((store, index) => ({
      ...store,
      rank: index + 1
    }));
});

const rankedConsultants = computed(() => {
  if (!desempenhoConsultores.value || desempenhoConsultores.value.length === 0) return [];
  return desempenhoConsultores.value
    .map(consultor => ({
      ...consultor,
      total_producao: (consultor.atingido_cnc || 0) + (consultor.atingido_card || 0) + (consultor.atingido_card_beneficio || 0) + (consultor.atingido_consignado || 0) + (consultor.atingido_fgts || 0)
    }))
    .sort((a, b) => b.total_producao - a.total_producao)
    .map((consultor, index) => ({
      ...consultor,
      rank: index + 1,
    }));
});

const getRankColor = (rank) => {
  if (rank === 1) return 'amber';
  if (rank === 2) return 'gray';
  if (rank === 3) return 'orange';
  return 'gray';
};
</script>