<template>
  <div>
    <header class="mb-8 flex justify-between items-center">
      <h1 class="text-3xl font-bold">Gestão de Clientes</h1>
      </header>

    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <h2 class="font-semibold text-lg">Clientes Registados</h2>
          <UInput v-model="searchTerm" placeholder="Filtrar por nome ou CPF..." icon="i-heroicons-magnifying-glass" />
        </div>
      </template>

      <UTable :rows="filteredRows || []" :columns="columns" :loading="pending">
        <template #actions-data="{ row }">
          <UButton 
            icon="i-heroicons-eye" 
            size="sm" 
            color="gray" 
            variant="ghost" 
            :to="`/clientes/${row.id}`" 
            label="Ver Detalhes"
          />
        </template>
      </UTable>
    </UCard>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient();
const searchTerm = ref('');

// --- DEFINIÇÃO DAS COLUNAS DA TABELA ---
const columns = [
  { key: 'nome_completo', label: 'Nome Completo', sortable: true },
  { key: 'cpf', label: 'CPF', sortable: true },
  { key: 'funcionarios.nome_completo', label: 'Consultor Responsável' },
  { key: 'lojas.nome', label: 'Loja de Origem' },
  { key: 'actions', label: 'Ações' }
];

// --- CARREGAMENTO DE DADOS ---
const { data: clientes, pending } = await useAsyncData('clientes', async () => {
  const { data } = await supabase
    .from('clientes')
    .select('*, funcionarios(nome_completo), lojas(nome)')
    .order('nome_completo');
  return data;
});

// --- LÓGICA DE FILTRO ---
const filteredRows = computed(() => {
  if (!searchTerm.value) {
    return clientes.value;
  }
  return clientes.value.filter((cliente) => {
    const searchTermLower = searchTerm.value.toLowerCase();
    return (
      cliente.nome_completo.toLowerCase().includes(searchTermLower) ||
      cliente.cpf.toLowerCase().includes(searchTermLower)
    );
  });
});
</script>