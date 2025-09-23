<template>
  <div v-if="pending">
    <p>A carregar dados do cliente...</p>
  </div>
  <div v-else-if="cliente">
    <div class="mb-6">
      <NuxtLink to="/clientes" class="text-primary-500 hover:underline">CRM</NuxtLink>
      <span class="mx-2 text-gray-400">/</span>
      <span class="text-gray-600">Detalhes do Cliente</span>
    </div>

    <UCard>
      <div class="space-y-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Detalhes do Cliente</h2>
          <p class="text-gray-500">Informações de contato e financeiras do cliente.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 border-t pt-6">
          <div><strong>Nome Completo:</strong><p>{{ cliente.nome_completo }}</p></div>
          <div><strong>CPF:</strong><p>{{ cliente.cpf }}</p></div>
          <div><strong>Email:</strong><p>{{ cliente.email || 'Não informado' }}</p></div>
          <div><strong>Telefone:</strong><p>{{ cliente.telefone || 'Não informado' }}</p></div>
          <div class="md:col-span-2"><strong>Endereço:</strong><p>{{ cliente.endereco || 'Não informado' }}</p></div>
        </div>
      </div>

      <div class="mt-8">
        <div class="flex justify-between items-center border-t pt-6">
          <h3 class="text-xl font-semibold text-gray-800">Contas Bancárias</h3>
          <UButton icon="i-heroicons-plus" label="Adicionar Nova Conta" color="gray" />
        </div>
        <UTable :rows="cliente.clientes_contas_bancarias || []" :columns="contasColumns" class="mt-4" />
      </div>

      <div class="mt-8">
        <div class="flex justify-between items-center border-t pt-6">
          <h3 class="text-xl font-semibold text-gray-800">Lista de Contratos</h3>
        </div>
        <UTable :rows="cliente.contratos || []" :columns="contratosColumns" class="mt-4">
          <template #status-data="{ row }">
            <UBadge :label="row.status" :color="statusColor(row.status)" variant="subtle" />
          </template>
        </UTable>
      </div>
    </UCard>
  </div>
  <div v-else>
    <h1 class="text-2xl font-bold">Cliente não encontrado.</h1>
    <NuxtLink to="/clientes" class="text-primary-500 hover:underline mt-4 inline-block">Voltar para a lista de clientes</NuxtLink>
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
      clientes_contas_bancarias(*, bancos(nome_instituicao)),
      contratos(*, produtos(nome))
    `)
    .eq('id', clienteId)
    .single();
  return data;
});

// --- DEFINIÇÃO DAS COLUNAS DAS TABELAS INTERNAS ---
const contasColumns = [
  { key: 'bancos.nome_instituicao', label: 'Banco' },
  { key: 'conta', label: 'Número da Conta' },
  { key: 'tipo', label: 'Tipo' }
];

const contratosColumns = [
  { key: 'produtos.nome', label: 'Produto' },
  { key: 'data', label: 'Data', sortable: true },
  { key: 'valor_total', label: 'Valor Total', sortable: true },
  { key: 'status', label: 'Status' }
];

// Função para dar cor aos status dos contratos
const statusColor = (status) => {
  switch (status) {
    case 'Aprovado': return 'primary';
    case 'Pendente': return 'amber';
    case 'Cancelado': return 'red';
    default: return 'gray';
  }
};
</script>

<style scoped>
strong {
  @apply block text-sm font-medium text-gray-500;
}
p {
  @apply text-gray-900;
}
</style>