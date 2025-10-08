<template>
  <div>
    <header class="mb-8">
      <h1 class="text-primary-500 text-3xl font-bold">Dashboard de Produção</h1>
      <p class="mt-1 text-gray-500">
        Olá, {{ profile?.nome_completo }}! Aqui está um resumo da atividade.
      </p>
    </header>

    <!-- Seção de Desempenho Individual para Consultor -->
    <div v-if="meuDesempenho?.consultor_id && profile?.perfis?.nome === 'Consultor'" class="mb-8">
      <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Meu Desempenho - {{ new Date(meuDesempenho.periodo).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }) }}</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <!-- CNC -->
        <UCard>
          <div class="flex justify-between items-start">
            <h3 class="text-sm font-medium text-gray-500">CNC</h3>
            <span class="font-bold text-sm" :class="getPercentageColor(calculatePercentage(meuDesempenho.atingido_cnc, meuDesempenho.meta_individual_cnc))">{{ calculatePercentage(meuDesempenho.atingido_cnc, meuDesempenho.meta_individual_cnc).toFixed(1) }}%</span>
          </div>
          <p class="text-xl font-bold mt-1">{{ formatCurrency(meuDesempenho.atingido_cnc) }}</p>
          <p class="text-xs text-gray-400">Meta: {{ formatCurrency(meuDesempenho.meta_individual_cnc) }}</p>
          <UProgress :value="calculatePercentage(meuDesempenho.atingido_cnc, meuDesempenho.meta_individual_cnc)" class="mt-2" />
        </UCard>
        <!-- CARD -->
        <UCard>
          <div class="flex justify-between items-start">
            <h3 class="text-sm font-medium text-gray-500">CARD</h3>
            <span class="font-bold text-sm" :class="getPercentageColor(calculatePercentage(meuDesempenho.atingido_card, meuDesempenho.meta_individual_card))">{{ calculatePercentage(meuDesempenho.atingido_card, meuDesempenho.meta_individual_card).toFixed(1) }}%</span>
          </div>
          <p class="text-xl font-bold mt-1">{{ formatCurrency(meuDesempenho.atingido_card) }}</p>
          <p class="text-xs text-gray-400">Meta: {{ formatCurrency(meuDesempenho.meta_individual_card) }}</p>
          <UProgress :value="calculatePercentage(meuDesempenho.atingido_card, meuDesempenho.meta_individual_card)" class="mt-2" />
        </UCard>
        <!-- CARD Benef. -->
        <UCard>
          <div class="flex justify-between items-start">
            <h3 class="text-sm font-medium text-gray-500">CARD Benef.</h3>
            <span class="font-bold text-sm" :class="getPercentageColor(calculatePercentage(meuDesempenho.atingido_card_beneficio, meuDesempenho.meta_individual_card_beneficio))">{{ calculatePercentage(meuDesempenho.atingido_card_beneficio, meuDesempenho.meta_individual_card_beneficio).toFixed(1) }}%</span>
          </div>
          <p class="text-xl font-bold mt-1">{{ formatCurrency(meuDesempenho.atingido_card_beneficio) }}</p>
          <p class="text-xs text-gray-400">Meta: {{ formatCurrency(meuDesempenho.meta_individual_card_beneficio) }}</p>
          <UProgress :value="calculatePercentage(meuDesempenho.atingido_card_beneficio, meuDesempenho.meta_individual_card_beneficio)" class="mt-2" />
        </UCard>
        <!-- Consignado -->
        <UCard>
          <div class="flex justify-between items-start">
            <h3 class="text-sm font-medium text-gray-500">Consignado</h3>
            <span class="font-bold text-sm" :class="getPercentageColor(calculatePercentage(meuDesempenho.atingido_consignado, meuDesempenho.meta_individual_consignado))">{{ calculatePercentage(meuDesempenho.atingido_consignado, meuDesempenho.meta_individual_consignado).toFixed(1) }}%</span>
          </div>
          <p class="text-xl font-bold mt-1">{{ formatCurrency(meuDesempenho.atingido_consignado) }}</p>
          <p class="text-xs text-gray-400">Meta: {{ formatCurrency(meuDesempenho.meta_individual_consignado) }}</p>
          <UProgress :value="calculatePercentage(meuDesempenho.atingido_consignado, meuDesempenho.meta_individual_consignado)" class="mt-2" />
        </UCard>
        <!-- FGTS -->
        <UCard>
          <div class="flex justify-between items-start">
            <h3 class="text-sm font-medium text-gray-500">FGTS</h3>
            <span class="font-bold text-sm" :class="getPercentageColor(calculatePercentage(meuDesempenho.atingido_fgts, meuDesempenho.meta_individual_fgts))">{{ calculatePercentage(meuDesempenho.atingido_fgts, meuDesempenho.meta_individual_fgts).toFixed(1) }}%</span>
          </div>
          <p class="text-xl font-bold mt-1">{{ formatCurrency(meuDesempenho.atingido_fgts) }}</p>
          <p class="text-xs text-gray-400">Meta: {{ formatCurrency(meuDesempenho.meta_individual_fgts) }}</p>
          <UProgress :value="calculatePercentage(meuDesempenho.atingido_fgts, meuDesempenho.meta_individual_fgts)" class="mt-2" />
        </UCard>
        <!-- BMG MED -->
        <UCard>
          <div class="flex justify-between items-start">
            <h3 class="text-sm font-medium text-gray-500">BMG MED</h3>
            <span class="font-bold text-sm" :class="getPercentageColor(calculatePercentage(meuDesempenho.atingido_bmg_med, meuDesempenho.meta_individual_bmg_med))">{{ calculatePercentage(meuDesempenho.atingido_bmg_med, meuDesempenho.meta_individual_bmg_med).toFixed(1) }}%</span>
          </div>
          <p class="text-xl font-bold mt-1">{{ meuDesempenho.atingido_bmg_med }}</p>
          <p class="text-xs text-gray-400">Meta: {{ meuDesempenho.meta_individual_bmg_med }}</p>
          <UProgress :value="calculatePercentage(meuDesempenho.atingido_bmg_med, meuDesempenho.meta_individual_bmg_med)" class="mt-2" />
        </UCard>
        <!-- Seg. Familiar -->
        <UCard>
          <div class="flex justify-between items-start">
            <h3 class="text-sm font-medium text-gray-500">Seg. Familiar</h3>
            <span class="font-bold text-sm" :class="getPercentageColor(calculatePercentage(meuDesempenho.atingido_seguro_familiar, meuDesempenho.meta_individual_seguro_familiar))">{{ calculatePercentage(meuDesempenho.atingido_seguro_familiar, meuDesempenho.meta_individual_seguro_familiar).toFixed(1) }}%</span>
          </div>
          <p class="text-xl font-bold mt-1">{{ meuDesempenho.atingido_seguro_familiar }}</p>
          <p class="text-xs text-gray-400">Meta: {{ meuDesempenho.meta_individual_seguro_familiar }}</p>
          <UProgress :value="calculatePercentage(meuDesempenho.atingido_seguro_familiar, meuDesempenho.meta_individual_seguro_familiar)" class="mt-2" />
        </UCard>
      </div>
      <UDivider class="my-8" />
    </div>

    <UCard class="mb-8">
      <div class="flex flex-wrap items-center gap-4">
        <UFormGroup label="Período de:" name="startDate" class="flex-grow">
          <UInput type="date" v-model="dateRange.start" />
        </UFormGroup>
        <UFormGroup label="Até:" name="endDate" class="flex-grow">
          <UInput type="date" v-model="dateRange.end" />
        </UFormGroup>
        <UFormGroup v-if="regionais.length > 0" label="Regional" name="regional" class="flex-grow">
          <USelectMenu v-model="selectedRegional" :options="regionais" value-attribute="id"
            option-attribute="nome_regional" placeholder="Todas as Regionais" clearable />
        </UFormGroup>
        <div class="pt-6 flex gap-2">
          <UButton @click="setDateRange('current_month')" label="Mês Atual" color="gray" variant="ghost" />
          <UButton @click="setDateRange('last_30_days')" label="Últimos 30 dias" color="gray" variant="ghost" />
          <UButton @click="exportToPDF" label="Exportar PDF" color="gray" icon="i-heroicons-document-arrow-down" :loading="exporting" />
        </div>
      </div>
    </UCard>

    <div v-if="pending" class="text-center py-10 text-gray-500">
      <UIcon name="i-heroicons-arrow-path" class="text-2xl animate-spin" />
      <p>A carregar dados do dashboard...</p>
    </div>

    <div v-else>
      <!-- NOVOS Cards de Estatísticas Agrupados -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <!-- Card de Contratos -->
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

        <!-- Card de Vendas Externas -->
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

      <!-- Tabela de Desempenho Individual para Gestores -->
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
            <PerformanceCell :atingido="row.atingido_cnc" :meta="row.meta_individual_cnc" type="currency" />
          </template>
          <template #desempenho_card-data="{ row }">
            <PerformanceCell :atingido="row.atingido_card" :meta="row.meta_individual_card" type="currency" />
          </template>
          <template #desempenho_consignado-data="{ row }">
            <PerformanceCell :atingido="row.atingido_consignado" :meta="row.meta_individual_consignado" type="currency" />
          </template>
          <template #desempenho_fgts-data="{ row }">
            <PerformanceCell :atingido="row.atingido_fgts" :meta="row.meta_individual_fgts" type="currency" />
          </template>
        </UTable>
      </UCard>

      <!-- Gráficos -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <UCard>
          <template #header><h3 class="font-semibold">Contratos por Status</h3></template>
          <div v-if="hasData" class="h-80">
            <Doughnut ref="doughnutChartRef" :data="chartData.status" :options="chartOptions" />
          </div>
          <p v-else class="text-center text-gray-500">Sem dados para exibir no período selecionado.</p>
        </UCard>
        
        <UCard class="lg:col-span-2">
          <template #header><h3 class="font-semibold">Top 10 Lojas por Contrato</h3></template>
          <div v-if="hasData" class="h-80">
            <Bar ref="barChartLojasRef" :data="chartData.lojas" :options="chartOptions" />
          </div>
          <p v-else class="text-center text-gray-500">Sem dados para exibir no período selecionado.</p>
        </UCard>
        
        <UCard class="lg:col-span-3">
          <template #header><h3 class="font-semibold">Contratos por Produto</h3></template>
          <div v-if="hasData" class="h-80">
            <Bar ref="barChartProdutosRef" :data="chartData.produtos" :options="chartOptions" />
          </div>
          <p v-else class="text-center text-gray-500">Sem dados para exibir no período selecionado.</p>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onBeforeUnmount } from 'vue';
import { Bar, Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

const supabase = useSupabaseClient();
const { profile } = useProfile();
const toast = useToast();

// --- ESTADO DA EXPORTAÇÃO E REFERÊNCIAS DOS GRÁFICOS ---
const exporting = ref(false);
const doughnutChartRef = ref(null);
const barChartLojasRef = ref(null);
const barChartProdutosRef = ref(null);

// --- ESTADO DOS FILTROS ---
const selectedRegional = ref(null);
const { data: regionais } = await useAsyncData('regionais-filtro', async () => {
  if (!profile.value || !['Master', 'Coordenador'].includes(profile.value.perfis?.nome)) {
    return [];
  }
  let query = supabase.from('regionais').select('id, nome_regional').order('nome_regional');
  if (profile.value.perfis?.nome === 'Coordenador') {
    query = query.eq('coordenador_id', profile.value.id);
  }
  const { data } = await query;
  return data || [];
});

// --- LÓGICA DE DATAS ---
const dateRange = reactive({ start: '', end: '' });

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

// Define o período inicial como o mês atual
setDateRange('current_month');

// --- BUSCA DE DADOS OTIMIZADA COM RPC ---
const { data: dashboardData, pending } = useAsyncData(
  'dashboard-data',
  async () => {
    if (!profile.value?.user_id || !dateRange.start || !dateRange.end) {
      return { stats: {}, statusChart: {}, lojasChart: {}, produtosChart: {} };
    }

    const { data, error } = await supabase.rpc('get_dashboard_data', {
      p_user_id: profile.value.user_id,
      p_start_date: dateRange.start,
      p_end_date: dateRange.end,
      p_regional_id: selectedRegional.value // Passa o ID da regional selecionada
    });

    if (error) {
      console.error('Erro ao buscar dados do dashboard via RPC:', error);
      toast.add({ title: 'Erro ao carregar dados', description: error.message, color: 'red' });
      return { stats: {}, statusChart: {}, lojasChart: {}, produtosChart: {} };
    }
    return data;
  },
  { watch: [profile, dateRange, selectedRegional] }
);

const { data: meuDesempenho, pending: meuDesempenhoPending } = await useAsyncData('meu-desempenho-pessoal', async () => {
  if (profile.value?.perfis?.nome !== 'Consultor' || !profile.value.id) {
    return null;
  }

  // Define o período atual
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  // 1. Busca os valores ATINGIDOS pelo consultor no mês, independentemente de ter meta ou não.
  const [atingidoContratosRes, atingidoVendasExternasRes] = await Promise.all([
    supabase
      .from('contratos')
      .select('valor_total, produtos!inner(categoria_meta)')
      .eq('consultor_id', profile.value.id)
      .eq('status', 'Pago')
      .gte('data_pagamento', firstDayOfMonth)
      .lte('data_pagamento', lastDayOfMonth),
    supabase
      .from('vendas_externas')
      .select('quantidade, tipo_produto')
      .eq('consultor_id', profile.value.id)
      .gte('data_venda', firstDayOfMonth)
      .lte('data_venda', lastDayOfMonth)
  ]);

  // Calcula os totais atingidos
  const atingido = {
    atingido_cnc: atingidoContratosRes.data?.filter(c => c.produtos.categoria_meta === 'CNC').reduce((sum, c) => sum + c.valor_total, 0) || 0,
    atingido_card: atingidoContratosRes.data?.filter(c => c.produtos.categoria_meta === 'CARD').reduce((sum, c) => sum + c.valor_total, 0) || 0,
    atingido_card_beneficio: atingidoContratosRes.data?.filter(c => c.produtos.categoria_meta === 'CARD BENEFÍCIO').reduce((sum, c) => sum + c.valor_total, 0) || 0,
    atingido_consignado: atingidoContratosRes.data?.filter(c => c.produtos.categoria_meta === 'CONSIGNADO').reduce((sum, c) => sum + c.valor_total, 0) || 0,
    atingido_fgts: atingidoContratosRes.data?.filter(c => c.produtos.categoria_meta === 'FGTS').reduce((sum, c) => sum + c.valor_total, 0) || 0,
    atingido_bmg_med: atingidoVendasExternasRes.data?.filter(v => v.tipo_produto === 'bmg_med').reduce((sum, v) => sum + v.quantidade, 0) || 0,
    atingido_seguro_familiar: atingidoVendasExternasRes.data?.filter(v => v.tipo_produto === 'seguro_familiar').reduce((sum, v) => sum + v.quantidade, 0) || 0,
  };

  // 2. Tenta buscar as METAS individuais da view.
  const { data: metas } = await supabase
    .from('desempenho_consultores')
    .select('periodo, meta_individual_cnc, meta_individual_card, meta_individual_card_beneficio, meta_individual_consignado, meta_individual_fgts, meta_individual_bmg_med, meta_individual_seguro_familiar')
    .eq('consultor_id', profile.value.id)
    .eq('periodo', firstDayOfMonth)
    .maybeSingle(); // .maybeSingle() não dá erro se não encontrar nada, retorna null.

  // 3. Combina os resultados. Se não houver metas, os valores de meta serão 0.
  return {
    consultor_id: profile.value.id,
    periodo: metas?.periodo || firstDayOfMonth,
    ...atingido,
    meta_individual_cnc: metas?.meta_individual_cnc || 0,
    meta_individual_card: metas?.meta_individual_card || 0,
    meta_individual_card_beneficio: metas?.meta_individual_card_beneficio || 0,
    meta_individual_consignado: metas?.meta_individual_consignado || 0,
    meta_individual_fgts: metas?.meta_individual_fgts || 0,
    meta_individual_bmg_med: metas?.meta_individual_bmg_med || 0,
    meta_individual_seguro_familiar: metas?.meta_individual_seguro_familiar || 0,
  };
});

// --- BUSCA DE DADOS PARA O RELATÓRIO DE CONSULTORES (PARA GESTORES) ---
const { data: desempenhoConsultores } = await useAsyncData('desempenho-consultores-dashboard', async () => {
  // Só busca os dados se o usuário for um gestor
  if (!profile.value || ['Master', 'Coordenador', 'Supervisor'].includes(profile.value.perfis?.nome) === false) {
    return [];
  }

  let query = supabase
    .from('desempenho_consultores')
    .select('consultor_nome, loja_nome, atingido_cnc, meta_individual_cnc, atingido_card, meta_individual_card, atingido_consignado, meta_individual_consignado, atingido_fgts, meta_individual_fgts')
    .gte('periodo', dateRange.start)
    .lte('periodo', dateRange.end);

  // Filtra por loja se o supervisor estiver a ver
  if (profile.value.perfis?.nome === 'Supervisor') {
    query = query.eq('loja_id', profile.value.loja_id);
  }

  const { data, error } = await query;
  if (error) console.error("Erro ao buscar desempenho dos consultores:", error);
  return data || [];
}, {
  watch: [profile, dateRange]
});

// --- CÁLCULOS PARA AS ESTATÍSTICAS E GRÁFICOS ---
const hasData = computed(() => dashboardData.value && dashboardData.value.stats?.total > 0);

const stats = computed(() => {
  const defaultStats = { total: 0, pagos: 0, pendentes: 0, cancelados: 0, valorTotal: 0, bmgMed: 0, seguroFamiliar: 0 };
  return dashboardData.value?.stats ? { ...defaultStats, ...dashboardData.value.stats } : defaultStats;
});

const chartData = computed(() => {
  const emptyChart = { labels: [], datasets: [] };
  if (!hasData.value || !dashboardData.value) {
    return { status: emptyChart, produtos: emptyChart, lojas: emptyChart };
  }

  const { statusChart, lojasChart, produtosChart } = dashboardData.value;

  // Paleta de cores para os produtos. Se houver mais produtos que cores, elas se repetirão.
  const productColors = [
    '#3b82f6', '#22c55e', '#ef4444', '#eab308', '#8b5cf6',
    '#f97316', '#14b8a6', '#ec4899', '#64748b', '#d946ef'
  ];
  const produtosBackgroundColors = Object.keys(produtosChart).map((_, index) => productColors[index % productColors.length]);

  const statusLabels = Object.keys(statusChart);
  const statusData = Object.values(statusChart);
  const statusBackgroundColors = statusLabels.map(label => {
    if (['Pago', 'Aprovado'].includes(label)) return '#10b981'; // Verde
    if (['Pendente', 'Em Análise'].includes(label)) return '#f59e0b'; // Ambar
    if (['Cancelado', 'Reprovado'].includes(label)) return '#ef4444'; // Vermelho
    return '#6b7280'; // Cinza
  });

  return {
    status: {
      labels: statusLabels,
      datasets: [{ backgroundColor: statusBackgroundColors, data: statusData }]
    },
    lojas: {
      labels: Object.keys(lojasChart),
      datasets: [{ label: 'Quantidade de Contratos', backgroundColor: '#8b5cf6', data: Object.values(lojasChart) }]
    },
    produtos: {
      labels: Object.keys(produtosChart),
      datasets: [{ label: 'Quantidade de Contratos', backgroundColor: produtosBackgroundColors, data: Object.values(produtosChart) }]
    }
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false
};

// --- COLUNAS PARA A NOVA TABELA DE DESEMPENHO ---
const desempenhoColumns = [
  { key: 'consultor_nome', label: 'Consultor' },
  { key: 'desempenho_cnc', label: 'CNC' },
  { key: 'desempenho_card', label: 'CARD' },
  { key: 'desempenho_consignado', label: 'Consignado' },
  { key: 'desempenho_fgts', label: 'FGTS' },
];

const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

// --- NOVAS FUNÇÕES DE APOIO PARA O DESEMPENHO INDIVIDUAL ---
const calculatePercentage = (atingido, meta) => {
  if (!meta || meta === 0) {
    return atingido > 0 ? 100 : 0; // Se não há meta, mas produziu algo, considera 100%
  }
  return (atingido / meta) * 100;
};

const getPercentageColor = (percentage) => {
  if (percentage >= 100) return 'text-green-500';
  if (percentage >= 75) return 'text-yellow-500';
  return 'text-red-500';
};

// --- LÓGICA DE EXPORTAÇÃO PARA PDF ---
const exportToPDF = async () => {
  if (pending.value || !hasData.value) {
    toast.add({ title: 'Nenhum dado para exportar', color: 'amber' });
    return;
  }

  exporting.value = true;
  try {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || 10;

    // 1. Título e Período
    doc.setFontSize(18);
    doc.text('Relatório de Produção', 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Período: ${new Date(dateRange.start).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} a ${new Date(dateRange.end).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}`, 14, 28);

    // 2. Tabela de Estatísticas
    autoTable(doc, {
      startY: 36,
      head: [['Indicador', 'Valor']],
      body: [
        ['Contratos Totais', stats.value.total],
        ['Contratos Pagos', stats.value.pagos],
        ['Contratos Pendentes', stats.value.pendentes],
        ['Contratos Cancelados', stats.value.cancelados],
        ['Valor Total Pago', formatCurrency(stats.value.valorTotal)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] }, // Cor primária
    });

    // 3. Adicionar Gráficos como Imagens
    const addChartToPDF = (chartRef, title, y) => {
      if (chartRef.value?.chart.canvas) {
        const imgData = chartRef.value.chart.canvas.toDataURL('image/png');
        doc.setFontSize(14);
        doc.text(title, 14, y + 15);
        doc.addImage(imgData, 'PNG', 14, y + 20, 180, 90);
      }
    };

    doc.addPage();
    addChartToPDF(doughnutChartRef, 'Contratos por Status', 10);
    addChartToPDF(barChartLojasRef, 'Top 10 Lojas por Contrato', 130);
    doc.addPage();
    addChartToPDF(barChartProdutosRef, 'Contratos por Produto', 10);

    doc.save(`dashboard_producao_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (err) {
    toast.add({ title: 'Erro na Exportação', description: 'Não foi possível gerar o arquivo PDF.', color: 'red' });
    console.error(err);
  } finally {
    exporting.value = false;
  }
};

// --- LIMPEZA DOS GRÁFICOS ---
// Garante que as instâncias dos gráficos sejam destruídas ao sair da página
// para evitar vazamentos de memória e o erro 'dispose'.
onBeforeUnmount(() => {
  if (doughnutChartRef.value?.chart) {
    doughnutChartRef.value.chart.destroy();
  }
  if (barChartLojasRef.value?.chart) {
    barChartLojasRef.value.chart.destroy();
  }
  if (barChartProdutosRef.value?.chart) {
    barChartProdutosRef.value.chart.destroy();
  }
});
</script>