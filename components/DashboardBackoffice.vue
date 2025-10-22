<template>
  <div class="space-y-8">
    <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    </header>

    <!-- Tela de Carregamento -->
    <div v-if="pending" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <UCard v-for="i in 4" :key="i" class="animate-pulse">
        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
        <div class="h-12 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      </UCard>
    </div>

    <!-- Cards de Estatísticas -->
    <div v-else-if="dashboardData?.stats" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard icon="i-heroicons-document-chart-bar" title="Contratos Totais" :value="dashboardData.stats.total" />
      <StatsCard icon="i-heroicons-check-circle" title="Contratos Pagos" :value="dashboardData.stats.pagos"
        color="text-green-500" />
      <StatsCard icon="i-heroicons-clock" title="Pendentes/Análise" :value="dashboardData.stats.pendentes"
        color="text-yellow-500" />
      <StatsCard icon="i-heroicons-currency-dollar" title="Valor Total Pago"
        :value="formatCurrency(dashboardData.stats.valorTotal)" color="text-primary-500" />
    </div>

    <!-- Gráficos -->
    <div v-if="!pending && dashboardData" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <ChartCard title="Contratos por Status">
        <template v-if="hasData(dashboardData.statusChart)">
          <ChartsPie :data="dashboardData.statusChart" />
        </template>
        <template v-else>
          <div class="flex items-center justify-center h-full text-gray-500">Nenhum dado para exibir.</div>
        </template>
      </ChartCard>

      <ChartCard title="Top 10 Bancos por Contrato">
        <template v-if="hasData(dashboardData.bancosChart)">
          <ChartsBar :data="dashboardData.bancosChart" />
        </template>
        <template v-else>
          <div class="flex items-center justify-center h-full text-gray-500">Nenhum dado para exibir.</div>
        </template>
      </ChartCard>

      <ChartCard title="Contratos por Produto" class="lg:col-span-2">
        <template v-if="hasData(dashboardData.produtosChart)">
          <ChartsBar :data="dashboardData.produtosChart" />
        </template>
        <template v-else>
          <div class="flex items-center justify-center h-full text-gray-500">Nenhum dado para exibir.</div>
        </template>
      </ChartCard>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { sub, format, startOfMonth, endOfMonth } from 'date-fns';
import { useGoalCalculations } from '~/composables/useGoalCalculations';

// Removido o definePageMeta, pois este é um componente, não uma página.
// A proteção da rota é feita na página que o utiliza (index.vue) ou no layout.

const supabase = useSupabaseClient();
const { formatCurrency } = useGoalCalculations();

// --- ESTADO DO FILTRO DE DATA ---
const dateRange = ref({
  start: startOfMonth(new Date()),
  end: endOfMonth(new Date())
});

// --- BUSCA DE DADOS DO DASHBOARD ---
const { data: dashboardData, pending, refresh } = await useAsyncData(
  'dashboard-backoffice',
  async () => {
    const { data, error } = await supabase.rpc('get_dashboard_data_backoffice', {
      p_start_date: format(dateRange.value.start, 'yyyy-MM-dd'),
      p_end_date: format(dateRange.value.end, 'yyyy-MM-dd'),
    });
    if (error) {
      console.error('Erro ao buscar dados do dashboard de backoffice:', error);
      return null;
    }
    return data;
  },
  { watch: [dateRange] } // Re-executa a busca quando o `dateRange` mudar
);

// --- FUNÇÕES AUXILIARES ---
const hasData = (chartData) => {
  return chartData && Object.keys(chartData).length > 0 && Object.values(chartData).some(v => v > 0);
};
</script>