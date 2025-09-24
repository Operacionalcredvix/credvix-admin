<template #actions-data="{ row }">
  <div>
    <header class="mb-8 flex justify-between items-center">
      <h1 class="text-3xl font-bold">Gestão de Contratos</h1>
      <UButton icon="i-heroicons-plus-circle" size="lg" to="/backoffice/contratos/novo">
        Novo Contrato
      </UButton>
      <UButton size="sm" color="gray" variant="ghost" :to="`/backoffice/contratos/${row.id}`" label="Detalhes" />
    </header>

    <UCard class="mb-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <UFormGroup label="Status" name="status">
          <USelectMenu v-model="selectedStatus" :options="statusOptions" placeholder="Todos" clearable />
        </UFormGroup>

        <UFormGroup label="Loja" name="loja">
          <USelectMenu v-model="selectedLoja" :options="lojas" option-attribute="nome" value-attribute="id"
            placeholder="Todas" clearable />
        </UFormGroup>

        <UFormGroup label="Consultor" name="consultor">
          <USelectMenu v-model="selectedConsultor" :options="consultores" option-attribute="nome_completo"
            value-attribute="id" placeholder="Todos" clearable />
        </UFormGroup>

        <UFormGroup label="Período" name="periodo" class="md:col-span-2">
          <div class="flex items-center gap-2">
            <UInput type="date" v-model="startDate" />
            <span>até</span>
            <UInput type="date" v-model="endDate" />
          </div>
        </UFormGroup>
      </div>
    </UCard>

    <UCard>
      <UTable :rows="filteredRows || []" :columns="columns" :loading="pending">
        <template #cliente-data="{ row }">
          <span>{{ row.clientes.nome_completo }}</span>
        </template>

        <template #produto-data="{ row }">
          <span>{{ row.produtos.nome }}</span>
        </template>

        <template #data_contrato-data="{ row }">
          <span>{{ new Date(row.data_contrato).toLocaleDateString('pt-BR') }}</span>
        </template>

        <template #valor_total-data="{ row }">
          <span>{{ new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.valor_total)
          }}</span>
        </template>

        <template #status-data="{ row }">
          <UBadge :label="row.status" :color="statusColor(row.status)" variant="subtle" />
        </template>

        <template #actions-data="{ row }">
          <UButton size="sm" color="gray" variant="ghost" :to="`/clientes/${row.cliente_id}`" label="Detalhes" />
        </template>
      </UTable>
    </UCard>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient();

// --- ESTADO DOS FILTROS ---
const selectedStatus = ref(null);
const selectedLoja = ref(null);
const selectedConsultor = ref(null);
const startDate = ref(null);
const endDate = ref(null);
const statusOptions = ['Em Análise', 'Aprovado', 'Reprovado', 'Pendente', 'Pago', 'Cancelado'];

// --- DEFINIÇÃO DAS COLUNAS DA TABELA ---
const columns = [
  { key: 'cliente', label: 'Cliente', sortable: true },
  { key: 'produto', label: 'Produto', sortable: true },
  { key: 'data_contrato', label: 'Data', sortable: true },
  { key: 'valor_total', label: 'Valor Total', sortable: true },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Ações' }
];

// --- CARREGAMENTO DE DADOS ---
const { data: contratos, pending } = await useAsyncData('contratos', async () => {
  const { data, error } = await supabase
    .from('contratos')
    .select(`
      id,
      data_contrato,
      valor_total,
      status,
      cliente_id,
      clientes ( nome_completo ),
      produtos ( nome )
    `)
    .order('data_contrato', { ascending: false });

  if (error) {
    console.error("Erro ao buscar contratos:", error);
    return []; // Retorna um array vazio em caso de erro
  }
  return data;
});

const { data: lojas } = await useAsyncData('lojas-contratos', async () => {
  const { data } = await supabase.from('lojas').select('id, nome').order('nome');
  return data;
});

const { data: consultores } = await useAsyncData('consultores-contratos', async () => {
  const { data } = await supabase.from('funcionarios').select('id, nome_completo').order('nome_completo');
  return data;
});


// --- LÓGICA COMPUTADA E AÇÕES ---
const filteredRows = computed(() => {
  if (!contratos.value) return [];
  let filteredData = [...contratos.value];

  if (selectedStatus.value) {
    filteredData = filteredData.filter(c => c.status === selectedStatus.value);
  }
  if (selectedLoja.value) {
    filteredData = filteredData.filter(c => c.loja_id === selectedLoja.value);
  }
  if (selectedConsultor.value) {
    filteredData = filteredData.filter(c => c.consultor_id === selectedConsultor.value);
  }
  if (startDate.value) {
    filteredData = filteredData.filter(c => new Date(c.data_contrato) >= new Date(startDate.value));
  }
  if (endDate.value) {
    filteredData = filteredData.filter(c => new Date(c.data_contrato) <= new Date(endDate.value));
  }
  return filteredData;
});

const statusColor = (status) => {
  switch (status) {
    case 'Aprovado':
    case 'Pago':
      return 'primary';
    case 'Pendente':
    case 'Em Análise':
      return 'amber';
    case 'Reprovado':
    case 'Cancelado':
      return 'red';
    default:
      return 'gray';
  }
};
</script>