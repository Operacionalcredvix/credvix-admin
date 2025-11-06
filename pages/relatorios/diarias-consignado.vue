<template>
  <div class="space-y-8">
    <header>
      <h1 class="text-3xl font-bold mb-2">Diárias de Consignado</h1>
      <p class="text-gray-600 dark:text-gray-400">Acompanhamento diário de metas com redistribuição automática de desvios</p>
    </header>

    <!-- Filtros -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-funnel" class="text-primary-500" />
          <h3 class="font-semibold">Filtros</h3>
        </div>
      </template>
      <div class="flex flex-wrap items-end gap-4">
        <UFormGroup label="Banco" name="banco" class="flex-grow min-w-[200px]">
          <USelectMenu v-model="selectedBanco" :options="bancosList" value-attribute="id"
            option-attribute="nome_instituicao" placeholder="Todos os Bancos" clearable searchable />
        </UFormGroup>
        
        <UFormGroup label="Regional" name="regional" class="flex-grow min-w-[200px]">
          <USelectMenu v-model="selectedRegional" :options="regionaisList" value-attribute="id"
            option-attribute="nome_regional" placeholder="Todas as Regionais" clearable searchable />
        </UFormGroup>

        <UFormGroup label="Loja" name="loja" class="flex-grow min-w-[200px]">
          <USelectMenu v-model="selectedLoja" :options="lojasFiltradas" value-attribute="id"
            option-attribute="nome" placeholder="Todas as Lojas" clearable searchable 
            :disabled="!selectedRegional" />
        </UFormGroup>

        <div class="flex items-center gap-3">
          <UCheckbox v-model="useMonth" label="Usar mês completo" />
          <UInput v-model="selectedDateStr" type="date" class="w-40" />
        </div>

        <UButton 
          @click="limparFiltros" 
          color="gray" 
          variant="ghost" 
          icon="i-heroicons-x-mark"
          label="Limpar Filtros"
          size="lg"
        />
      </div>
    </UCard>

    <!-- Loading State -->
    <div v-if="pending" class="text-center py-10 text-gray-500">
      <UIcon name="i-heroicons-arrow-path" class="text-4xl animate-spin" />
      <p class="mt-4">Carregando dados...</p>
    </div>

    <!-- Card de Diárias -->
    <UCard v-else-if="diarias" class="border-primary-200/50">
      <template #header>
        <div class="flex items-center gap-2 justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-calendar" class="text-primary-500 text-xl" />
            <div>
              <h3 class="font-semibold text-lg">Análise de Diárias</h3>
              <p class="text-xs text-gray-500 mt-0.5">
                {{ formatPeriodLabel() }}
              </p>
            </div>
            <UPopover :popper="{ placement: 'right', strategy: 'fixed' }">
              <UButton 
                icon="i-heroicons-question-mark-circle" 
                size="xs" 
                color="gray" 
                variant="ghost" 
                class="p-0"
              />
              <template #panel>
                <div class="p-4 max-w-sm">
                  <p class="font-semibold mb-2 text-gray-900 dark:text-gray-100">Como funciona:</p>
                  <p class="text-sm text-gray-700 dark:text-gray-300"><strong>Meta Diária Base:</strong> Meta total do mês ÷ dias úteis (Seg-Sáb).</p>
                  <p class="text-sm text-gray-700 dark:text-gray-300 mt-2"><strong>Meta Diária Ajustada:</strong> Redistribui os desvios acumulados pelos dias restantes.</p>
                </div>
              </template>
            </UPopover>
          </div>
        </div>
      </template>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <!-- Meta do Mês -->
        <div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div class="text-sm text-gray-500">Meta do Mês</div>
          <div class="text-2xl font-semibold">{{ formatCurrency(diarias.total_meta_consignado || 0) }}</div>
        </div>

        <!-- Dias Úteis -->
        <div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div class="text-sm text-gray-500">Dias Úteis</div>
          <div class="text-2xl font-semibold">{{ diarias.dias_uteis_mes || 0 }}</div>
        </div>

        <!-- Meta Diária Base -->
        <div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div class="text-sm text-gray-500">Meta Diária (Base)</div>
          <div class="text-2xl font-semibold">{{ formatCurrency(diarias.meta_diaria_base || 0) }}</div>
        </div>

        <!-- Meta Diária Ajustada - DESTAQUE -->
        <div class="p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-200 dark:border-primary-800">
          <div class="flex items-center gap-2 text-sm text-primary-700 dark:text-primary-300">
            <span class="font-medium">Meta Diária Ajustada</span>
            <UPopover :popper="{ placement: 'top', strategy: 'fixed' }">
              <UButton 
                icon="i-heroicons-information-circle" 
                size="xs" 
                color="primary" 
                variant="ghost" 
                class="p-0"
              />
              <template #panel>
                <div class="p-4 max-w-sm">
                  <p class="font-semibold mb-2 text-gray-900 dark:text-gray-100">Meta Diária Ajustada</p>
                  <p class="text-sm text-gray-700 dark:text-gray-300">Meta recalculada com base no desempenho anterior.</p>
                  <ul class="text-sm text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                    <li>• Se ficou devendo → meta aumenta</li>
                    <li>• Se passou da meta → meta diminui</li>
                  </ul>
                </div>
              </template>
            </UPopover>
          </div>
          <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {{ formatCurrency(diarias.meta_diaria_ajustada || 0) }}
          </div>
          <div class="text-xs text-primary-600 dark:text-primary-400 mt-1">
            {{ getDiferencaMeta() }}
          </div>
        </div>

        <!-- Pago Hoje -->
        <div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div class="text-sm text-gray-500">Pago Hoje</div>
          <div class="text-2xl font-semibold">{{ formatCurrency(diarias.pago_consignado_hoje || 0) }}</div>
          <div class="text-xs mt-1" :class="diarias.pago_consignado_hoje >= diarias.meta_diaria_ajustada ? 'text-green-600' : 'text-amber-600'">
            {{ getPercentualDoDia() }}% da meta ajustada
          </div>
        </div>

        <!-- Acumulado no Mês -->
        <div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div class="text-sm text-gray-500">Acumulado no Mês</div>
          <div class="text-2xl font-semibold">{{ formatCurrency(diarias.pago_consignado_acumulado || 0) }}</div>
          <div class="text-xs text-gray-500 mt-1">
            {{ getPercentualAcumulado() }}% da meta total
          </div>
        </div>

        <!-- Desvio do Dia -->
        <div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div class="text-sm text-gray-500">Desvio do Dia</div>
          <div class="text-2xl font-semibold" :class="diarias.desvio_hoje >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ formatCurrency(diarias.desvio_hoje || 0) }}
          </div>
          <div class="text-xs text-gray-500 mt-1">
            vs meta base
          </div>
        </div>

        <!-- Desvio Acumulado - DESTAQUE -->
        <div class="p-4 rounded-lg" :class="diarias.desvio_acumulado >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'">
          <div class="flex items-center gap-2 text-sm" :class="diarias.desvio_acumulado >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'">
            <span class="font-medium">Desvio Acumulado</span>
            <UPopover :popper="{ placement: 'top', strategy: 'fixed' }">
              <UButton 
                icon="i-heroicons-information-circle" 
                size="xs" 
                :color="diarias.desvio_acumulado >= 0 ? 'green' : 'red'" 
                variant="ghost" 
                class="p-0"
              />
              <template #panel>
                <div class="p-4 max-w-sm">
                  <p class="font-semibold mb-2 text-gray-900 dark:text-gray-100">Desvio Acumulado</p>
                  <p class="text-sm text-gray-700 dark:text-gray-300">Soma de todos os desvios diários até hoje.</p>
                  <p class="text-sm text-gray-700 dark:text-gray-300 mt-2">Mostra se está <strong>adiantado</strong> (positivo) ou <strong>atrasado</strong> (negativo) em relação ao planejado.</p>
                </div>
              </template>
            </UPopover>
          </div>
          <div class="text-2xl font-bold" :class="diarias.desvio_acumulado >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
            {{ formatCurrency(diarias.desvio_acumulado || 0) }}
          </div>
          <div class="text-xs mt-1" :class="diarias.desvio_acumulado >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ diarias.desvio_acumulado >= 0 ? 'Adiantado' : 'Atrasado' }}
          </div>
        </div>

        <!-- Saldo da Meta -->
        <div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div class="text-sm text-gray-500">Saldo da Meta</div>
          <div class="text-2xl font-semibold">{{ formatCurrency(diarias.saldo_meta_mes || 0) }}</div>
          <div class="text-xs text-gray-500 mt-1">
            Faltam {{ getPercentualRestante() }}%
          </div>
        </div>

        <!-- Dias Transcorridos -->
        <div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div class="text-sm text-gray-500">Dias Transcorridos</div>
          <div class="text-2xl font-semibold">{{ diarias.dias_transcorridos || 0 }}</div>
          <div class="text-xs text-gray-500 mt-1">
            {{ getPercentualDiasPassados() }}% do período
          </div>
        </div>

        <!-- Dias Restantes -->
        <div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div class="text-sm text-gray-500">Dias Restantes</div>
          <div class="text-2xl font-semibold">{{ diarias.dias_restantes || 0 }}</div>
          <div class="text-xs text-gray-500 mt-1">
            {{ getPercentualDiasRestantes() }}% do período
          </div>
        </div>

        <!-- Projeção do Mês - DESTAQUE -->
        <div class="p-4 rounded-lg" :class="(diarias.projecao_mes || 0) >= (diarias.total_meta_consignado || 0) ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800' : 'bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800'">
          <div class="flex items-center gap-2 text-sm" :class="(diarias.projecao_mes || 0) >= (diarias.total_meta_consignado || 0) ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'">
            <span class="font-medium">Projeção do Mês</span>
            <UPopover :popper="{ placement: 'top', strategy: 'fixed' }">
              <UButton 
                icon="i-heroicons-information-circle" 
                size="xs" 
                :color="(diarias.projecao_mes || 0) >= (diarias.total_meta_consignado || 0) ? 'green' : 'amber'" 
                variant="ghost" 
                class="p-0"
              />
              <template #panel>
                <div class="p-4 max-w-sm">
                  <p class="font-semibold mb-2 text-gray-900 dark:text-gray-100">Projeção do Mês</p>
                  <p class="text-sm text-gray-700 dark:text-gray-300">Estimativa de quanto será atingido ao final do mês, mantendo o ritmo da meta ajustada.</p>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mt-2 italic">Cálculo: Acumulado + (Meta Ajustada × Dias Restantes)</p>
                </div>
              </template>
            </UPopover>
          </div>
          <div class="text-2xl font-bold" :class="(diarias.projecao_mes || 0) >= (diarias.total_meta_consignado || 0) ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'">
            {{ formatCurrency(diarias.projecao_mes || 0) }}
          </div>
          <div class="text-xs mt-1" :class="(diarias.projecao_mes || 0) >= (diarias.total_meta_consignado || 0) ? 'text-green-600' : 'text-amber-600'">
            {{ getStatusProjecao() }}
          </div>
        </div>
      </div>
    </UCard>

    <!-- Estado Vazio -->
    <UCard v-else>
      <div class="text-center py-10 text-gray-500">
        <UIcon name="i-heroicons-calendar-days" class="text-4xl mb-4" />
        <p>Nenhum dado encontrado para o período selecionado.</p>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { format, startOfMonth, endOfMonth } from 'date-fns'

// Declarações para satisfazer o verificador TypeScript/linters locais
declare const definePageMeta: any
declare const useSupabaseClient: any
declare const useToast: any
declare function useAsyncData<T = any>(key: string, fetcher: (...args: any[]) => Promise<T>, opts?: any): any

definePageMeta({
  middleware: 'auth'
})

const supabase = useSupabaseClient()
const toast = useToast()

// Função utilitária para formatar moeda
function formatCurrency(value: number | string) {
  const number = typeof value === 'number' ? value : Number(value)
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// --- ESTADO DOS FILTROS ---
const selectedBanco = ref<number | null>(null)
const selectedRegional = ref<number | null>(null)
const selectedLoja = ref<number | null>(null)
const selectedDateStr = ref(format(new Date(), 'yyyy-MM-dd'))
const useMonth = ref(true)

// Janela de tempo calculada
const dateWindow = computed(() => {
  const day = new Date(selectedDateStr.value)
  if (Number.isNaN(day.getTime())) {
    const now = new Date()
    return { start: startOfMonth(now), end: endOfMonth(now) }
  }
  return useMonth.value
    ? { start: startOfMonth(day), end: endOfMonth(day) }
    : { start: day, end: day }
})

// --- BUSCA DE DADOS PARA FILTROS ---
const { data: bancosList } = await useAsyncData('bancos-diarias', async () => {
  const { data, error } = await supabase.from('bancos').select('id, nome_instituicao').order('nome_instituicao')
  if (error) console.error('Erro ao buscar bancos:', error)
  return data || []
})

const { data: regionaisList } = await useAsyncData('regionais-diarias', async () => {
  const { data, error } = await supabase.from('regionais').select('id, nome_regional').order('nome_regional')
  if (error) console.error('Erro ao buscar regionais:', error)
  return data || []
})

const { data: todasLojas } = await useAsyncData('lojas-diarias', async () => {
  const { data, error } = await supabase.from('lojas').select('id, nome, regional_id').order('nome')
  if (error) console.error('Erro ao buscar lojas:', error)
  return data || []
})

const lojasFiltradas = computed(() => {
  if (!selectedRegional.value || !todasLojas.value) return []
  return todasLojas.value.filter(loja => loja.regional_id === selectedRegional.value)
})

// Limpa loja quando muda regional
watch(selectedRegional, () => {
  selectedLoja.value = null
})

// --- FUNÇÃO PARA LIMPAR FILTROS ---
function limparFiltros() {
  selectedBanco.value = null
  selectedRegional.value = null
  selectedLoja.value = null
  selectedDateStr.value = format(new Date(), 'yyyy-MM-dd')
  useMonth.value = true
}

// --- BUSCA DE DADOS DE DIÁRIAS ---
const { data: dashboardData, pending } = await useAsyncData(
  'diarias-consignado',
  async () => {
    const { data, error } = await supabase.rpc('get_dashboard_data_backoffice', {
      p_start_date: format(dateWindow.value.start, 'yyyy-MM-dd'),
      p_end_date: format(dateWindow.value.end, 'yyyy-MM-dd'),
      p_banco_id: selectedBanco.value,
      p_diarias_start_date: format(dateWindow.value.start, 'yyyy-MM-dd'),
      p_diarias_end_date: format(dateWindow.value.end, 'yyyy-MM-dd'),
      p_diarias_ref_day: selectedDateStr.value
    })
    
    if (error) {
      console.error('Erro ao buscar dados de diárias:', error)
      if (process.client) {
        toast.add({ title: 'Erro ao carregar dados', description: error.message, color: 'red' })
      }
      return null
    }
    
    return data
  },
  { watch: [selectedBanco, selectedRegional, selectedLoja, selectedDateStr, useMonth] }
)

const diarias = computed(() => dashboardData.value?.diarias || null)

// --- FUNÇÕES AUXILIARES PARA EXIBIÇÃO ---
function formatPeriodLabel() {
  const start = format(dateWindow.value.start, 'dd/MM/yyyy')
  const end = format(dateWindow.value.end, 'dd/MM/yyyy')
  return useMonth.value ? `Mês: ${format(dateWindow.value.start, 'MMMM/yyyy')}` : `Período: ${start} - ${end}`
}

function getDiferencaMeta() {
  if (!diarias.value) return ''
  const diff = (diarias.value.meta_diaria_ajustada || 0) - (diarias.value.meta_diaria_base || 0)
  if (diff === 0) return 'Igual à meta base'
  return diff > 0 ? `+${formatCurrency(diff)} vs base` : `${formatCurrency(diff)} vs base`
}

function getPercentualDoDia() {
  if (!diarias.value || !diarias.value.meta_diaria_ajustada) return '0'
  const perc = ((diarias.value.pago_consignado_hoje || 0) / diarias.value.meta_diaria_ajustada) * 100
  return perc.toFixed(1)
}

function getPercentualAcumulado() {
  if (!diarias.value || !diarias.value.total_meta_consignado) return '0'
  const perc = ((diarias.value.pago_consignado_acumulado || 0) / diarias.value.total_meta_consignado) * 100
  return perc.toFixed(1)
}

function getPercentualRestante() {
  if (!diarias.value || !diarias.value.total_meta_consignado) return '0'
  const perc = ((diarias.value.saldo_meta_mes || 0) / diarias.value.total_meta_consignado) * 100
  return perc.toFixed(1)
}

function getPercentualDiasPassados() {
  if (!diarias.value || !diarias.value.dias_uteis_mes) return '0'
  const perc = ((diarias.value.dias_transcorridos || 0) / diarias.value.dias_uteis_mes) * 100
  return perc.toFixed(0)
}

function getPercentualDiasRestantes() {
  if (!diarias.value || !diarias.value.dias_uteis_mes) return '0'
  const perc = ((diarias.value.dias_restantes || 0) / diarias.value.dias_uteis_mes) * 100
  return perc.toFixed(0)
}

function getStatusProjecao() {
  if (!diarias.value) return ''
  const proj = diarias.value.projecao_mes || 0
  const meta = diarias.value.total_meta_consignado || 0
  if (proj >= meta) {
    const excedente = proj - meta
    return `Meta batida! +${formatCurrency(excedente)}`
  } else {
    const faltam = meta - proj
    return `Faltam ${formatCurrency(faltam)}`
  }
}
</script>
