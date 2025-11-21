<template>
  <div v-if="pending">
    <p>A carregar detalhes do contrato...</p>
  </div>
  <div v-else-if="contrato">
    <header class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-primary-500 text-3xl font-bold">Detalhes do Contrato #{{ contrato.numero_contrato }}</h1>
          <p class="text-gray-500 mt-1">
            Registado em {{ new Date(contrato.data_contrato).toLocaleDateString('pt-BR') }}
          </p>
        </div>
        <UButton icon="i-heroicons-arrow-left-circle" size="lg" color="gray" to="/backoffice/contratos">
          Voltar para a Lista
        </UButton>
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-8">
        <UCard>
          <template #header><h3 class="font-semibold text-lg">Detalhes Financeiros</h3></template>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4 info-grid">
            <div>
              <label>Valor Total</label>
              <p>{{ formatCurrency(contrato.valor_total) }}</p>
            </div>
            <div>
              <label>Valor da Parcela</label>
              <p>{{ formatCurrency(contrato.valor_parcela) }}</p>
            </div>
            <div>
              <label>Prazo</label>
              <p>{{ contrato.prazo }} meses</p>
            </div>
            <div>
              <label>Meses restantes</label>
              <p>{{ mesesRestantesTexto }}</p>
            </div>
            <div>
              <label>Tabela</label>
              <p>{{ contrato.tabela }}</p>
            </div>
            <div>
              <label>Data da digitação</label>
              <p>{{ formatDate(contrato.data_contrato) }}</p>
            </div>
            <div>
              <label>Data de Pagamento</label>
              <p>{{ formatDate(contrato.data_pagamento) }}</p>
            </div>
            <div>
              <label>Número beneficio</label>
              <p>{{ contrato.numero_beneficio || 'N/A' }}</p>
            </div>
            <div>
              <label>Espécie beneficio</label>
              <p>{{ contrato.especie_beneficio || 'N/A' }}</p>
            </div>
          </div>
        </UCard>

        <UCard v-if="contrato.motivo_status">
          <template #header><h3 class="font-semibold text-lg">Motivo do Status</h3></template>
          <p class="text-gray-700">{{ contrato.motivo_status }}</p>
        </UCard>
      </div>

      <div class="space-y-8">
        <UCard>
          <template #header><h3 class="font-semibold text-lg">Status do Contrato</h3></template>
          <div class="flex items-center justify-center mb-4">
            <UBadge :label="contrato.status" :color="statusColor(contrato.status)" size="lg" />
          </div>
          
          <!-- Histórico de Status -->
          <div v-if="historicoStatus && historicoStatus.length > 0" class="mt-6 border-t pt-4">
            <h4 class="font-medium text-sm text-gray-700 mb-3">Histórico de Mudanças</h4>
            <div class="space-y-3">
              <div 
                v-for="(hist, index) in historicoStatus" 
                :key="hist.id"
                class="flex items-start gap-3 text-sm"
              >
                <div class="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-primary-500"></div>
                <div class="flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <UBadge 
                      v-if="hist.status_anterior"
                      :label="hist.status_anterior" 
                      :color="statusColor(hist.status_anterior)" 
                      size="xs"
                    />
                    <span v-if="hist.status_anterior" class="text-gray-400">→</span>
                    <UBadge 
                      :label="hist.status_novo" 
                      :color="statusColor(hist.status_novo)" 
                      size="xs"
                    />
                  </div>
                  <p v-if="hist.motivo_status" class="text-gray-600 mt-1 text-xs">
                    {{ hist.motivo_status }}
                  </p>
                  <div class="text-gray-500 text-xs mt-1">
                    {{ formatDateTime(hist.created_at) }}
                    <span v-if="hist.alterado_por_nome"> • por {{ hist.alterado_por_nome }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else-if="loadingHistorico" class="mt-4 text-center text-sm text-gray-500">
            Carregando histórico...
          </div>
        </UCard>

        <UCard>
          <template #header><h3 class="font-semibold text-lg">Cliente</h3></template>
          <NuxtLink :to="`/backoffice/clientes/${contrato.cliente_id}`" class="block hover:bg-gray-50 p-2 rounded-md">
            <p class="font-medium text-primary-500">{{ contrato.clientes?.nome_completo }}</p>
            <p class="text-sm text-gray-500">{{ contrato.clientes?.cpf }}</p>
          </NuxtLink>
        </UCard>
        
        <UCard>
          <template #header><h3 class="font-semibold text-lg">Responsáveis</h3></template>
          <div class="info-grid space-y-3">
            <div>
              <label>Consultor(a)</label>
              <p>{{ contrato.consultor?.nome_completo || 'Não informado' }}</p>
            </div>
            <div>
              <label>Loja</label>
              <p>{{ contrato.consultor?.lojas?.nome || contrato.lojas?.nome || 'Não informado' }}</p>
            </div>
            <div>
              <label>Digitador(a)</label>
              <p>{{ contrato.digitador?.nome_completo || 'Não informado' }}</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header><h3 class="font-semibold text-lg">Operação</h3></template>
          <div class="info-grid">
            <div>
              <label>Produto</label>
              <p>{{ contrato.produtos?.nome }}</p>
            </div>
            <div>
              <label>Banco</label>
              <p>{{ contrato.bancos?.nome_instituicao }}</p>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>

  <div v-else>
    <h1 class="text-primary-500 text-2xl font-bold">Contrato não encontrado.</h1>
    <NuxtLink to="/backoffice/contratos" class="text-primary-500 hover:underline mt-4 inline-block">Voltar para a lista de contratos</NuxtLink>
  </div>
</template>


<script setup>
const route = useRoute();
const supabase = useSupabaseClient();
const contratoId = route.params.id;
definePageMeta({
  middleware: 'auth',
  profiles: ['Master', 'Backoffice']
});

// --- CARREGAMENTO DOS DADOS DO CONTRATO ---
const { data: contrato, pending } = await useAsyncData(`contrato-${contratoId}`, async () => {
  const { data } = await supabase
    .from('contratos')
    .select(`
      *,
      clientes (id, nome_completo, cpf),
      produtos (nome),
      bancos (nome_instituicao),
      consultor:funcionarios!consultor_id (nome_completo, lojas(nome)),
      digitador:funcionarios!digitador_id (nome_completo),
      lojas (nome)
    `)
    .eq('id', contratoId)
    .single();
  return data;
});

// --- CARREGAMENTO DO HISTÓRICO DE STATUS ---
const loadingHistorico = ref(false);
const historicoStatus = ref([]);

const carregarHistorico = async () => {
  if (!contratoId) return;
  
  loadingHistorico.value = true;
  try {
    const { data, error } = await supabase
      .from('historico_status_contratos')
      .select(`
        *,
        alterado_por_nome:funcionarios!alterado_por(nome_completo)
      `)
      .eq('contrato_id', contratoId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Formata os dados para facilitar o uso no template
    historicoStatus.value = (data || []).map(item => ({
      ...item,
      alterado_por_nome: item.alterado_por_nome?.nome_completo || null
    }));
  } catch (error) {
    console.error('Erro ao carregar histórico de status:', error);
  } finally {
    loadingHistorico.value = false;
  }
};

// Carregar histórico quando o componente montar
onMounted(() => {
  carregarHistorico();
});

// --- FUNÇÕES DE FORMATAÇÃO ---
const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  // Adiciona timeZone UTC para evitar problemas com fuso horário
  return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const statusColor = (status) => {
  switch (status) {
    case 'Pago': return 'green';
    case 'Pendente': case 'Em Análise': return 'amber';
    case 'Reprovado': case 'Cancelado': return 'red';
    default: return 'gray';
  }
};

// --- CÁLCULO: MESES RESTANTES ---
const diffInMonths = (fromDate, toDate) => {
  try {
    if (!(fromDate instanceof Date)) fromDate = new Date(fromDate);
    if (!(toDate instanceof Date)) toDate = new Date(toDate);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) return 0;

    let months = (toDate.getFullYear() - fromDate.getFullYear()) * 12;
    months += toDate.getMonth() - fromDate.getMonth();

    // Ajuste se ainda não completou o mês corrente
    if (toDate.getDate() < fromDate.getDate()) months -= 1;

    return Math.max(0, months);
  } catch (e) {
    return 0;
  }
};

const mesesRestantes = computed(() => {
  const c = contrato?.value || contrato; // compatível com template proxy
  if (!c || !c.prazo) return null;
  const dataBase = c.data_contrato || c.data_digitacao; // usa a data disponível
  if (!dataBase) return null;
  const passados = diffInMonths(new Date(dataBase), new Date());
  const restantes = c.prazo - passados;
  return restantes < 0 ? 0 : restantes;
});

const mesesRestantesTexto = computed(() => {
  if (mesesRestantes.value === null || mesesRestantes.value === undefined) return 'N/A';
  const m = mesesRestantes.value;
  return `${m} ${m === 1 ? 'mês' : 'meses'}`;
});
</script>

<style scoped>
.info-grid div {
  @apply mb-2;
}
.info-grid label {
  @apply block text-sm font-medium text-gray-500;
}

</style>