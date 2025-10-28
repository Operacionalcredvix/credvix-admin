<template>
  <div class="p-6 space-y-6">
    <!-- Cabeçalho -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Auditoria de Falhas de Login
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          Análise detalhada de tentativas de login falhas e padrões de segurança
        </p>
      </div>
      <div class="flex gap-2">
        <UButton
          icon="i-heroicons-arrow-path"
          :loading="carregando"
          @click="carregarDados"
        >
          Atualizar
        </UButton>
        <UButton
          icon="i-heroicons-arrow-down-tray"
          color="gray"
          @click="exportarRelatorio"
          :loading="exportando"
        >
          Exportar
        </UButton>
      </div>
    </div>

    <!-- Filtros -->
    <UCard>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <UFormGroup label="Período">
          <USelectMenu
            v-model="filtros.periodo"
            :options="periodos"
            @change="carregarDados"
          />
        </UFormGroup>

        <UFormGroup label="Email (opcional)">
          <UInput
            v-model="filtros.email"
            placeholder="email@exemplo.com"
            @keyup.enter="buscarTentativas"
          />
        </UFormGroup>

        <UFormGroup label="IP (opcional)">
          <UInput
            v-model="filtros.ip"
            placeholder="192.168.0.1"
            @keyup.enter="buscarTentativas"
          />
        </UFormGroup>

        <UFormGroup label="Status">
          <USelectMenu
            v-model="filtros.status"
            :options="statusOptions"
            @change="buscarTentativas"
          />
        </UFormGroup>
      </div>

      <div class="flex gap-2 mt-4">
        <UButton @click="buscarTentativas" :loading="buscando">
          Buscar
        </UButton>
        <UButton color="gray" @click="limparFiltros">
          Limpar Filtros
        </UButton>
      </div>
    </UCard>

    <!-- Estatísticas Gerais (Cards) -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        title="Total de Tentativas"
        :value="estatisticas.total_tentativas"
        icon="i-heroicons-cursor-arrow-rays"
        color="blue"
      />
      <StatsCard
        title="Tentativas com Sucesso"
        :value="estatisticas.tentativas_sucesso"
        :subtitle="`${estatisticas.taxa_sucesso}%`"
        icon="i-heroicons-check-circle"
        color="green"
      />
      <StatsCard
        title="Tentativas Falhas"
        :value="estatisticas.tentativas_falhas"
        :subtitle="`${estatisticas.taxa_falhas}%`"
        icon="i-heroicons-x-circle"
        color="red"
      />
      <StatsCard
        title="Usuários Bloqueados"
        :value="estatisticas.usuarios_bloqueados"
        icon="i-heroicons-shield-exclamation"
        color="orange"
      />
    </div>

    <!-- Gráficos -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Histórico de Tentativas -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Histórico de Tentativas</h3>
            <USelectMenu
              v-model="tipoGrafico"
              :options="tiposGrafico"
              size="xs"
              @change="carregarHistorico"
            />
          </div>
        </template>

        <div class="h-64">
          <canvas ref="chartHistorico"></canvas>
        </div>
      </UCard>

      <!-- Distribuição por Horário -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Distribuição por Horário</h3>
        </template>

        <div class="h-64">
          <canvas ref="chartHorario"></canvas>
        </div>
      </UCard>
    </div>

    <!-- Top Emails e IPs com Falhas -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Top Emails -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Top Emails com Falhas (7 dias)</h3>
        </template>

        <div class="space-y-2">
          <div
            v-for="item in topEmails"
            :key="item.email"
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <div class="flex-1">
              <p class="font-medium text-sm">{{ item.email }}</p>
              <p class="text-xs text-gray-500">
                {{ item.total_falhas }} falhas · {{ item.ips_diferentes }} IPs diferentes
              </p>
            </div>
            <UBadge
              :color="getBadgeColor(item.nivel_risco)"
              variant="soft"
            >
              {{ item.nivel_risco }}
            </UBadge>
          </div>

          <div v-if="topEmails.length === 0" class="text-center py-8 text-gray-500">
            Nenhuma falha registrada no período
          </div>
        </div>
      </UCard>

      <!-- Top IPs -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Top IPs com Falhas (7 dias)</h3>
        </template>

        <div class="space-y-2">
          <div
            v-for="item in topIps"
            :key="item.ip_address"
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <div class="flex-1">
              <p class="font-medium text-sm">{{ item.ip_address }}</p>
              <p class="text-xs text-gray-500">
                {{ item.total_falhas }} falhas · {{ item.emails_diferentes }} emails diferentes
              </p>
            </div>
            <UBadge
              :color="getBadgeColor(item.nivel_risco)"
              variant="soft"
            >
              {{ item.nivel_risco }}
            </UBadge>
          </div>

          <div v-if="topIps.length === 0" class="text-center py-8 text-gray-500">
            Nenhuma falha registrada no período
          </div>
        </div>
      </UCard>
    </div>

    <!-- Tentativas Bloqueadas Atualmente -->
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Tentativas Bloqueadas Atualmente</h3>
      </template>

      <UTable
        :rows="tentativasBloqueadas"
        :columns="colunasBloqueadas"
        :loading="carregando"
        :empty-state="{
          icon: 'i-heroicons-shield-check',
          label: 'Nenhum bloqueio ativo'
        }"
      >
        <template #esta_bloqueado-data="{ row }">
          <UBadge :color="row.esta_bloqueado ? 'red' : 'gray'">
            {{ row.esta_bloqueado ? 'Bloqueado' : 'Liberado' }}
          </UBadge>
        </template>

        <template #segundos_restantes_bloqueio-data="{ row }">
          <span v-if="row.esta_bloqueado">
            {{ formatarTempo(row.segundos_restantes_bloqueio) }}
          </span>
          <span v-else class="text-gray-400">-</span>
        </template>

        <template #actions-data="{ row }">
          <UButton
            v-if="row.esta_bloqueado"
            size="xs"
            color="red"
            variant="ghost"
            icon="i-heroicons-lock-open"
            @click="desbloquear(row)"
          >
            Desbloquear
          </UButton>
        </template>
      </UTable>
    </UCard>

    <!-- Tabela de Tentativas Recentes -->
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Tentativas Recentes</h3>
      </template>

      <UTable
        :rows="tentativasRecentes"
        :columns="colunasTentativas"
        :loading="buscando"
        :empty-state="{
          icon: 'i-heroicons-magnifying-glass',
          label: 'Nenhuma tentativa encontrada'
        }"
      >
        <template #sucesso-data="{ row }">
          <UBadge :color="row.sucesso ? 'green' : 'red'">
            {{ row.sucesso ? 'Sucesso' : 'Falha' }}
          </UBadge>
        </template>

        <template #tentativa_em-data="{ row }">
          {{ formatarData(row.tentativa_em) }}
        </template>
      </UTable>

      <!-- Paginação -->
      <div class="flex justify-between items-center mt-4" v-if="tentativasRecentes.length > 0">
        <p class="text-sm text-gray-500">
          Mostrando {{ (paginacao.pagina - 1) * paginacao.limite + 1 }} - 
          {{ Math.min(paginacao.pagina * paginacao.limite, paginacao.total) }} 
          de {{ paginacao.total }} registros
        </p>
        <div class="flex gap-2">
          <UButton
            size="sm"
            :disabled="paginacao.pagina === 1"
            @click="mudarPagina(paginacao.pagina - 1)"
          >
            Anterior
          </UButton>
          <UButton
            size="sm"
            :disabled="paginacao.pagina * paginacao.limite >= paginacao.total"
            @click="mudarPagina(paginacao.pagina + 1)"
          >
            Próxima
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

definePageMeta({
  layout: 'default',
  middleware: 'auth'
})

// Refs
const carregando = ref(false)
const buscando = ref(false)
const exportando = ref(false)

// Filtros
const periodos = [
  { label: 'Últimos 7 dias', value: 7 },
  { label: 'Últimos 15 dias', value: 15 },
  { label: 'Últimos 30 dias', value: 30 },
  { label: 'Últimos 60 dias', value: 60 },
  { label: 'Últimos 90 dias', value: 90 }
]

const statusOptions = [
  { label: 'Todos', value: null },
  { label: 'Sucesso', value: true },
  { label: 'Falha', value: false }
]

const tiposGrafico = [
  { label: 'Por Dia', value: 'day' },
  { label: 'Por Hora', value: 'hour' }
]

const filtros = ref({
  periodo: 30,
  email: '',
  ip: '',
  status: null
})

const tipoGrafico = ref('day')

// Dados
const estatisticas = ref({
  total_tentativas: 0,
  tentativas_sucesso: 0,
  tentativas_falhas: 0,
  taxa_sucesso: 0,
  taxa_falhas: 0,
  emails_unicos: 0,
  ips_unicos: 0,
  usuarios_bloqueados: 0,
  pico_horario: 0,
  tentativas_pico: 0
})

const topEmails = ref([])
const topIps = ref([])
const tentativasBloqueadas = ref([])
const tentativasRecentes = ref([])
const historicoData = ref([])
const distribuicaoHorario = ref([])

const paginacao = ref({
  pagina: 1,
  limite: 50,
  total: 0
})

// Charts
const chartHistorico = ref(null)
const chartHorario = ref(null)
let chartHistoricoInstance = null
let chartHorarioInstance = null

// Colunas das tabelas
const colunasBloqueadas = [
  { key: 'email', label: 'Email' },
  { key: 'ip_address', label: 'IP' },
  { key: 'tentativas_falhas', label: 'Tentativas' },
  { key: 'esta_bloqueado', label: 'Status' },
  { key: 'segundos_restantes_bloqueio', label: 'Tempo Restante' },
  { key: 'actions', label: 'Ações' }
]

const colunasTentativas = [
  { key: 'email', label: 'Email' },
  { key: 'ip_address', label: 'IP' },
  { key: 'sucesso', label: 'Status' },
  { key: 'tentativa_em', label: 'Data/Hora' },
  { key: 'user_agent', label: 'User Agent' }
]

// Supabase
const supabase = useSupabaseClient()
const toast = useAppToast()

// Lifecycle
onMounted(() => {
  carregarDados()
})

// Métodos
async function carregarDados() {
  carregando.value = true
  try {
    await Promise.all([
      carregarEstatisticas(),
      carregarTopEmails(),
      carregarTopIps(),
      carregarTentativasBloqueadas(),
      carregarHistorico(),
      carregarDistribuicaoHorario()
    ])
  } catch (error) {
    console.error('Erro ao carregar dados:', error)
    toast.error('Erro ao carregar dados de auditoria')
  } finally {
    carregando.value = false
  }
}

async function carregarEstatisticas() {
  const { data, error } = await supabase.rpc('obter_estatisticas_gerais', {
    p_dias: filtros.value.periodo
  })

  if (error) throw error

  if (data && data.length > 0) {
    estatisticas.value = {
      total_tentativas: data[0].total_tentativas || 0,
      tentativas_sucesso: data[0].tentativas_sucesso || 0,
      tentativas_falhas: data[0].tentativas_falhas || 0,
      taxa_sucesso: data[0].taxa_sucesso || 0,
      taxa_falhas: data[0].taxa_falhas || 0,
      emails_unicos: data[0].emails_unicos || 0,
      ips_unicos: data[0].ips_unicos || 0,
      usuarios_bloqueados: data[0].usuarios_bloqueados || 0,
      pico_horario: data[0].pico_horario || 0,
      tentativas_pico: data[0].tentativas_pico || 0
    }
  }
}

async function carregarTopEmails() {
  const { data, error } = await supabase
    .from('vw_top_emails_falhas')
    .select('*')
    .limit(10)

  if (error) throw error
  topEmails.value = data || []
}

async function carregarTopIps() {
  const { data, error } = await supabase
    .from('vw_top_ips_falhas')
    .select('*')
    .limit(10)

  if (error) throw error
  topIps.value = data || []
}

async function carregarTentativasBloqueadas() {
  const { data, error } = await supabase
    .from('vw_tentativas_bloqueadas')
    .select('*')

  if (error) throw error
  tentativasBloqueadas.value = data || []
}

async function carregarHistorico() {
  const { data, error } = await supabase.rpc('obter_historico_tentativas', {
    p_periodo: tipoGrafico.value,
    p_dias: filtros.value.periodo
  })

  if (error) throw error
  historicoData.value = data || []
  renderizarGraficoHistorico()
}

async function carregarDistribuicaoHorario() {
  const { data, error } = await supabase
    .from('vw_distribuicao_horario_login')
    .select('*')

  if (error) throw error
  distribuicaoHorario.value = data || []
  renderizarGraficoHorario()
}

async function buscarTentativas() {
  buscando.value = true
  try {
    const params = {
      p_email: filtros.value.email || null,
      p_ip_address: filtros.value.ip || null,
      p_sucesso: filtros.value.status,
      p_limit: paginacao.value.limite,
      p_offset: (paginacao.value.pagina - 1) * paginacao.value.limite
    }

    const { data, error } = await supabase.rpc('buscar_tentativas_login', params)

    if (error) throw error
    tentativasRecentes.value = data || []
  } catch (error) {
    console.error('Erro ao buscar tentativas:', error)
    toast.error('Erro ao buscar tentativas')
  } finally {
    buscando.value = false
  }
}

function limparFiltros() {
  filtros.value = {
    periodo: 30,
    email: '',
    ip: '',
    status: null
  }
  paginacao.value.pagina = 1
  carregarDados()
}

function mudarPagina(novaPagina: number) {
  paginacao.value.pagina = novaPagina
  buscarTentativas()
}

async function desbloquear(row: any) {
  const { error } = await supabase.rpc('desbloquear_ip_ou_email', {
    p_email: row.email,
    p_ip_address: null
  })

  if (error) {
    toast.error('Erro ao desbloquear usuário')
    return
  }

  toast.success('Usuário desbloqueado com sucesso')
  carregarTentativasBloqueadas()
}

async function exportarRelatorio() {
  exportando.value = true
  try {
    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - filtros.value.periodo)

    const { data, error } = await supabase.rpc('exportar_relatorio_auditoria', {
      p_data_inicio: dataInicio.toISOString(),
      p_data_fim: new Date().toISOString()
    })

    if (error) throw error

    // Download do JSON
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `auditoria-falhas-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success('Relatório exportado com sucesso')
  } catch (error) {
    console.error('Erro ao exportar:', error)
    toast.error('Erro ao exportar relatório')
  } finally {
    exportando.value = false
  }
}

function renderizarGraficoHistorico() {
  if (!chartHistorico.value) return

  const ctx = chartHistorico.value.getContext('2d')

  if (chartHistoricoInstance) {
    chartHistoricoInstance.destroy()
  }

  const labels = historicoData.value.map(item => 
    new Date(item.periodo).toLocaleDateString('pt-BR')
  ).reverse()

  chartHistoricoInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Total',
          data: historicoData.value.map(item => item.total_tentativas).reverse(),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3
        },
        {
          label: 'Sucessos',
          data: historicoData.value.map(item => item.sucessos).reverse(),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.3
        },
        {
          label: 'Falhas',
          data: historicoData.value.map(item => item.falhas).reverse(),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  })
}

function renderizarGraficoHorario() {
  if (!chartHorario.value) return

  const ctx = chartHorario.value.getContext('2d')

  if (chartHorarioInstance) {
    chartHorarioInstance.destroy()
  }

  const labels = distribuicaoHorario.value.map(item => `${item.hora}h`)

  chartHorarioInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Sucessos',
          data: distribuicaoHorario.value.map(item => item.sucessos),
          backgroundColor: 'rgba(34, 197, 94, 0.7)',
        },
        {
          label: 'Falhas',
          data: distribuicaoHorario.value.map(item => item.falhas),
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      },
      scales: {
        x: {
          stacked: true
        },
        y: {
          stacked: true,
          beginAtZero: true
        }
      }
    }
  })
}

function getBadgeColor(nivel: string) {
  switch (nivel) {
    case 'Crítico':
      return 'red'
    case 'Alto':
      return 'orange'
    case 'Médio':
      return 'yellow'
    default:
      return 'gray'
  }
}

function formatarTempo(segundos: number) {
  const minutos = Math.floor(segundos / 60)
  const segs = segundos % 60
  return `${minutos}m ${segs}s`
}

function formatarData(data: string) {
  return new Date(data).toLocaleString('pt-BR')
}

onUnmounted(() => {
  if (chartHistoricoInstance) {
    chartHistoricoInstance.destroy()
  }
  if (chartHorarioInstance) {
    chartHorarioInstance.destroy()
  }
})
</script>
