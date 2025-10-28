<template>
  <div class="space-y-8">
    <header>
      <h1 class="text-3xl font-bold mb-2">Auditoria de Logins</h1>
      <p class="text-gray-600 dark:text-gray-400">Histórico completo de acessos ao sistema para monitoramento e segurança</p>
    </header>

    <!-- Filtros -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-funnel" class="text-primary-500" />
            <h3 class="font-semibold">Filtros</h3>
          </div>
          <div class="flex gap-2">
            <UButton 
              @click="limparFiltros" 
              color="gray" 
              variant="outline" 
              icon="i-heroicons-x-mark"
              label="Limpar"
              size="sm"
            />
            <UButton 
              @click="exportarCSV" 
              color="primary" 
              variant="outline" 
              icon="i-heroicons-arrow-down-tray"
              label="Exportar CSV"
              size="sm"
              :loading="exportando"
            />
          </div>
        </div>
      </template>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <UFormGroup label="Funcionário" name="funcionario">
          <USelectMenu 
            v-model="selectedFuncionario" 
            :options="funcionariosList" 
            value-attribute="id"
            option-attribute="nome_completo" 
            placeholder="Todos" 
            clearable 
            searchable 
          />
        </UFormGroup>
        
        <UFormGroup label="Perfil" name="perfil">
          <USelectMenu 
            v-model="selectedPerfil" 
            :options="perfisList" 
            value-attribute="id"
            option-attribute="nome" 
            placeholder="Todos" 
            clearable 
          />
        </UFormGroup>

        <UFormGroup label="Dispositivo" name="dispositivo">
          <USelectMenu 
            v-model="selectedDispositivo" 
            :options="['Desktop', 'Mobile', 'Tablet']" 
            placeholder="Todos" 
            clearable 
          />
        </UFormGroup>

        <UFormGroup label="Navegador" name="navegador">
          <USelectMenu 
            v-model="selectedNavegador" 
            :options="['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera']" 
            placeholder="Todos" 
            clearable 
          />
        </UFormGroup>

        <UFormGroup label="Data Início" name="dataInicio">
          <UInput v-model="dataInicio" type="date" />
        </UFormGroup>

        <UFormGroup label="Data Fim" name="dataFim">
          <UInput v-model="dataFim" type="date" />
        </UFormGroup>

        <UFormGroup label="IP" name="ip">
          <UInput v-model="filtroIP" placeholder="Ex: 192.168.1.1" />
        </UFormGroup>

        <UFormGroup label="Registros por página" name="limit">
          <USelectMenu 
            v-model="pageSize" 
            :options="[10, 25, 50, 100]" 
          />
        </UFormGroup>
      </div>
    </UCard>

    <!-- Estatísticas Rápidas -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard>
        <div class="flex items-center gap-3">
          <div class="p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20">
            <UIcon name="i-heroicons-arrow-right-on-rectangle" class="text-2xl text-primary-500" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Total de Logins</p>
            <p class="text-2xl font-bold">{{ stats.total || 0 }}</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-3">
          <div class="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
            <UIcon name="i-heroicons-user-circle" class="text-2xl text-green-500" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Usuários Únicos</p>
            <p class="text-2xl font-bold">{{ stats.usuarios_unicos || 0 }}</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-3">
          <div class="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <UIcon name="i-heroicons-device-phone-mobile" class="text-2xl text-blue-500" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Acessos Mobile</p>
            <p class="text-2xl font-bold">{{ stats.mobile_percent || 0 }}%</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-3">
          <div class="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <UIcon name="i-heroicons-clock" class="text-2xl text-amber-500" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Sessão Média</p>
            <p class="text-2xl font-bold">{{ stats.duracao_media || '-' }}</p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Tabela de Logins -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">Histórico de Acessos</h3>
          <p class="text-sm text-gray-500">{{ totalRecords }} registro(s) encontrado(s)</p>
        </div>
      </template>

      <UTable 
        :rows="logins" 
        :columns="columns" 
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-magnifying-glass', label: 'Nenhum login encontrado com os filtros selecionados.' }"
      >
        <template #nome_completo-data="{ row }">
          <div>
            <p class="font-medium">{{ row.nome_completo || 'N/A' }}</p>
            <p class="text-xs text-gray-500">{{ row.email || '' }}</p>
          </div>
        </template>

        <template #data_login-data="{ row }">
          <div class="text-sm">
            <p>{{ formatarData(row.data_login) }}</p>
            <p class="text-xs text-gray-500">{{ formatarHora(row.data_login) }}</p>
          </div>
        </template>

        <template #duracao_sessao-data="{ row }">
          <span v-if="row.duracao_sessao" class="text-sm">
            {{ formatarDuracao(row.duracao_sessao) }}
          </span>
          <UBadge v-else label="Ativa" color="green" variant="subtle" size="xs" />
        </template>

        <template #dispositivo-data="{ row }">
          <div class="flex items-center gap-2">
            <UIcon 
              :name="getDispositivoIcon(row.dispositivo)" 
              class="text-gray-500" 
            />
            <div class="text-sm">
              <p>{{ row.dispositivo || 'N/A' }}</p>
              <p class="text-xs text-gray-500">{{ row.navegador || '' }}</p>
            </div>
          </div>
        </template>

        <template #ip_address-data="{ row }">
          <code class="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            {{ row.ip_address || 'N/A' }}
          </code>
        </template>

        <template #perfil_nome-data="{ row }">
          <UBadge :label="row.perfil_nome || 'N/A'" variant="subtle" />
        </template>

        <template #loja_nome-data="{ row }">
          <span class="text-sm">{{ row.loja_nome || '-' }}</span>
        </template>
      </UTable>

      <!-- Paginação -->
      <template #footer>
        <div class="flex justify-between items-center">
          <p class="text-sm text-gray-500">
            Mostrando {{ (currentPage - 1) * pageSize + 1 }} a {{ Math.min(currentPage * pageSize, totalRecords) }} de {{ totalRecords }}
          </p>
          <div class="flex gap-2">
            <UButton 
              icon="i-heroicons-chevron-left" 
              size="sm" 
              color="gray" 
              :disabled="currentPage === 1"
              @click="currentPage--"
            />
            <UButton 
              v-for="page in paginasVisiveis" 
              :key="page"
              :label="page.toString()" 
              size="sm" 
              :color="page === currentPage ? 'primary' : 'gray'"
              :variant="page === currentPage ? 'solid' : 'ghost'"
              @click="currentPage = page"
            />
            <UButton 
              icon="i-heroicons-chevron-right" 
              size="sm" 
              color="gray" 
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            />
          </div>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns'

// Declarações TypeScript
declare const definePageMeta: any
declare const useSupabaseClient: any
declare const useToast: any

definePageMeta({
  middleware: 'auth'
})

const supabase = useSupabaseClient()
const toast = useToast()

// --- ESTADO DOS FILTROS ---
const selectedFuncionario = ref<number | null>(null)
const selectedPerfil = ref<number | null>(null)
const selectedDispositivo = ref<string | null>(null)
const selectedNavegador = ref<string | null>(null)
const dataInicio = ref(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
const dataFim = ref(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
const filtroIP = ref('')
const pageSize = ref(25)
const currentPage = ref(1)

// --- ESTADO DOS DADOS ---
const logins = ref<any[]>([])
const loading = ref(false)
const exportando = ref(false)
const totalRecords = ref(0)
const stats = ref<any>({})

// --- LISTAS PARA FILTROS ---
const funcionariosList = ref<any[]>([])
const perfisList = ref<any[]>([])

// --- COLUNAS DA TABELA ---
const columns = [
  { key: 'nome_completo', label: 'Funcionário' },
  { key: 'perfil_nome', label: 'Perfil' },
  { key: 'data_login', label: 'Data/Hora' },
  { key: 'duracao_sessao', label: 'Duração' },
  { key: 'dispositivo', label: 'Dispositivo' },
  { key: 'ip_address', label: 'IP' },
  { key: 'loja_nome', label: 'Loja' }
]

// --- CARREGA LISTAS PARA FILTROS ---
onMounted(async () => {
  // Carrega funcionários
  const { data: funcs } = await supabase
    .from('funcionarios')
    .select('id, nome_completo')
    .eq('is_active', true)
    .order('nome_completo')
  funcionariosList.value = funcs || []

  // Carrega perfis
  const { data: perfis } = await supabase
    .from('perfis')
    .select('id, nome')
    .order('nome')
  perfisList.value = perfis || []

  // Carrega dados iniciais
  await buscarLogins()
  await buscarEstatisticas()
})

// --- BUSCA DE LOGINS ---
async function buscarLogins() {
  loading.value = true
  try {
    let query = supabase
      .from('vw_logins_recentes')
      .select('*', { count: 'exact' })
      .gte('data_login', dataInicio.value)
      .lte('data_login', dataFim.value + ' 23:59:59')
      .order('data_login', { ascending: false })
      .range((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value - 1)

    if (selectedFuncionario.value) {
      query = query.eq('funcionario_id', selectedFuncionario.value)
    }
    if (selectedPerfil.value) {
      query = query.eq('perfil_nome', perfisList.value.find(p => p.id === selectedPerfil.value)?.nome)
    }
    if (selectedDispositivo.value) {
      query = query.eq('dispositivo', selectedDispositivo.value)
    }
    if (selectedNavegador.value) {
      query = query.eq('navegador', selectedNavegador.value)
    }
    if (filtroIP.value) {
      query = query.ilike('ip_address', `%${filtroIP.value}%`)
    }

    const { data, error, count } = await query

    if (error) throw error

    logins.value = data || []
    totalRecords.value = count || 0
  } catch (error: any) {
    console.error('Erro ao buscar logins:', error)
    toast.add({ title: 'Erro', description: error.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

// --- BUSCA DE ESTATÍSTICAS ---
async function buscarEstatisticas() {
  try {
    // Total de logins
    let query = supabase
      .from('historico_logins')
      .select('id, user_id, dispositivo, duracao_sessao', { count: 'exact' })
      .gte('data_login', dataInicio.value)
      .lte('data_login', dataFim.value + ' 23:59:59')

    const { data, count } = await query
    
    if (data) {
      // Usuários únicos
      const usuariosUnicos = new Set(data.map(l => l.user_id)).size
      
      // Porcentagem mobile
      const mobileCount = data.filter(l => l.dispositivo === 'Mobile').length
      const mobilePercent = count ? Math.round((mobileCount / count) * 100) : 0
      
      // Duração média (apenas sessões finalizadas)
      const sessoesComDuracao = data.filter(l => l.duracao_sessao)
      let duracaoMedia = '-'
      if (sessoesComDuracao.length > 0) {
        // Converter interval para minutos
        const totalMinutos = sessoesComDuracao.reduce((sum, l) => {
          const match = l.duracao_sessao.match(/(\d+):(\d+):(\d+)/)
          if (match) {
            const horas = parseInt(match[1])
            const minutos = parseInt(match[2])
            return sum + (horas * 60) + minutos
          }
          return sum
        }, 0)
        const mediaMinutos = Math.round(totalMinutos / sessoesComDuracao.length)
        const horas = Math.floor(mediaMinutos / 60)
        const minutos = mediaMinutos % 60
        duracaoMedia = horas > 0 ? `${horas}h ${minutos}m` : `${minutos}m`
      }

      stats.value = {
        total: count,
        usuarios_unicos: usuariosUnicos,
        mobile_percent: mobilePercent,
        duracao_media: duracaoMedia
      }
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
  }
}

// --- PAGINAÇÃO ---
const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize.value))
const paginasVisiveis = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const delta = 2
  const range: number[] = []
  const rangeWithDots: (number | string)[] = []

  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i)
  }

  if (current - delta > 2) {
    rangeWithDots.push(1, '...')
  } else {
    rangeWithDots.push(1)
  }

  rangeWithDots.push(...range)

  if (current + delta < total - 1) {
    rangeWithDots.push('...', total)
  } else if (total > 1) {
    rangeWithDots.push(total)
  }

  return rangeWithDots.filter(p => p !== '...') as number[]
})

// --- FUNÇÕES AUXILIARES ---
function limparFiltros() {
  selectedFuncionario.value = null
  selectedPerfil.value = null
  selectedDispositivo.value = null
  selectedNavegador.value = null
  dataInicio.value = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  dataFim.value = format(endOfMonth(new Date()), 'yyyy-MM-dd')
  filtroIP.value = ''
  currentPage.value = 1
}

function formatarData(d: string) {
  if (!d) return '-'
  return format(parseISO(d), 'dd/MM/yyyy')
}

function formatarHora(d: string) {
  if (!d) return '-'
  return format(parseISO(d), 'HH:mm:ss')
}

function formatarDuracao(duracao: string) {
  if (!duracao) return '-'
  const match = duracao.match(/(\d+):(\d+):(\d+)/)
  if (match) {
    const horas = parseInt(match[1])
    const minutos = parseInt(match[2])
    if (horas > 0) return `${horas}h ${minutos}m`
    return `${minutos}m`
  }
  return duracao
}

function getDispositivoIcon(dispositivo: string) {
  if (dispositivo === 'Mobile') return 'i-heroicons-device-phone-mobile'
  if (dispositivo === 'Tablet') return 'i-heroicons-device-tablet'
  return 'i-heroicons-computer-desktop'
}

async function exportarCSV() {
  exportando.value = true
  try {
    // Busca todos os registros (sem paginação)
    let query = supabase
      .from('vw_logins_recentes')
      .select('*')
      .gte('data_login', dataInicio.value)
      .lte('data_login', dataFim.value + ' 23:59:59')
      .order('data_login', { ascending: false })

    if (selectedFuncionario.value) query = query.eq('funcionario_id', selectedFuncionario.value)
    if (selectedPerfil.value) query = query.eq('perfil_nome', perfisList.value.find(p => p.id === selectedPerfil.value)?.nome)
    if (selectedDispositivo.value) query = query.eq('dispositivo', selectedDispositivo.value)
    if (selectedNavegador.value) query = query.eq('navegador', selectedNavegador.value)
    if (filtroIP.value) query = query.ilike('ip_address', `%${filtroIP.value}%`)

    const { data, error } = await query

    if (error) throw error

    // Gera CSV
    const headers = ['Data Login', 'Funcionário', 'Email', 'Perfil', 'Loja', 'Duração', 'Dispositivo', 'Navegador', 'IP']
    const rows = data.map(l => [
      formatarData(l.data_login) + ' ' + formatarHora(l.data_login),
      l.nome_completo || '',
      l.email || '',
      l.perfil_nome || '',
      l.loja_nome || '',
      formatarDuracao(l.duracao_sessao),
      l.dispositivo || '',
      l.navegador || '',
      l.ip_address || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `auditoria-logins-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()

    toast.add({ title: 'Sucesso', description: 'Arquivo CSV exportado!', color: 'green' })
  } catch (error: any) {
    console.error('Erro ao exportar:', error)
    toast.add({ title: 'Erro', description: error.message, color: 'red' })
  } finally {
    exportando.value = false
  }
}

// --- WATCHERS ---
watch([selectedFuncionario, selectedPerfil, selectedDispositivo, selectedNavegador, dataInicio, dataFim, filtroIP, pageSize], () => {
  currentPage.value = 1
  buscarLogins()
  buscarEstatisticas()
})

watch(currentPage, () => {
  buscarLogins()
})
</script>
