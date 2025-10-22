<template>
  <div class="space-y-8">
    <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <!-- Cabeçalho do dashboard (pode conter filtros no futuro) -->
    </header>

    <div v-if="pending" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <UCard v-for="i in 4" :key="i" class="animate-pulse">
        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
        <div class="h-12 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      </UCard>
    </div>

    <div v-else-if="dashboardData?.stats" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-document-chart-bar" class="text-xl text-primary-500" />
            <h3 class="font-semibold">Contratos Totais</h3>
          </div>
        </template>
        <p class="text-2xl font-bold text-center">{{ dashboardData.stats.total }}</p>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-check-circle" class="text-xl text-green-500" />
            <h3 class="font-semibold">Contratos Pagos</h3>
          </div>
        </template>
        <p class="text-2xl font-bold text-center text-green-500">{{ dashboardData.stats.pagos }}</p>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-clock" class="text-xl text-amber-500" />
            <h3 class="font-semibold">Pendentes/Análise</h3>
          </div>
        </template>
        <p class="text-2xl font-bold text-center text-amber-500">{{ dashboardData.stats.pendentes }}</p>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-currency-dollar" class="text-xl text-primary-500" />
            <h3 class="font-semibold">Valor Total Pago</h3>
          </div>
        </template>
        <p class="text-2xl font-bold text-center text-primary-500">{{ formatCurrency(dashboardData.stats.valorTotal) }}</p>
      </UCard>
    </div>

    <div v-if="!pending && dashboardData" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <UCard>
        <template #header><h3 class="font-semibold">Contratos por Status</h3></template>
        <div v-if="hasData(dashboardData.statusChart)" class="h-80">
          <Doughnut :data="chartData.status" :options="chartOptions" />
        </div>
        <p v-else class="text-center text-gray-500">Nenhum dado para exibir.</p>
      </UCard>

      <UCard>
        <template #header><h3 class="font-semibold">Top 10 Bancos por Contrato</h3></template>
        <div v-if="hasData(dashboardData.bancosChart)" class="h-80">
          <Bar :data="chartData.lojas" :options="chartOptions" />
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
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { useGoalCalculations } from '~/composables/useGoalCalculations'

// Declarações para satisfazer o verificador TypeScript/linters locais
declare const useSupabaseClient: any
declare function useAsyncData<T = any>(key: string, fetcher: (...args: any[]) => Promise<T>, opts?: any): any

// vue-chartjs imports
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Bar, Doughnut } from 'vue-chartjs'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const supabase = useSupabaseClient()
const { formatCurrency } = useGoalCalculations()

const dateRange = ref({
  start: startOfMonth(new Date()),
  end: endOfMonth(new Date())
})

const { data: dashboardData, pending, refresh } = await useAsyncData(
  'dashboard-backoffice',
  async () => {
    const { data, error } = await supabase.rpc('get_dashboard_data_backoffice', {
      p_start_date: format(dateRange.value.start, 'yyyy-MM-dd'),
      p_end_date: format(dateRange.value.end, 'yyyy-MM-dd')
    })
    if (error) {
      console.error('Erro ao buscar dados do dashboard de backoffice:', error)
      return null
    }
    return data
  },
  { watch: [dateRange] }
)

const hasData = (d: any) => Array.isArray(d?.labels) && d.labels.length > 0

const chartData = computed(() => {
  const d = dashboardData?.value || {}
  return {
    status: {
      labels: d.statusChart?.labels || [],
      datasets: [{ data: d.statusChart?.data || [], backgroundColor: ['#34D399', '#FBBF24', '#60A5FA', '#F87171'] }]
    },
    lojas: {
      labels: d.bancosChart?.labels || [],
      datasets: [{ label: 'Contratos', data: d.bancosChart?.data || [], backgroundColor: '#60A5FA' }]
    },
    produtos: {
      labels: d.produtosChart?.labels || [],
      datasets: [{ label: 'Contratos', data: d.produtosChart?.data || [], backgroundColor: '#818CF8' }]
    }
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'top' as const } }
}))
</script>