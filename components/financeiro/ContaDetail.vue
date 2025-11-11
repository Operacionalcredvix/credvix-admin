<template>
  <div>
    <div v-if="loading" class="flex justify-center items-center h-48">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin" />
    </div>

    <div v-else-if="errorMsg" class="p-6">
      <UCard>
        <div class="text-sm text-red-600">Erro ao carregar conta: {{ errorMsg }}</div>
      </UCard>
    </div>

    <div v-else-if="conta" class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <UButton icon="i-heroicons-arrow-left" color="gray" variant="ghost" @click="router.back()" />
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Conta #{{ conta.id }}</h1>
            <p class="text-sm text-gray-500 mt-1">{{ conta.descricao || 'Sem descrição' }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <UBadge :label="conta.status || 'N/A'" :color="conta.status === 'pago' ? 'green' : 'yellow'" />
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Detalhes da Conta</h3>
            </template>

            <div class="space-y-4 text-sm">
              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                <p class="mt-1 text-gray-900 dark:text-white whitespace-pre-wrap">{{ conta.descricao || '-' }}</p>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Loja</label>
                  <p class="mt-1">{{ conta.loja_nome || (conta.lojas && conta.lojas.nome) || '-' }}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Centro de Custo</label>
                  <p class="mt-1">{{ conta.centro_nome || (conta.centros_custo && conta.centros_custo.nome) || '-' }}</p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Fornecedor</label>
                  <p class="mt-1">{{ conta.fornecedor_nome || (conta.fornecedores && (conta.fornecedores.nome_razao || conta.fornecedores.nome)) || '-' }}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Plano de Conta</label>
                  <p class="mt-1">{{ (conta.plano_contas && `${conta.plano_contas.codigo} — ${conta.plano_contas.nome}`) || conta.plano_conta_id || '-' }}</p>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-4">
                <div>
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Data de Vencimento</label>
                  <p class="mt-1">{{ formatDate(conta.data_vencimento) }}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Agendado Para</label>
                  <p class="mt-1">{{ formatDate(conta.agendado_para) }}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Data de Lançamento</label>
                  <p class="mt-1">{{ formatDate(conta.criado_em || conta.created_at || conta.lancamento) }}</p>
                </div>
              </div>

              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Observações / Nota</label>
                <p class="mt-1">{{ conta.nota || '-' }}</p>
              </div>
            </div>
          </UCard>

        </div>

        <div class="space-y-6">
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Valores</h3>
            </template>
            <div class="space-y-3 text-sm">
              <div>
                <label class="text-sm text-gray-600">Valor</label>
                <p class="font-medium">{{ formatCurrency(conta.valor) }}</p>
              </div>
              <div>
                <label class="text-sm text-gray-600">Pago</label>
                <p>{{ conta.pago ? 'Sim' : 'Não' }}</p>
              </div>
              <div v-if="conta.data_pagamento">
                <label class="text-sm text-gray-600">Data de Pagamento</label>
                <p>{{ formatDate(conta.data_pagamento) }}</p>
              </div>
            </div>
          </UCard>

          <!-- Links / ações rápidas -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Ações</h3>
            </template>
            <div class="flex flex-col gap-2 text-sm">
              <UButton color="primary" @click="goToEdit">Editar Lançamento</UButton>
              <UButton color="green" v-if="!conta.pago" @click="marcarComoPago">Marcar como Pago</UButton>
              <UButton color="gray" variant="ghost" @click="goBack">Voltar</UButton>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Linha do Tempo</h3>
            </template>
            <TimelineRequisicao :items="timeline" />
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-shield-check" class="w-5 h-5" />
                <h3 class="text-lg font-semibold">Auditoria</h3>
              </div>
            </template>
            <AuditoriaLog entidade="contas_pagar" :entidadeId="conta.id" />
          </UCard>
        </div>
      </div>
    </div>

    <div v-else-if="rawResponse" class="p-6">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Resposta bruta (debug)</h3>
        </template>
        <pre class="text-xs max-h-64 overflow-auto bg-gray-50 p-3 rounded text-gray-800 dark:bg-gray-800 dark:text-gray-100">{{ JSON.stringify(rawResponse, null, 2) }}</pre>
      </UCard>
    </div>

    <div v-else class="text-center py-12">
      <UIcon name="i-heroicons-exclamation-circle" class="w-12 h-12 text-red-500 mx-auto" />
      <p class="mt-4 text-lg">Lançamento não encontrado</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TimelineRequisicao from '~/components/TimelineRequisicao.vue'
import AuditoriaLog from '~/components/AuditoriaLog.vue'

const props = defineProps({
  id: { type: [String, Number], required: false }
})

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const toast = useToast()

const loading = ref(true)
const conta = ref(null)
const timeline = ref([])
const errorMsg = ref(null)
const rawResponse = ref(null)

const formatDate = (d) => { if (!d) return '-'; try { return new Date(d).toLocaleString('pt-BR') } catch (e) { return d } }
const formatCurrency = (v) => { try { const n = Number(v || 0); return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) } catch (e) { return `R$ ${Number(v || 0).toFixed(2)}` } }

const idToLoad = props.id || route.params.id

async function carregarConta() {
  console.info('[ContaDetail] iniciar carregarConta id=', idToLoad)
  loading.value = true
  errorMsg.value = null
  try {
    const session = await supabase.auth.getSession();
    const token = session?.data?.session?.access_token || null;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await $fetch(`/api/financeiro/contas-pagar/${idToLoad}`, { method: 'GET', headers })
  if (!res || res.success === false) throw new Error(res?.error || 'Falha ao carregar')
  console.info('[ContaDetail] fetch detail result:', res)
  rawResponse.value = res

  // Compatibilidade: alguns endpoints podem retornar um array (list) em vez do objeto único.
  // Se for array, tenta encontrar o item com o id correspondente ou usa o primeiro.
  const payload = res.data
  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      conta.value = null
    } else {
      const found = payload.find(p => String(p.id) === String(idToLoad)) || payload[0]
      console.info('[ContaDetail] resposta veio como array, usando item encontrado:', found)
      conta.value = found
    }
  } else {
    conta.value = payload || null
  }

    // Tenta carregar timeline simplificada a partir da auditoria (se disponível)
    try {
      const { data: logs } = await supabase
        .from('auditoria')
        .select('*')
        .eq('entidade', 'contas_pagar')
        .eq('entidade_id', String(idToLoad))
        .order('created_at', { ascending: false })

      timeline.value = (logs || []).map(l => ({ id: `aud-${l.id}`, status_novo: l.acao || 'Ação', status_anterior: null, comentario: l.detalhes ? JSON.stringify(l.detalhes) : null, created_at: l.created_at }))
    } catch (e) {
      console.error('[ContaDetail] erro ao carregar timeline de auditoria', e)
      timeline.value = []
    }
  } catch (err) {
    console.error('[ContaDetail] Erro ao carregar conta:', err)
    errorMsg.value = String(err?.message || err || 'Erro desconhecido')
    toast.add({ title: 'Erro', description: errorMsg.value, color: 'red' })
  } finally {
    loading.value = false
  }
}

onMounted(() => carregarConta())

const goBack = () => router.back()
const goToEdit = () => router.push(`/financeiro/contas-a-pagar?edit=${idToLoad}`)

const marcarComoPago = async () => {
  try {
    const session = await supabase.auth.getSession();
    const token = session?.data?.session?.access_token || null;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await $fetch(`/api/financeiro/contas-pagar/${idToLoad}/pagar`, { method: 'POST', headers })
    if (!res || res.success === false) throw new Error(res?.error || 'Falha ao marcar como pago')
    toast.add({ title: 'Sucesso', description: 'Lançamento marcado como pago.' })
    await carregarConta()
  } catch (err) {
    console.error('[ContaDetail] erro marcar como pago', err)
    toast.add({ title: 'Erro', description: String(err?.message || err || 'Erro desconhecido'), color: 'red' })
  }
}
</script>
