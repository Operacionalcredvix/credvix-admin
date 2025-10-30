<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold">Dashboard de Requisições</h1>
        <p class="text-gray-600 dark:text-gray-400">Visão geral por setor e urgências</p>
      </div>
    </div>

    <!-- Filtros de Período -->
    <UCard>
      <div class="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <UFormGroup label="Período">
            <USelectMenu v-model="filtrosPeriodo" :options="periodosOpcoes" value-attribute="value" option-attribute="label" class="w-full sm:w-48">
              <template #label="{ selected }">
                <span>{{ selected?.label || periodosMap[filtrosPeriodo] || 'Selecione' }}</span>
              </template>
            </USelectMenu>
          </UFormGroup>
        </div>
        <UButton icon="i-heroicons-arrow-path" size="sm" @click="carregarTudo" :loading="carregando">
          Atualizar
        </UButton>
      </div>
    </UCard>

    <!-- Resumo Geral -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard>
        <div class="flex items-center gap-3">
          <div class="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
            <UIcon name="i-heroicons-clipboard-document-list" class="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div class="text-2xl font-bold">{{ resumoGeral.total }}</div>
            <div class="text-sm text-gray-500">Total Requisições</div>
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center gap-3">
          <div class="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
            <UIcon name="i-heroicons-clock" class="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <div class="text-2xl font-bold">{{ resumoGeral.pendentes }}</div>
            <div class="text-sm text-gray-500">Pendentes</div>
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center gap-3">
          <div class="p-3 rounded-full bg-red-100 dark:bg-red-900">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <div class="text-2xl font-bold">{{ resumoGeral.atrasadas }}</div>
            <div class="text-sm text-gray-500">Em Atraso</div>
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center gap-3">
          <div class="p-3 rounded-full bg-green-100 dark:bg-green-900">
            <UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <div class="text-2xl font-bold">{{ resumoGeral.concluidas }}</div>
            <div class="text-sm text-gray-500">Concluídas</div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Métricas por Setor -->
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Visão por Setor</h3>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div v-for="s in dashboardSetor" :key="s.setor_destino" class="p-4 rounded border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon :name="getSetorIcon(s.setor_destino)" class="w-5 h-5" />
              <span class="font-semibold">{{ s.setor_destino }}</span>
            </div>
            <span class="text-sm text-gray-500">Total: {{ totalSetor(s) }}</span>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>Novas: <span class="font-medium">{{ s.total_novas }}</span></div>
            <div>Em análise: <span class="font-medium">{{ s.total_em_analise }}</span></div>
            <div>Aceitas: <span class="font-medium">{{ s.total_aceitas }}</span></div>
            <div>Nec. info: <span class="font-medium">{{ s.total_necessita_info }}</span></div>
            <div>Devolvidas: <span class="font-medium">{{ s.total_devolvidas }}</span></div>
            <div>Concluídas: <span class="font-medium">{{ s.total_concluidas }}</span></div>
            <div>Canceladas: <span class="font-medium">{{ s.total_canceladas }}</span></div>
            <div>Atraso: <span class="font-medium" :class="s.total_em_atraso ? 'text-red-600' : ''">{{ s.total_em_atraso }}</span></div>
          </div>
          <div class="mt-2 text-xs text-gray-500">Última: {{ formatarData(s.ultima_requisicao) || '-' }}</div>
        </div>
      </div>
    </UCard>

    <!-- Urgentes -->
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Urgentes</h3>
      </template>
      <UTable :rows="urgentes" :columns="colunasUrgentes" :loading="carregando"
        :empty-state="{ icon: 'i-heroicons-bolt', label: 'Nenhuma requisição urgente' }">
        <template #numero_requisicao-data="{ row }">
          <div class="font-mono font-semibold text-primary-600 dark:text-primary-400">{{ row.numero_requisicao }}</div>
        </template>
        <template #prioridade-data="{ row }">
          <RequisicaoPrioridadeBadge :prioridade="row.prioridade" size="xs" />
        </template>
        <template #setor_destino-data="{ row }">
          <div class="flex items-center gap-2">
            <UIcon :name="getSetorIcon(row.setor_destino)" class="w-4 h-4" />
            <span>{{ row.setor_destino }}</span>
          </div>
        </template>
        <template #prazo_final-data="{ row }">
          <span :class="(row.horas_restantes ?? 0) < 0 ? 'text-red-600 font-semibold' : ''">{{ formatarData(row.prazo_final) }}</span>
        </template>
        <template #actions-data="{ row }">
          <UButton icon="i-heroicons-eye" size="xs" color="gray" variant="ghost" @click="ver(row.id)" />
        </template>
      </UTable>
    </UCard>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { format, subDays, startOfMonth, startOfYear } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { SETOR_ICONS } from '~/types/requisicoes'

definePageMeta({ middleware: 'auth' })

const supabase = useSupabaseClient()
const router = useRouter()
const toast = useToast()

const carregando = ref(false)
const dashboardSetor = ref([])
const urgentes = ref([])
const todasRequisicoes = ref([])

const filtrosPeriodo = ref('30')
const categoriasFiltro = ref([])

const periodosOpcoes = [
  { value: '7', label: 'Últimos 7 dias', icon: 'i-heroicons-calendar' },
  { value: '30', label: 'Últimos 30 dias', icon: 'i-heroicons-calendar' },
  { value: '90', label: 'Últimos 90 dias', icon: 'i-heroicons-calendar' },
  { value: 'mes', label: 'Mês Atual', icon: 'i-heroicons-calendar-days' },
  { value: 'ano', label: 'Ano Atual', icon: 'i-heroicons-calendar-days' }
]

const periodosMap = {
  '7': 'Últimos 7 dias',
  '30': 'Últimos 30 dias',
  '90': 'Últimos 90 dias',
  'mes': 'Mês Atual',
  'ano': 'Ano Atual'
}

const colunasUrgentes = [
  { key: 'numero_requisicao', label: 'Número' },
  { key: 'titulo', label: 'Título' },
  { key: 'setor_destino', label: 'Setor' },
  { key: 'prioridade', label: 'Prioridade' },
  { key: 'prazo_final', label: 'Prazo' },
  { key: 'solicitante_nome', label: 'Solicitante' },
  { key: 'loja_nome', label: 'Loja' },
  { key: 'nome_regional', label: 'Regional' },
  { key: 'actions', label: '' }
]

function getSetorIcon(setor) { return SETOR_ICONS[setor] || 'i-heroicons-building-office' }
function formatarData(data) { return data ? format(new Date(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '-' }
function totalSetor(s) {
  return (s.total_novas||0)+(s.total_em_analise||0)+(s.total_aceitas||0)+(s.total_necessita_info||0)+(s.total_devolvidas||0)+(s.total_concluidas||0)+(s.total_canceladas||0)
}
function ver(id) { router.push(`/requisicoes/${id}`) }

function calcularDataInicio() {
  const agora = new Date()
  switch (filtrosPeriodo.value) {
    case '7': return subDays(agora, 7).toISOString()
    case '30': return subDays(agora, 30).toISOString()
    case '90': return subDays(agora, 90).toISOString()
    case 'mes': return startOfMonth(agora).toISOString()
    case 'ano': return startOfYear(agora).toISOString()
    default: return subDays(agora, 30).toISOString()
  }
}

const requisicoesFiltradas = computed(() => {
  const dataInicio = calcularDataInicio()
  return todasRequisicoes.value.filter(r => new Date(r.data_criacao) >= new Date(dataInicio))
})

const resumoGeral = computed(() => {
  const reqs = requisicoesFiltradas.value
  return {
    total: reqs.length,
    pendentes: reqs.filter(r => ['Nova', 'Em Análise', 'Aceita', 'Necessita Informação', 'Devolvida'].includes(r.status)).length,
    atrasadas: reqs.filter(r => r.em_atraso).length,
    concluidas: reqs.filter(r => r.status === 'Concluída').length
  }
})

async function carregarTudo() {
  carregando.value = true
  try {
    const [setorRes, urgRes, reqsRes] = await Promise.all([
      supabase.from('vw_dashboard_setor').select('*'),
      supabase.from('vw_requisicoes_urgentes').select('*'),
      supabase.from('vw_requisicoes_completas').select('id, data_criacao, status, em_atraso, categoria')
    ])
    if (setorRes.error) throw setorRes.error
    if (urgRes.error) throw urgRes.error
    dashboardSetor.value = setorRes.data || []
    urgentes.value = urgRes.data || []
    if (!reqsRes.error) {
      todasRequisicoes.value = reqsRes.data || []
      const cats = [...new Set((reqsRes.data || []).map(r => r.categoria).filter(Boolean))]
      categoriasFiltro.value = cats
    }
  } catch (err) {
    console.error('[Dashboard Requisições] Erro:', err)
    toast.add({ title: 'Erro ao carregar dashboard', description: err.message, color: 'red' })
  } finally {
    carregando.value = false
  }
}

onMounted(() => { carregarTudo() })
</script>
