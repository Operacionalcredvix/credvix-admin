<template>
  <div class="space-y-8">
    <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <!-- Filtros -->
      <div class="flex items-center gap-2">
        <USelectMenu v-model="selectedBanco" :options="bancosList" value-attribute="id"
          option-attribute="nome_instituicao" placeholder="Filtrar por Banco" clearable searchable class="w-48" />
        <UPopover :popper="{ placement: 'bottom-end' }">
          <UButton icon="i-heroicons-calendar-days-20-solid"
            :label="`${format(dateRange.start, 'dd/MM/yy')} - ${format(dateRange.end, 'dd/MM/yy')}`" />
          <template #panel="{ close }">
            <DatePicker @close="close" v-model="dateRange" />
          </template>
        </UPopover>
      </div>
    </header>

    <div v-if="pending" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <UCard v-for="i in 4" :key="i" class="animate-pulse">
        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
        <div class="h-12 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      </UCard>
    </div>

    <div v-else-if="dashboardData?.stats" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Contratos Totais"
        :value="dashboardData.stats.total || 0"
        icon="i-heroicons-document-chart-bar"
        color-class="text-primary-500" />
      <StatsCard
        title="Contratos Pagos"
        :value="dashboardData.stats.pagos || 0"
        icon="i-heroicons-check-circle"
        color-class="text-green-500" />
      <StatsCard
        title="Pendentes/Análise"
        :value="dashboardData.stats.pendentes || 0"
        icon="i-heroicons-clock"
        color-class="text-amber-500" />
      <StatsCard
        title="Valor Total Pago"
        :value="formatCurrency(dashboardData.stats.valorTotal || 0)"
        icon="i-heroicons-currency-dollar"
        color-class="text-primary-500" />
    </div>

    <div v-if="!pending && dashboardData" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- NOVO: Gráfico de Linha para Evolução Diária -->
      <UCard class="lg:col-span-2">
        <template #header><h3 class="font-semibold">Evolução Diária de Contratos Pagos</h3></template>
        <div v-if="hasData(dashboardData.dailyPaidChart)" class="h-80">
          <Line :data="chartData.dailyPaid" :options="chartOptions" />
        </div>
        <p v-else class="text-center text-gray-500">Nenhum dado para exibir.</p>
      </UCard>

      <UCard>
        <template #header><h3 class="font-semibold">Contratos por Status</h3></template>
        <div v-if="hasData(dashboardData.statusChart)" class="h-80">
          <Doughnut :data="chartData.status" :options="pieChartOptions" />
        </div>
        <p v-else class="text-center text-gray-500">Nenhum dado para exibir.</p>
      </UCard>

      <UCard>
        <template #header><h3 class="font-semibold">Top 10 Bancos por Contrato</h3></template>
        <div v-if="hasData(dashboardData.bancosChart)" class="h-80">
          <Bar :data="chartData.bancos" :options="chartOptions" />
        </div>
        <p v-else class="text-center text-gray-500">Nenhum dado para exibir.</p>
      </UCard>

      <UCard class="lg:col-span-2">
        <template #header><h3 class="font-semibold">Contratos por Produto</h3></template>
        <div v-if="hasData(dashboardData.produtosChart)" class="h-80">
          <Bar :data="chartData.produtos" :options="chartOptions" />
        </div>
        <p v-else class="text-center text-gray-500">Nenhum dado para exibir.</p>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { format, startOfMonth, endOfMonth } from 'date-fns';
// import DatePicker from '~/components/DatePicker.vue';

// Declarações para satisfazer o verificador TypeScript/linters locais
declare const useSupabaseClient: any
declare function useAsyncData<T = any>(key: string, fetcher: (...args: any[]) => Promise<T>, opts?: any): any

// vue-chartjs imports
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler } from 'chart.js'
import { Bar, Doughnut, Line } from 'vue-chartjs'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler)

const supabase = useSupabaseClient()

// Função utilitária para formatar moeda
function formatCurrency(value: number | string) {
  const number = typeof value === 'number' ? value : Number(value)
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const dateRange = ref({
  start: startOfMonth(new Date()),
  end: endOfMonth(new Date())
})

const selectedBanco = ref<number | null>(null)

// --- BUSCA DE DADOS PARA FILTROS ---
const { data: bancosList } = useAsyncData('bancos-list-backoffice', async () => {
  const { data, error } = await useSupabaseClient().from('bancos').select('id, nome_instituicao').order('nome_instituicao')
  if (error) console.error('Erro ao buscar bancos:', error)
  return data || []
})


const { data: dashboardData, pending, refresh } = await useAsyncData(
  'dashboard-backoffice',
  async () => {
    const { data, error } = await supabase.rpc('get_dashboard_data_backoffice', {
      p_start_date: format(dateRange.value.start, 'yyyy-MM-dd'),
      p_end_date: format(dateRange.value.end, 'yyyy-MM-dd'),
      p_banco_id: selectedBanco.value // Passa o banco selecionado
    })
    if (error) {
      console.error('Erro ao buscar dados do dashboard de backoffice:', error)
      // CORREÇÃO: Retorna um objeto com a estrutura padrão em caso de erro
      return {
        stats: {},
        statusChart: {},
        bancosChart: {},
        produtosChart: {},
        dailyPaidChart: {}
      }
    }
    return data
  },
  { watch: [dateRange, selectedBanco] } // Re-executa a busca quando o banco mudar
)

const hasData = (d: any) => d && Object.keys(d).length > 0;

const chartData = computed(() => {
  const d = dashboardData?.value || {}
  return {
    status: {
      labels: Object.keys(d.statusChart || {}),
      datasets: [{
        data: Object.values(d.statusChart || {}).map(v => typeof v === 'number' ? v : Number(v)) as number[],
        backgroundColor: ['#34D399', '#FBBF24', '#60A5FA', '#F87171', '#EF4444']
      }]
    },
    bancos: {
      labels: Object.keys(d.bancosChart || {}),
      datasets: [{
        label: 'Contratos',
        data: Object.values(d.bancosChart || {}).map(v => typeof v === 'number' ? v : Number(v)),
        backgroundColor: '#60A5FA'
      }]
    },
    produtos: {
      labels: Object.keys(d.produtosChart || {}),
      datasets: [{
        label: 'Contratos',
        data: Object.values(d.produtosChart || {}).map(v => typeof v === 'number' ? v : Number(v)),
        backgroundColor: '#818CF8'
      }]
    },
    dailyPaid: {
      labels: Object.keys(d.dailyPaidChart || {}).map(date => format(new Date(date), 'dd/MM')),
      datasets: [{
        label: 'Contratos Pagos',
        data: Object.values(d.dailyPaidChart || {}).map(v => typeof v === 'number' ? v : Number(v)),
        borderColor: '#34D399',
        backgroundColor: '#34D39933', // Cor com transparência
        fill: true,
        tension: 0.3
      }]
    }
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } }
}))

const pieChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'top' as const, align: 'start' as const } }
}))
</script>