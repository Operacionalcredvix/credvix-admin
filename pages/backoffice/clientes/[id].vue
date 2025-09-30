<template>
  <div v-if="pending">
    <p>A carregar dados do cliente...</p>
  </div>
  <div v-else-if="cliente">
    <header class="mb-6 flex justify-between items-center">
      <div class="flex items-center gap-2 text-sm text-gray-500">
        <NuxtLink to="/backoffice/clientes" class="text-primary-500 hover:underline">Gestão de Clientes</NuxtLink>
        <span class="mx-2">/</span>
        <span class="text-gray-600">Detalhes do Cliente</span>
      </div>
      <UButton icon="i-heroicons-arrow-left-circle" size="md" color="gray" to="/backoffice/Contratos">
        Voltar para a Lista
      </UButton>
    </header>
    
    <UCard class="mb-8">
      <div class="space-y-6">
        <div>
          <h2 class="text-2xl font-bold text-primary-500">Detalhes do Cliente</h2>
          <p class="text-gray-500">Informações de contato e financeiras do cliente.</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 border-t pt-6">
          <div><strong>Nome Completo:</strong><p>{{ cliente.nome_completo }}</p></div>
          <div><strong>CPF:</strong><p>{{ cliente.cpf }}</p></div>
          <div><strong>Email:</strong><p>{{ cliente.email || 'Não informado' }}</p></div>
          <div><strong>Telefone 1:</strong><p>{{ cliente.telefone || 'Não informado' }}</p></div>
          <div><strong>Telefone 2:</strong><p>{{ cliente.telefone_2 || 'Não informado' }}</p></div>
          <div class="md:col-span-2"><strong>Endereço:</strong><p>{{ endereco_completo }}</p></div>
        </div>
      </div>
    </UCard>

    <div>
      <div class="border-t pt-6">
        <h3 class="text-xl font-semibold text-gray-800">Histórico de Contratos</h3>
      </div>
      <div v-if="contratosPorLoja.length > 0" class="space-y-6 mt-4">
        <UCard v-for="loja in contratosPorLoja" :key="loja.loja_id">
          <template #header>
            <p class="font-semibold">Loja de Origem do Contrato: {{ loja.nome_loja }}</p>
          </template>
          <UTable :rows="loja.contratos" :columns="contratosColumns">
            <template #data_contrato-data="{ row }">
              <span>{{ new Date(row.data_contrato).toLocaleDateString('pt-BR') }}</span>
            </template>
            <template #valor_total-data="{ row }">
              <span>{{ new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.valor_total) }}</span>
            </template>
            <template #status-data="{ row }">
              <UBadge :label="row.status" :color="statusColor(row.status)" variant="subtle" />
            </template>
          </UTable>
        </UCard>
      </div>
      <p v-else class="text-gray-500 mt-4">Nenhum contrato encontrado para este cliente.</p>
    </div>
  </div>

  <div v-else>
    <h1 class="text-2xl font-bold">Cliente não encontrado.</h1>
    <NuxtLink to="/backoffice/clientes" class="text-primary-500 hover:underline mt-4 inline-block">Voltar para a lista de clientes</NuxtLink>
  </div>
</template>

<script setup>
const route = useRoute();
const supabase = useSupabaseClient();
const clienteId = route.params.id;

// --- CARREGAMENTO DE DADOS DO CLIENTE ESPECÍFICO ---
const { data: cliente, pending } = await useAsyncData(`cliente-${clienteId}`, async () => {
  const { data } = await supabase
    .from('clientes')
    .select(`
      *,
      contratos(*, produtos(nome), lojas(nome))
    `)
    .eq('id', clienteId)
    .single();
  return data;
});

// --- DEFINIÇÃO DAS COLUNAS DA TABELA DE CONTRATOS ---
const contratosColumns = [
  { key: 'numero_contrato', label: 'Nº Contrato' },
  { key: 'produtos.nome', label: 'Produto' },
  { key: 'data_contrato', label: 'Data', sortable: true },
  { key: 'valor_total', label: 'Valor Total', sortable: true },
  { key: 'status', label: 'Status' }
];

// --- LÓGICA COMPUTADA ---
// Agrupa os contratos por loja
const contratosPorLoja = computed(() => {
  if (!cliente.value?.contratos) return [];
  
  const agrupado = cliente.value.contratos.reduce((acc, contrato) => {
    const lojaId = contrato.loja_id;
    if (!acc[lojaId]) {
      acc[lojaId] = {
        loja_id: lojaId,
        nome_loja: contrato.lojas?.nome || 'Loja não identificada',
        contratos: []
      };
    }
    acc[lojaId].contratos.push(contrato);
    return acc;
  }, {});

  return Object.values(agrupado);
});

// Concatena o endereço para exibição
const endereco_completo = computed(() => {
    if (!cliente.value) return 'Não informado';
    const parts = [
        cliente.value.endereco,
        cliente.value.numero_endereco,
        cliente.value.complemento_endereco,
        cliente.value.bairro,
        cliente.value.cidade,
        cliente.value.estado,
        cliente.value.cep
    ].filter(Boolean); // Remove partes vazias
    return parts.join(', ');
});

// Função para dar cor aos status dos contratos
const statusColor = (status) => {
  switch (status) {
    case 'Aprovado': case 'Pago': return 'primary';
    case 'Pendente': case 'Em Análise': return 'amber';
    case 'Reprovado': case 'Cancelado': return 'red';
    default: return 'gray';
  }
};
</script>

<style scoped>
strong {
  @apply block text-sm font-medium text-gray-500;
}

</style>