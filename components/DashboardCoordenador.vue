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
        <!-- CORREÇÃO: Adiciona um filtro de mês específico para as metas -->
        <UFormGroup label="Mês da Meta" name="goalMonth" class="flex-grow">
          <UInput type="month" v-model="selectedPeriod" />
        </UFormGroup>
        <UFormGroup v-if="regionais.length > 1" label="Regional" name="regional" class="flex-grow">
          <USelectMenu v-model="selectedRegional" :options="regionais" value-attribute="id"
            option-attribute="nome_regional" placeholder="Todas as suas Regionais" clearable />
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
      </div>
      <!-- NOVO: Card de Ranking de Lojas (componente reutilizável) -->
      <RankingStores 
        v-if="rankedStores.length > 0" 
        :stores="rankedStores" 
        :columns="rankingColumns" 
        :currentStoreId="currentStoreId"
        :allStores="rankedStores"
        title="Ranking de Lojas (Multi Volume)" 
      />

      <!-- Ranking de Usuários (Geral e Regional para Coordenador) -->
      <RankingUsers v-if="consultores && consultores.length > 0" :consultores="consultores" :currentUserId="profile.value?.id" profileType="coordenador" :regionalId="selectedRegional || regionais[0]?.id" :formatCurrency="formatCurrency" />

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
          <template #desempenho_cnc-data="{ row }">
            <div class="text-right">
              <p class="font-bold">{{ formatCurrency(row.atingido_cnc) }}</p>
              <p class="text-xs text-gray-500">/ {{ formatCurrency(row.meta_individual_cnc) }}</p>
            </div>
          </template>
          <template #desempenho_card-data="{ row }">
            <div class="text-right">
              <p class="font-bold">{{ formatCurrency(row.atingido_card) }}</p>
              <p class="text-xs text-gray-500">/ {{ formatCurrency(row.meta_individual_card) }}</p>
            </div>
          </template>
          <template #desempenho_consignado-data="{ row }">
            <div class="text-right">
              <p class="font-bold">{{ formatCurrency(row.atingido_consignado) }}</p>
              <p class="text-xs text-gray-500">/ {{ formatCurrency(row.meta_individual_consignado) }}</p>
            </div>
          </template>
          <template #desempenho_fgts-data="{ row }">
            <div class="text-right">
              <p class="font-bold">{{ formatCurrency(row.atingido_fgts) }}</p>
              <p class="text-xs text-gray-500">/ {{ formatCurrency(row.meta_individual_fgts) }}</p>
            </div>
          </template>
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

      <!-- NOVA SEÇÃO: ACOMPANHAMENTO DE METAS -->
      <div v-if="metasPending" class="text-center py-10 text-gray-500">
        <UIcon name="i-heroicons-arrow-path" class="text-2xl animate-spin" />
        <p>A carregar metas...</p>
      </div>
      <div v-else-if="groupedGoals.length === 0" class="text-center py-10 text-gray-500 mt-8">
        <UIcon name="i-heroicons-trophy" class="text-4xl" />
        <p class="mt-2">Nenhuma meta encontrada para o período selecionado.</p>
      </div>
      <div v-else class="space-y-8 mt-8">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Acompanhamento de Metas</h2>
        <UCard v-for="group in groupedGoals" :key="group.regionalName">
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold text-primary-600">Regional: {{ group.regionalName }}</h3>
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

          <UTable :rows="group.goals" :columns="metasColumns">
            <template #loja_nome-data="{ row }">
              <span class="font-medium">{{ row.loja_nome }}</span>
            </template>

            <template #percentual_multi_volume-data="{ row }">
              <div class="w-full">
                <p class="text-center font-bold" :class="getPercentageColor(row.percentual_multi_volume)">
                  {{ row.percentual_multi_volume.toFixed(2) }}%
                </p>
                <UProgress :value="row.percentual_multi_volume" :color="getProgressBarColor(row.percentual_multi_volume)" />
                <p class="text-xs text-gray-500 text-center mt-1">
                  {{ formatCurrency(row.atingido_multi_volume) }} / {{ formatCurrency(row.meta_multi_volume) }}
                </p>
              </div>
            </template>

            <template #meta_bmg_med-data="{ row }">
              <span :class="row.atingido_bmg_med >= row.meta_bmg_med ? 'text-green-500 font-bold' : ''">{{ row.atingido_bmg_med }} / {{ row.meta_bmg_med }}</span>
            </template>
            <template #meta_seguro_familiar-data="{ row }">
              <span :class="row.atingido_seguro_familiar >= row.meta_seguro_familiar ? 'text-green-500 font-bold' : ''">{{ row.atingido_seguro_familiar }} / {{ row.meta_seguro_familiar }}</span>
            </template>
          </UTable>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup>
import RankingStores from '~/components/RankingStores.vue';
import RankingUsers from '~/components/RankingUsers.vue';
import { ref, reactive, computed } from 'vue';
import { Bar, Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

const supabase = useSupabaseClient();
const { profile } = useProfile();
const currentStoreId = computed(() => profile?.value?.loja_id ?? null);
const toast = useToast();

// --- ESTADO ---
const selectedRegional = ref(null);
const dateRange = reactive({ start: '', end: '' });
// --- CORREÇÃO: Inicializa a variável para o filtro de metas ---
const selectedPeriod = ref(new Date().toISOString().slice(0, 7)); // Formato YYYY-MM


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
const { data: regionais } = await useAsyncData('regionais-filtro-coordenador', async () => {
  const { data } = await supabase.from('regionais').select('id, nome_regional').eq('coordenador_id', profile.value.id).order('nome_regional');
  return data || [];
});

const { data: dashboardData, pending } = useAsyncData('dashboard-data-coordenador', async () => {
  if (!profile.value?.user_id || !dateRange.start || !dateRange.end) return { stats: {}, statusChart: {}, lojasChart: {}, produtosChart: {} };
  const { data, error } = await supabase.rpc('get_dashboard_data_coordenador', {
    p_user_id: profile.value.user_id,
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

const { data: desempenhoConsultores } = await useAsyncData('desempenho-consultores-coordenador', async () => {
  const regionalIds = regionais.value?.map(r => r.id) || [];
  if (regionalIds.length === 0) return [];

  // CORREÇÃO: A busca de desempenho deve ser feita pelo mês da meta (selectedPeriod), não pelo intervalo de produção (dateRange).
  if (!selectedPeriod.value) return [];
  const firstDayOfMonth = `${selectedPeriod.value}-01`;

  let query = supabase.from('desempenho_consultores').select('consultor_nome, loja_nome, atingido_cnc, meta_individual_cnc, atingido_card, meta_individual_card, atingido_consignado, meta_individual_consignado, atingido_fgts, meta_individual_fgts').eq('periodo', firstDayOfMonth);
  
  if (selectedRegional.value) {
    query = query.eq('regional_id', selectedRegional.value);
  } else {
    query = query.in('regional_id', regionalIds);
  }
  
  const { data } = await query;
  return data || [];
}, { watch: [selectedPeriod, selectedRegional, regionais] }); // CORREÇÃO: Observa a variável correta

// --- BUSCA DE CONSULTORES (para ranking de usuários) ---
const { data: consultores } = await useAsyncData('consultores-ranking-coordenador', async () => {
  if (!selectedPeriod.value) return [];
  const firstDayOfMonth = `${selectedPeriod.value}-01`;
  const regionalIds = regionais.value?.map(r => r.id) || [];
  if (regionalIds.length === 0) return [];
  let query = supabase.from('desempenho_consultores').select('consultor_id, consultor_nome, loja_id, loja_nome, regional_id, nome_regional, atingido_cnc, atingido_card, atingido_card_beneficio, atingido_consignado, atingido_fgts').eq('periodo', firstDayOfMonth).in('regional_id', regionalIds);
  if (selectedRegional.value) query = query.eq('regional_id', selectedRegional.value);
  const { data } = await query;
  return (data || []).map(c => ({
    ...c,
    total_producao: (c.atingido_cnc || 0) + (c.atingido_card || 0) + (c.atingido_card_beneficio || 0) + (c.atingido_consignado || 0) + (c.atingido_fgts || 0)
  }));
}, { watch: [selectedPeriod, selectedRegional, regionais] });

// --- NOVA BUSCA DE DADOS PARA METAS ---
const { data: metasProgresso, pending: metasPending } = useAsyncData('metas-progresso-coordenador', async () => {
  const regionalIds = regionais.value?.map(r => r.id);
  if (!regionalIds || regionalIds.length === 0 || !dateRange.start) return [];
  // CORREÇÃO: Usa o novo filtro de período 'selectedPeriod'
  if (!selectedPeriod.value) return [];
  const firstDayOfMonth = `${selectedPeriod.value}-01`;
  let query = supabase
    .from('metas_progresso')
    .select('*')
    .eq('periodo', firstDayOfMonth)
    .in('regional_id', regionalIds);

  if (selectedRegional.value) {
    query = query.eq('regional_id', selectedRegional.value);
  }

  const { data, error } = await query;
  if (error) toast.add({ title: 'Erro ao buscar metas', description: error.message, color: 'red' });
  return data || [];
}, { watch: [selectedPeriod, selectedRegional, regionais] }); // CORREÇÃO: Observa a variável correta

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

// --- FUNÇÕES DE APOIO QUE FALTAVAM ---
const calculatePercentage = (atingido, meta) => {
  if (!meta || meta === 0) {
    return atingido > 0 ? 100 : 0;
  }
  return (atingido / meta) * 100;
};

// --- LÓGICA PARA O RANKING DE LOJAS ---
const rankingColumns = [
  { key: 'rank', label: 'Posição' },
  { key: 'loja_nome', label: 'Loja' },
  { key: 'percentual_multi_volume', label: '% Atingido' },
];

const rankedStores = computed(() => {
  if (!metasProgresso.value || metasProgresso.value.length === 0) return [];
  return metasProgresso.value
    .slice()
    .sort((a, b) => b.percentual_multi_volume - a.percentual_multi_volume)
    .map((store, index) => ({
      ...store,
      rank: index + 1,
    }));
});
// --- NOVAS COLUNAS E LÓGICA PARA A TABELA DE METAS ---
const metasColumns = [
  { key: 'loja_nome', label: 'Loja' },
  { key: 'percentual_multi_volume', label: '% Multi Volume' },
  { key: 'meta_bmg_med', label: 'BMG MED' },
  { key: 'meta_seguro_familiar', label: 'Seguro Familiar' },
];

const groupedGoals = computed(() => {
  if (!metasProgresso.value) return [];

  const groups = metasProgresso.value.reduce((acc, goal) => {
    const regionalName = goal.nome_regional || 'Sem Regional';
    if (!acc[regionalName]) {
      acc[regionalName] = { goals: [] };
    }
    acc[regionalName].goals.push(goal);
    return acc;
  }, {});

  return Object.entries(groups).map(([regionalName, groupData]) => {
    const goalsInGroup = groupData.goals;
    const chartLabels = goalsInGroup.map(g => g.loja_nome || 'N/A');
    const chartDataMeta = goalsInGroup.map(g => g.meta_multi_volume);
    const chartDataAtingido = goalsInGroup.map(g => g.atingido_multi_volume);

    return {
      regionalName,
      goals: goalsInGroup,
      totalMetaMultiVolume: goalsInGroup.reduce((sum, goal) => sum + goal.meta_multi_volume, 0),
      totalAtingido: goalsInGroup.reduce((sum, goal) => sum + goal.atingido_multi_volume, 0),
      chartData: {
        labels: chartLabels,
        datasets: [
          { label: 'Meta Multi Volume', backgroundColor: '#a5b4fc', data: chartDataMeta },
          { label: 'Valor Atingido', backgroundColor: '#4f46e5', data: chartDataAtingido }
        ]
      }
    };
  });
});

const getPercentageColor = (percentage) => {
  if (percentage >= 100) return 'text-green-500';
  if (percentage >= 75) return 'text-yellow-500';
  return 'text-red-500'; // This is for text color, it's ok.
};

const getProgressBarColor = (percentage) => {
  if (percentage >= 100) return 'green';
  if (percentage >= 75) return 'yellow';
  return 'red'; // This is for UProgress, it's ok.
};

const getRankColor = (rank) => {
  if (rank === 1) return 'amber';
  if (rank === 2) return 'gray';
  if (rank === 3) return 'orange';
  return 'gray';
};
</script>