<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard Financeiro
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          Visão financeira e análises
        </p>
      </div>
    </div>

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
import { ref } from 'vue'

// Declaração para satisfazer o verificador TypeScript
declare function useAsyncData<T = any>(key: string, fetcher: (...args: any[]) => Promise<T>, opts?: any): any

const isContasExpanded = ref(true)
const isDespesasExpanded = ref(false)
const isConciliacaoExpanded = ref(false)

const { data: contasVencimento, pending: contasPending } = await useAsyncData('contas-pagar-vencimento', async () =>
  await $fetch('/api/dashboard/contas-pagar-vencimento')
)

const { data: despesasClassificadas, pending: despesasPending } = await useAsyncData('despesas-classificadas', async () =>
  await $fetch('/api/dashboard/despesas-classificadas')
)

const { data: conciliacaoSimples, pending: conciliacaoPending } = await useAsyncData('conciliacao-simples', async () =>
  await $fetch('/api/dashboard/conciliacao-simples')
)

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
