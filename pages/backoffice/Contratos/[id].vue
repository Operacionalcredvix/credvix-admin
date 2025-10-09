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
              <label>Tabela</label>
              <p>{{ contrato.tabela }}</p>
            </div>
            <div>
              <label>Data da digitação</label>
              <p>{{ formatDate(contrato.data_digitacao) }}</p>
            </div>
            <div>
              <label>Data de Pagamento</label>
              <p>{{ formatDate(contrato.data_pagamento) }}</p>
            </div>
            <div>
              <label>Número beneficio</label>
              <p>{{ contrato.numero_beneficio }}</p>
            </div>
            <div>
              <label>Espécie beneficio</label>
              <p>{{ contrato.especie_beneficio }}</p>
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
          <div class="flex items-center justify-center">
            <UBadge :label="contrato.status" :color="statusColor(contrato.status)" size="lg" />
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
              <p>{{ contrato.loja?.nome_completo || 'Não informado' }}</p>
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
      consultor:funcionarios!consultor_id (nome_completo),
      digitador:funcionarios!digitador_id (nome_completo)
    `)
    .eq('id', contratoId)
    .single();
  return data;
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

const statusColor = (status) => {
  switch (status) {
    case 'Pago': return 'green';
    case 'Pendente': case 'Em Análise': return 'amber';
    case 'Reprovado': case 'Cancelado': return 'red';
    default: return 'gray';
  }
};
</script>

<style scoped>
.info-grid div {
  @apply mb-2;
}
.info-grid label {
  @apply block text-sm font-medium text-gray-500;
}

</style>