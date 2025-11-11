<template>
  <div class="space-y-6">

    <!-- FILTROS GERAIS -->
    <UCard class="mb-4">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="font-semibold">Filtros</h3>
          <div class="flex items-center gap-2">
            <UButton size="sm" color="gray" variant="ghost" @click="limparFiltros">Limpar</UButton>
            <UButton size="sm" color="primary" @click="aplicarFiltros">Aplicar</UButton>
          </div>
        </div>
      </template>
      <div class="flex flex-wrap gap-4 items-end">
        <UFormGroup label="Loja" name="loja" class="w-64">
          <USelectMenu v-model="selectedLoja" :options="lojas || []" value-attribute="id" option-attribute="nome" placeholder="Todas as lojas" clearable />
        </UFormGroup>
        <UFormGroup label="De" name="date_from" class="w-48">
          <UInput type="date" v-model="dateFrom" />
        </UFormGroup>
        <UFormGroup label="Até" name="date_to" class="w-48">
          <UInput type="date" v-model="dateTo" />
        </UFormGroup>
      </div>
    </UCard>


    <!-- RELATÓRIO DE CONTAS A PAGAR POR VENCIMENTO -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Contas a Pagar por Vencimento</h2>
          <UButton 
            :icon="isContasExpanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" 
            size="xs" 
            color="gray" 
            variant="ghost"
            @click="isContasExpanded = !isContasExpanded"
          />
        </div>
      </template>
      <div v-show="isContasExpanded">
        <div v-if="contasPending" class="text-center py-10 text-gray-500">
          <UIcon name="i-heroicons-arrow-path" class="text-2xl animate-spin" />
          <p>Carregando contas...</p>
        </div>
        <div v-else-if="contasError" class="text-center py-10 text-red-600">
          <UIcon name="i-heroicons-exclamation-triangle" class="text-2xl" />
          <p>Erro ao carregar dados. Verifique suas permissões.</p>
        </div>
        <div v-else-if="!contasVencimento" class="text-center py-10 text-amber-600">
          <UIcon name="i-heroicons-exclamation-circle" class="text-2xl" />
          <p>Sem permissão para visualizar contas a pagar.</p>
        </div>
        <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <UCard>
            <template #header><h3 class="font-semibold">Próximas Semanas</h3></template>
            <div v-if="Object.keys(contasVencimento?.weekly || {}).length === 0" class="text-center text-gray-500 py-4">
              Nenhuma conta pendente nas próximas semanas.
            </div>
            <div v-else class="space-y-2">
              <div v-for="(valor, semana) in contasVencimento?.weekly" :key="semana" class="flex justify-between">
                <span>{{ semana }}</span>
                <span class="font-bold">{{ formatCurrency(valor) }}</span>
              </div>
            </div>
          </UCard>
          <UCard>
            <template #header><h3 class="font-semibold">Próximos Meses</h3></template>
            <div v-if="Object.keys(contasVencimento?.monthly || {}).length === 0" class="text-center text-gray-500 py-4">
              Nenhuma conta pendente nos próximos meses.
            </div>
            <div v-else class="space-y-2">
              <div v-for="(valor, mes) in contasVencimento?.monthly" :key="mes" class="flex justify-between">
                <span>{{ mes }}</span>
                <span class="font-bold">{{ formatCurrency(valor) }}</span>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </UCard>

    <!-- RELATÓRIO DE DESPESAS CLASSIFICADAS -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Despesas Classificadas</h2>
          <UButton 
            :icon="isDespesasExpanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" 
            size="xs" 
            color="gray" 
            variant="ghost"
            @click="isDespesasExpanded = !isDespesasExpanded"
          />
        </div>
      </template>
      <div v-show="isDespesasExpanded">
        <div v-if="despesasPending" class="text-center py-10 text-gray-500">
          <UIcon name="i-heroicons-arrow-path" class="text-2xl animate-spin" />
          <p>Carregando despesas...</p>
        </div>
        <div v-else-if="despesasError" class="text-center py-10 text-red-600">
          <UIcon name="i-heroicons-exclamation-triangle" class="text-2xl" />
          <p>Erro ao carregar dados. Verifique suas permissões.</p>
        </div>
        <div v-else-if="!despesasClassificadas" class="text-center py-10 text-amber-600">
          <UIcon name="i-heroicons-exclamation-circle" class="text-2xl" />
          <p>Sem permissão para visualizar despesas.</p>
        </div>
        <div v-else>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
            <UCard>
              <template #header><h3 class="font-semibold">Por Categoria</h3></template>
              <div v-if="Object.keys(despesasClassificadas?.categorias || {}).length === 0" class="text-center text-gray-500 py-4">
                Nenhuma despesa encontrada.
              </div>
              <div v-else class="space-y-2">
                <div v-for="(valor, categoria) in despesasClassificadas?.categorias" :key="categoria" class="flex justify-between">
                  <span>{{ categoria }}</span>
                  <span class="font-bold">{{ formatCurrency(valor) }}</span>
                </div>
              </div>
            </UCard>
            <UCard>
              <template #header><h3 class="font-semibold">Por Centro de Custo</h3></template>
              <div v-if="Object.keys(despesasClassificadas?.centros || {}).length === 0" class="text-center text-gray-500 py-4">
                Nenhum centro de custo encontrado.
              </div>
              <div v-else class="space-y-2">
                <div v-for="(valor, centro) in despesasClassificadas?.centros" :key="centro" class="flex justify-between">
                  <span>{{ centro }}</span>
                  <span class="font-bold">{{ formatCurrency(valor) }}</span>
                </div>
              </div>
            </UCard>
          </div>
          <UCard>
            <template #header><h3 class="font-semibold">Resumo Mensal</h3></template>
            <div v-if="!despesasClassificadas?.resumoMensal || despesasClassificadas.resumoMensal.length === 0" class="text-center text-gray-500 py-4">
              Nenhum resumo mensal disponível.
            </div>
            <div v-else>
              <UTable :rows="despesasClassificadas.resumoMensal" :columns="despesasColumns" class="w-full">
                <template #valor_total="{ row }">
                  <span class="font-bold">{{ formatCurrency(row.valor_total) }}</span>
                </template>
              </UTable>
            </div>
          </UCard>
        </div>
      </div>
    </UCard>

    <!-- RELATÓRIO DE CONCILIAÇÃO SIMPLES -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Conciliação Simples</h2>
          <UButton 
            :icon="isConciliacaoExpanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" 
            size="xs" 
            color="gray" 
            variant="ghost"
            @click="isConciliacaoExpanded = !isConciliacaoExpanded"
          />
        </div>
      </template>
      <div v-show="isConciliacaoExpanded">
        <div v-if="conciliacaoPending" class="text-center py-10 text-gray-500">
          <UIcon name="i-heroicons-arrow-path" class="text-2xl animate-spin" />
          <p>Carregando conciliação...</p>
        </div>
        <div v-else-if="conciliacaoError" class="text-center py-10 text-red-600">
          <UIcon name="i-heroicons-exclamation-triangle" class="text-2xl" />
          <p>Erro ao carregar dados. Verifique suas permissões.</p>
        </div>
        <div v-else-if="!conciliacaoSimples" class="text-center py-10 text-amber-600">
          <UIcon name="i-heroicons-exclamation-circle" class="text-2xl" />
          <p>Sem permissão para visualizar conciliação.</p>
        </div>
        <div v-else>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <UCard>
              <template #header><h3 class="font-semibold text-green-600">Entradas</h3></template>
              <div class="text-2xl font-bold text-green-600">
                {{ formatCurrency(conciliacaoSimples?.entradas || 0) }}
              </div>
              <p class="text-sm text-gray-500 mt-1">Recebimentos do período</p>
            </UCard>
            <UCard>
              <template #header><h3 class="font-semibold text-red-600">Saídas</h3></template>
              <div class="text-2xl font-bold text-red-600">
                {{ formatCurrency(conciliacaoSimples?.saidas || 0) }}
              </div>
              <p class="text-sm text-gray-500 mt-1">Pagamentos do período</p>
            </UCard>
            <UCard>
              <template #header><h3 class="font-semibold">Saldo</h3></template>
              <div :class="['text-2xl font-bold', (conciliacaoSimples?.saldo || 0) >= 0 ? 'text-green-600' : 'text-red-600']">
                {{ formatCurrency(conciliacaoSimples?.saldo || 0) }}
              </div>
              <p class="text-sm text-gray-500 mt-1">Diferença entre entradas e saídas</p>
            </UCard>
          </div>
          <UCard>
            <template #header><h3 class="font-semibold">Transações Recentes</h3></template>
            <div v-if="!conciliacaoSimples?.transacoes || conciliacaoSimples.transacoes.length === 0" class="text-center text-gray-500 py-4">
              Nenhuma transação encontrada.
            </div>
            <div v-else>
              <UTable :rows="conciliacaoSimples.transacoes" :columns="conciliacaoColumns" class="w-full">
                <template #valor="{ row }">
                  <span :class="row.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'">
                    {{ row.tipo === 'entrada' ? '+' : '-' }}{{ formatCurrency(row.valor) }}
                  </span>
                </template>
                <template #data="{ row }">
                  {{ new Date(row.data).toLocaleDateString('pt-BR') }}
                </template>
              </UTable>
            </div>
          </UCard>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

// Declaração para satisfazer o verificador TypeScript
declare function useAsyncData<T = any>(key: string, fetcher: (...args: any[]) => Promise<T>, opts?: any): any

// Helpers do Supabase (existem no runtime do Nuxt)
declare function useSupabaseClient(): any
declare function useProfile(): any
// Nuxt auto-imports - declarações para o TypeScript no ambiente de desenvolvimento
declare function useRoute(): any
declare function useRouter(): any

const isContasExpanded = ref(true)
const isDespesasExpanded = ref(false)
const isConciliacaoExpanded = ref(false)

const supabase = useSupabaseClient()
const { profile } = useProfile()
const route = useRoute()
const router = useRouter()

// filtros locais que serão sincronizados com a query da rota
const selectedLoja = ref(route.query.loja_id || null)
const dateFrom = ref(route.query.date_from || '')
const dateTo = ref(route.query.date_to || '')

// sincronizar campos locais quando a rota muda (ex.: back/forward ou link direto)
watch(() => route.query, (q) => {
  selectedLoja.value = q.loja_id || null
  dateFrom.value = q.date_from || ''
  dateTo.value = q.date_to || ''
})

// carregar lista de lojas para o select
const { data: lojas } = await useAsyncData('lojas-list-dashboard-financeiro', async () => {
  const { data } = await supabase.from('lojas').select('id,nome').order('nome')
  return data || []
})

const aplicarFiltros = () => {
  const q: any = { ...route.query }
  if (selectedLoja.value) q.loja_id = String(selectedLoja.value)
  else delete q.loja_id
  if (dateFrom.value) q.date_from = String(dateFrom.value)
  else delete q.date_from
  if (dateTo.value) q.date_to = String(dateTo.value)
  else delete q.date_to

  router.push({ query: q })
}

const limparFiltros = () => {
  selectedLoja.value = null
  dateFrom.value = ''
  dateTo.value = ''
  const q = { ...route.query }
  delete q.loja_id
  delete q.date_from
  delete q.date_to
  router.push({ query: q })
}

const { data: contasVencimento, pending: contasPending, error: contasError } = await useAsyncData('contas-pagar-vencimento', async () => {
  try {
  const sessionResp = await supabase.auth.getSession()
  const token = sessionResp?.data?.session?.access_token || null
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  // monta query params gerais (loja_id, date_from, date_to) a partir da rota
  const params = new URLSearchParams()
  if (route.query.loja_id) params.set('loja_id', String(route.query.loja_id))
  if (route.query.date_from) params.set('date_from', String(route.query.date_from))
  if (route.query.date_to) params.set('date_to', String(route.query.date_to))
  const url = '/api/dashboard/contas-pagar-vencimento' + (params.toString() ? `?${params.toString()}` : '')

  const response: any = await $fetch(url, { headers, method: 'GET' })
    if (!response.success) {
      console.error('[DashboardFinanceiro] Erro ao carregar contas:', response.error)
      return null
    }
    return response?.data || null
  } catch (err) {
    console.error('[DashboardFinanceiro] Exceção ao carregar contas:', err)
    return null
  }
}, { watch: [profile, () => route.query.loja_id, () => route.query.date_from, () => route.query.date_to] })

const { data: despesasClassificadas, pending: despesasPending, error: despesasError } = await useAsyncData('despesas-classificadas', async () => {
  try {
  const sessionResp = await supabase.auth.getSession()
  const token = sessionResp?.data?.session?.access_token || null
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const params = new URLSearchParams()
  if (route.query.loja_id) params.set('loja_id', String(route.query.loja_id))
  if (route.query.date_from) params.set('date_from', String(route.query.date_from))
  if (route.query.date_to) params.set('date_to', String(route.query.date_to))
  const url = '/api/dashboard/despesas-classificadas' + (params.toString() ? `?${params.toString()}` : '')

  const response: any = await $fetch(url, { headers, method: 'GET' })
    if (!response.success) {
      console.error('[DashboardFinanceiro] Erro ao carregar despesas:', response.error)
      return null
    }
    return response?.data || null
  } catch (err) {
    console.error('[DashboardFinanceiro] Exceção ao carregar despesas:', err)
    return null
  }
}, { watch: [profile, () => route.query.loja_id, () => route.query.date_from, () => route.query.date_to] })

const { data: conciliacaoSimples, pending: conciliacaoPending, error: conciliacaoError } = await useAsyncData('conciliacao-simples', async () => {
  try {
  const sessionResp = await supabase.auth.getSession()
  const token = sessionResp?.data?.session?.access_token || null
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const params = new URLSearchParams()
  if (route.query.loja_id) params.set('loja_id', String(route.query.loja_id))
  if (route.query.date_from) params.set('date_from', String(route.query.date_from))
  if (route.query.date_to) params.set('date_to', String(route.query.date_to))
  const url = '/api/dashboard/conciliacao-simples' + (params.toString() ? `?${params.toString()}` : '')

  const response: any = await $fetch(url, { headers, method: 'GET' })
    if (!response.success) {
      console.error('[DashboardFinanceiro] Erro ao carregar conciliação:', response.error)
      return null
    }
    return response?.data || null
  } catch (err) {
    console.error('[DashboardFinanceiro] Exceção ao carregar conciliação:', err)
    return null
  }
}, { watch: [profile, () => route.query.loja_id, () => route.query.date_from, () => route.query.date_to] })

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const despesasColumns = [
  { key: 'mes', label: 'Mês' },
  { key: 'categoria', label: 'Categoria' },
  { key: 'centro_custo', label: 'Centro de Custo' },
  { key: 'valor_total', label: 'Valor Total' }
]

const conciliacaoColumns = [
  { key: 'data', label: 'Data' },
  { key: 'descricao', label: 'Descrição' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'valor', label: 'Valor' }
]
</script>
