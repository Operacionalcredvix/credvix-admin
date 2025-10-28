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
        <UFormGroup label="Regional" name="regional" class="flex-grow">
          <USelectMenu v-model="selectedRegional" :options="regionais" value-attribute="id"
            option-attribute="nome_regional" placeholder="Todas as Regionais" clearable />
        </UFormGroup>
        <div class="pt-6 flex gap-2">
          <UButton @click="setDateRange('current_month')" label="Mês Atual" color="gray" variant="ghost" />
          <UButton @click="setDateRange('last_30_days')" label="Últimos 30 dias" color="gray" variant="ghost" />
        </div>
          <div class="pt-2 flex gap-2">
            <UButton @click="clearFilters" label="Limpar Filtros" color="red" variant="soft" icon="i-heroicons-x-mark" />
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
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-shield-check" class="text-xl text-primary-500" />
                <div>
                  <h3 class="font-semibold">Seguros</h3>
                  <p class="text-xs text-gray-500 mt-0.5">Mês atual</p>
                </div>
              </div>
              <UPopover :popper="{ placement: 'bottom-end' }">
                <UButton icon="i-heroicons-calendar" size="xs" color="gray" variant="ghost" />
                <template #panel="{ close }">
                  <div class="p-4 w-64">
                    <p class="text-sm font-medium mb-2">Filtrar por data</p>
                    <UInput type="date" v-model="segurosDateFilter" @change="close" />
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

  <!-- Ranking de Lojas (global) -->
  <UCard v-if="rankedStores.length > 0" class="mb-8">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h3 class="font-semibold">Ranking de Lojas (Multi Volume)</h3>
        <UButton 
          :icon="isRankingStoresExpanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" 
          size="xs" 
          color="gray" 
          variant="ghost"
          @click="isRankingStoresExpanded = !isRankingStoresExpanded"
        />
      </div>
    </template>
    <div v-show="isRankingStoresExpanded">
      <RankingStores :stores="rankedStores" :columns="metasColumns" title="" />
    </div>
  </UCard>

  <!-- Ranking de Usuários (Geral para Master) - CORREÇÃO: Garante que `profile.value` existe antes de aceder a `id` -->
  <UCard v-if="consultores && consultores.length > 0 && profile?.value?.id" class="mb-8">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h3 class="font-semibold">Ranking de Usuários</h3>
        <UButton 
          :icon="isRankingUsersExpanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" 
          size="xs" 
          color="gray" 
          variant="ghost"
          @click="isRankingUsersExpanded = !isRankingUsersExpanded"
        />
      </div>
    </template>
    <div v-show="isRankingUsersExpanded">
      <RankingUsers :consultores="consultores" :currentUserId="profile.value.id" profileType="master" :formatCurrency="formatCurrency" />
    </div>
  </UCard>

  <!-- Tabela de Desempenho Individual -->
      <UCard v-if="desempenhoConsultores.length > 0" class="mb-8">
        <template #header>
          <div class="flex items-center justify-between w-full">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-users" class="text-xl text-primary-500" />
              <h3 class="font-semibold">Desempenho por Consultor</h3>
            </div>
            <UButton 
              :icon="isDesempenhoConsultoresExpanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" 
              size="xs" 
              color="gray" 
              variant="ghost"
              @click="isDesempenhoConsultoresExpanded = !isDesempenhoConsultoresExpanded"
            />
          </div>
        </template>
        <div v-show="isDesempenhoConsultoresExpanded">
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
        </div>
      </UCard>

      <!-- Gráficos -->
      <UCard class="mb-8">
        <template #header>
          <div class="flex items-center justify-between w-full">
            <h3 class="font-semibold">Gráficos de Análise</h3>
            <UButton 
              :icon="isGraficosExpanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" 
              size="xs" 
              color="gray" 
              variant="ghost"
              @click="isGraficosExpanded = !isGraficosExpanded"
            />
          </div>
        </template>
        <div v-show="isGraficosExpanded">
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
      </UCard>

      <!-- NOVA SEÇÃO: ACOMPANHAMENTO DE METAS (COPIADO E ADAPTADO DO COORDENADOR) -->
      <div v-if="metasPending" class="text-center py-10 text-gray-500">
        <UIcon name="i-heroicons-arrow-path" class="text-2xl animate-spin" />
        <p>A carregar metas...</p>
      </div>
      <div v-else-if="groupedGoals.length === 0" class="text-center py-10 text-gray-500 mt-8">
        <UIcon name="i-heroicons-trophy" class="text-4xl" />
        <p class="mt-2">Nenhuma meta encontrada para o período selecionado.</p>
      </div>
      <UCard v-else class="mt-8">
        <template #header>
          <div class="flex items-center justify-between w-full">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Acompanhamento de Metas</h2>
            <UButton 
              :icon="isMetasExpanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" 
              size="xs" 
              color="gray" 
              variant="ghost"
              @click="isMetasExpanded = !isMetasExpanded"
            />
          </div>
        </template>
        <div v-show="isMetasExpanded" class="space-y-8">
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
      </UCard>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { format } from 'date-fns';
import { Bar, Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';
import PerformanceCell from '~/components/PerformanceCell.vue';
import RankingStores from '~/components/RankingStores.vue';
import RankingUsers from '~/components/RankingUsers.vue';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

const supabase = useSupabaseClient();
const { profile } = useProfile();
const toast = useToast();
const currentStoreId = computed(() => profile?.value?.loja_id ?? null);

// --- ESTADO ---
const selectedRegional = ref(null);
const dateRange = reactive({ start: '', end: '' });

// Estados de expansão dos cards
const isRankingStoresExpanded = ref(true);
const isRankingUsersExpanded = ref(true);
const isDesempenhoConsultoresExpanded = ref(true);
const isGraficosExpanded = ref(true);
const isMetasExpanded = ref(true);

// --- CORREÇÃO: Inicializa a variável para o filtro de metas ---
const selectedPeriod = ref(new Date().toISOString().slice(0, 7)); // Formato YYYY-MM

// --- FILTRO ESPECÍFICO PARA SEGUROS (mês atual por padrão) ---
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
    console.error('❌ [DashboardMaster] Erro ao carregar dados:', error);
    if (process.client) {
      toast.add({ title: 'Erro ao carregar dados', description: error.message, color: 'red' });
    }
    return { stats: {}, statusChart: {}, lojasChart: {}, produtosChart: {} };
  }
  return data;
}, { watch: [profile, dateRange, selectedRegional] });

const { data: desempenhoConsultores } = await useAsyncData('desempenho-consultores-master', async () => {
  if (!selectedPeriod.value) return [];
  const firstDayOfMonth = `${selectedPeriod.value}-01`;
  
  try {
    // Usa a função RPC otimizada ao invés da view
    const { data, error } = await supabase.rpc('get_desempenho_consultores_month', {
      p_periodo: firstDayOfMonth,
      p_regional_id: selectedRegional.value || null
    });
    
    if (error) {
      console.error('❌ [DashboardMaster] Erro ao buscar desempenho consultores:', error);
      if (process.client) {
        toast.add({ title: 'Erro ao buscar desempenho', description: error.message, color: 'red' });
      }
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('❌ [DashboardMaster] Exceção ao buscar desempenho consultores:', err);
    return [];
  }
}, { watch: [selectedPeriod, selectedRegional] });

// --- BUSCA DE CONSULTORES (para ranking de usuários) ---
const { data: consultores } = await useAsyncData('consultores-ranking-master', async () => {
  if (!selectedPeriod.value) return [];
  const firstDayOfMonth = `${selectedPeriod.value}-01`;
  
  try {
    // Usa a função RPC otimizada ao invés da view
    const { data, error } = await supabase.rpc('get_desempenho_consultores_month', {
      p_periodo: firstDayOfMonth,
      p_regional_id: selectedRegional.value || null
    });
    
    if (error) {
      console.error('❌ [DashboardMaster] Erro ao buscar consultores:', error);
      if (process.client) {
        toast.add({ title: 'Erro ao buscar consultores', description: error.message, color: 'red' });
      }
      return [];
    }
    
    return (data || []).map(c => ({
      ...c,
      total_producao: (c.atingido_cnc || 0) + (c.atingido_card || 0) + (c.atingido_card_beneficio || 0) + (c.atingido_consignado || 0) + (c.atingido_fgts || 0)
    }));
  } catch (err) {
    console.error('❌ [DashboardMaster] Exceção ao buscar consultores:', err);
    return [];
  }
}, { watch: [selectedPeriod, selectedRegional] });

// --- NOVA BUSCA DE DADOS PARA METAS ---
const { data: metasProgresso, pending: metasPending } = useAsyncData('metas-progresso-master', async () => {
  // CORREÇÃO: Usa o novo filtro de período 'selectedPeriod'
  if (!selectedPeriod.value) return [];

  const firstDayOfMonth = `${selectedPeriod.value}-01`;

  let query = supabase.from('metas_progresso').select('*').eq('periodo', firstDayOfMonth);

  if (selectedRegional.value) {
    query = query.eq('regional_id', selectedRegional.value);
  }

  const { data, error } = await query;
  if (error) {
    console.error('❌ [DashboardMaster] Erro ao buscar metas:', error);
    if (process.client) {
      toast.add({ title: 'Erro ao buscar metas', description: error.message, color: 'red' });
    }
  }
  return data || [];
}, { watch: [selectedPeriod, selectedRegional] }); // CORREÇÃO: Observa a variável correta

// --- BUSCA SEPARADA DE SEGUROS (VENDAS EXTERNAS) ---
const { data: segurosData } = await useAsyncData('seguros-master', async () => {
  if (!segurosDateFilter.value) return null;

  // Calcular início e fim do mês selecionado
  const selectedDate = new Date(segurosDateFilter.value);
  const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59);
  
  const startStr = startOfMonth.toISOString().split('T')[0];
  const endStr = endOfMonth.toISOString().split('T')[0];

  let query = supabase
    .from('vendas_externas')
    .select('tipo_produto, quantidade, lojas!inner(regional_id)')
    .gte('data_venda', startStr)
    .lte('data_venda', endStr);

  if (selectedRegional.value) {
    query = query.eq('lojas.regional_id', selectedRegional.value);
  }

  const { data, error } = await query;
  if (error) {
    console.error('❌ [DashboardMaster] Erro ao buscar seguros:', error);
    if (process.client) {
      toast.add({ title: 'Erro ao buscar seguros', description: error.message, color: 'red' });
    }
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
}, { watch: [segurosDateFilter, selectedRegional] });

const segurosStats = computed(() => segurosData.value || { bmgMed: 0, seguroFamiliar: 0 });

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

// --- NOVAS COLUNAS E LÓGICA PARA A TABELA DE METAS ---
const metasColumns = [
  { key: 'loja_nome', label: 'Loja' },
  { key: 'percentual_multi_volume', label: '% Multi Volume' },
  { key: 'meta_bmg_med', label: 'BMG MED' },
  { key: 'meta_seguro_familiar', label: 'Seguro Familiar' },
];

const rankedStores = computed(() => {
  if (!metasProgresso.value || metasProgresso.value.length === 0) return [];
  return metasProgresso.value
    .slice()
    .sort((a, b) => b.percentual_multi_volume - a.percentual_multi_volume)
    .map((store, index) => ({ ...store, rank: index + 1 }));
});

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

// Função para limpar todos os filtros do dashboard
const clearFilters = () => {
  dateRange.start = '';
  dateRange.end = '';
  selectedPeriod.value = new Date().toISOString().slice(0, 7);
  selectedRegional.value = null;
  segurosDateFilter.value = new Date().toISOString().split('T')[0];
};
</script>