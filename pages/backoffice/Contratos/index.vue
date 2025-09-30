<template>
  <div>
    <header class="mb-8 flex justify-between items-center">
      <h1 class="text-primary-500 text-3xl font-bold">Gestão de Contratos</h1>
      <UButton icon="i-heroicons-plus-circle" size="lg" to="/backoffice/contratos/novo">
        Novo Contrato
      </UButton>
    </header>

    <UCard class="mb-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
        <UFormGroup label="Status" name="status">
          <USelectMenu v-model="selectedStatus" :options="statusOptions" placeholder="Todos" clearable />
        </UFormGroup>

        <UFormGroup label="Loja" name="loja">
          <USelectMenu v-model="selectedLoja" :options="lojas" option-attribute="nome" value-attribute="id"
            placeholder="Todas" clearable />
        </UFormGroup>

        <UFormGroup label="Consultor" name="consultor">
          <USelectMenu v-model="selectedConsultor" :options="consultoresFiltrados" option-attribute="nome_completo"
            value-attribute="id" placeholder="Todos" :disabled="!selectedLoja" clearable />
        </UFormGroup>

        <UFormGroup label="Período" name="periodo" class="md:col-span-2">
          <div class="flex items-center gap-2">
            <UInput type="date" v-model="startDate" />
            <span>até</span>
            <UInput type="date" v-model="endDate" />
          </div>
        </UFormGroup>

        <div class="flex items-end md:col-span-1">
          <UButton @click="limparFiltros" label="Limpar Filtros" color="gray" variant="ghost"
            icon="i-heroicons-x-circle" class="w-full" />
        </div>
      </div>
    </UCard>

    <UCard>
      <UTable :rows="contratos || []" :columns="columns" :loading="pending">
        <template #clientes.nome_completo-data="{ row }">
          <span v-if="row.clientes">{{ row.clientes.nome_completo }}</span>
          <span v-else class="text-red-500 text-xs">Cliente não encontrado</span>
        </template>

        <template #produtos.nome-data="{ row }">
          <span v-if="row.produtos">{{ row.produtos.nome }}</span>
          <span v-else class="text-red-500 text-xs">Produto não encontrado</span>
        </template>

        <template #data_contrato-data="{ row }">
          <span>{{ new Date(row.data_contrato).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) }}</span>
        </template>

        <template #valor_total-data="{ row }">
          <span>{{ formatCurrency(row.valor_total) }}</span>
        </template>

        <template #status-data="{ row }">
          <UBadge :label="row.status" :color="statusColor(row.status)" variant="subtle" />
        </template>

        <template #actions-data="{ row }">
          <div class="flex items-center gap-2">
            <UButton v-if="row.status === 'Em Análise' || row.status === 'Pendente'" icon="i-heroicons-pencil" size="sm"
              color="gray" variant="ghost" :to="`/backoffice/contratos/editar/${row.id}`" label="Editar" />
            <UButton size="sm" color="gray" variant="ghost" :to="`/backoffice/contratos/${row.id}`"
              label="Ver Contrato" />
            <UButton size="sm" color="gray" variant="ghost" :to="`/backoffice/clientes/${row.cliente_id}`"
              label="Ver Cliente" />
          </div>
        </template>
      </UTable>

      <template #footer>
        <div class="flex items-center justify-between">
          <p class="text-lg font-bold pr-4">
            Valor Total dos Contratos Filtrados:
            <span class="text-primary-500">{{ formatCurrency(totalValorContratos) }}</span>
          </p>
          <UPagination v-model="page" :page-count="pageCount" :total="totalRows" />
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
const supabase = useSupabaseClient();

// --- ESTADO DOS FILTROS ---
const selectedStatus = ref(null);
const selectedLoja = ref(null);
const selectedConsultor = ref(null);
const startDate = ref(null);
const endDate = ref(null);
const statusOptions = ['Em Análise', 'Aprovado', 'Reprovado', 'Pendente', 'Pago', 'Cancelado'];

// --- ESTADO DA PAGINAÇÃO ---
const page = ref(1);
const pageCount = ref(15);
const totalRows = ref(0);
const totalValorContratos = ref(0);

// --- DEFINIÇÃO DAS COLUNAS DA TABELA ---
const columns = [
  { key: 'clientes.nome_completo', label: 'Cliente', sortable: true },
  { key: 'produtos.nome', label: 'Produto', sortable: true },
  { key: 'data_contrato', label: 'Data', sortable: true },
  { key: 'valor_total', label: 'Valor Total', sortable: true },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Ações' }
];

// --- CARREGAMENTO DE DADOS (AGORA REATIVO AOS FILTROS E PAGINAÇÃO) ---
const { data: contratos, pending } = useAsyncData(
  'contratos',
  async () => {
    const from = (page.value - 1) * pageCount.value;
    const to = from + pageCount.value - 1;

    let query = supabase
      .from('contratos')
      .select(`
        id, data_contrato, valor_total, status, cliente_id, loja_id, consultor_id,
        clientes ( nome_completo ),
        produtos ( nome )
      `, { count: 'exact' });

    // Aplica os filtros na query
    if (selectedStatus.value) query = query.eq('status', selectedStatus.value);
    if (selectedLoja.value) query = query.eq('loja_id', selectedLoja.value);
    if (selectedConsultor.value) query = query.eq('consultor_id', selectedConsultor.value);
    if (startDate.value) query = query.gte('data_contrato', startDate.value);
    if (endDate.value) query = query.lte('data_contrato', endDate.value);

    // Ordena e aplica a paginação
    const { data, error, count } = await query
      .order('data_contrato', { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Erro ao buscar contratos:", error);
      return [];
    }

    totalRows.value = count; // Atualiza o total de linhas para a paginação

    // Query separada para calcular o valor total de TODOS os contratos filtrados
    let totalQuery = supabase.from('contratos').select('valor_total', { count: 'exact', head: false });
    if (selectedStatus.value) totalQuery = totalQuery.eq('status', selectedStatus.value);
    if (selectedLoja.value) totalQuery = totalQuery.eq('loja_id', selectedLoja.value);
    if (selectedConsultor.value) totalQuery = totalQuery.eq('consultor_id', selectedConsultor.value);
    if (startDate.value) totalQuery = totalQuery.gte('data_contrato', startDate.value);
    if (endDate.value) totalQuery = totalQuery.lte('data_contrato', endDate.value);

    const { data: totalData, error: totalError } = await totalQuery;
    if (!totalError) {
      totalValorContratos.value = totalData.reduce((acc, item) => acc + (item.valor_total || 0), 0);
    }
    
    return data;
  },
  { watch: [page, selectedStatus, selectedLoja, selectedConsultor, startDate, endDate] }
);


// --- CARREGAMENTO DE DADOS PARA DROPDOWNS ---
const { data: lojas } = await useAsyncData('lojas-contratos', async () => {
  const { data } = await supabase.from('lojas').select('id, nome').order('nome');
  return data;
});

const { data: todosConsultores } = await useAsyncData('consultores-contratos', async () => {
  const { data } = await supabase.from('funcionarios').select('id, nome_completo, loja_id').order('nome_completo');
  return data || [];
});

// --- LÓGICA COMPUTADA E AÇÕES ---
const consultoresFiltrados = computed(() => {
  if (!selectedLoja.value) return todosConsultores.value;
  return todosConsultores.value.filter(c => c.loja_id === selectedLoja.value);
});

watch(selectedLoja, () => {
  selectedConsultor.value = null;
});

const limparFiltros = () => {
  selectedStatus.value = null;
  selectedLoja.value = null;
  selectedConsultor.value = null;
  startDate.value = null;
  endDate.value = null;
  page.value = 1; // Volta para a primeira página
};

// --- FUNÇÕES DE FORMATAÇÃO ---
const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const statusColor = (status) => {
  switch (status) {
    case 'Aprovado': case 'Pago': return 'primary';
    case 'Pendente': case 'Em Análise': return 'amber';
    case 'Reprovado': case 'Cancelado': return 'red';
    default: return 'gray';
  }
};
</script>