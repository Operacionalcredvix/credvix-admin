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
          <USelectMenu 
            v-model="selectedConsultor" 
            :options="consultoresFiltrados" 
            option-attribute="nome_completo"
            value-attribute="id" 
            placeholder="Selecione uma loja" 
            :disabled="!selectedLoja"
            clearable 
          />
        </UFormGroup>

        <UFormGroup label="Período" name="periodo" class="md:col-span-2">
          <div class="flex items-center gap-2">
            <UInput type="date" v-model="startDate" />
            <span>até</span>
            <UInput type="date" v-model="endDate" />
          </div>
        </UFormGroup>

        <div class="flex items-end md:col-span-1">
          <UButton @click="limparFiltros" label="Limpar Filtros" color="gray" variant="ghost" icon="i-heroicons-x-circle" class="w-full" />
        </div>
      </div>
    </UCard>

    <UCard>
      <UTable :rows="filteredRows || []" :columns="columns" :loading="pending">
        <template #clientes.nome_completo-data="{ row }">
          <span>{{ row.clientes.nome_completo }}</span>
        </template>

        <template #produtos.nome-data="{ row }">
          <span>{{ row.produtos.nome }}</span>
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
             <UButton size="sm" color="gray" variant="ghost" :to="`/backoffice/contratos/${row.id}`" label="Ver Contrato" />
             <UButton size="sm" color="gray" variant="ghost" :to="`/backoffice/clientes/${row.cliente_id}`" label="Ver Cliente" />
          </div>
        </template>
      </UTable>

      <template #footer>
        <div class="flex justify-end text-lg font-bold pr-4">
          <p>Valor Total dos Contratos Filtrados: 
            <span class="text-primary-500">{{ formatCurrency(totalValorContratos) }}</span>
          </p>
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

// --- DEFINIÇÃO DAS COLUNAS DA TABELA ---
const columns = [
  { key: 'clientes.nome_completo', label: 'Cliente', sortable: true },
  { key: 'produtos.nome', label: 'Produto', sortable: true },
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
      id, data_contrato, valor_total, status, cliente_id,
      loja_id, consultor_id, 
      clientes ( nome_completo ),
      produtos ( nome )
    `)
    .order('data_contrato', { ascending: false });

  if (error) {
    console.error("Erro ao buscar contratos:", error);
    return [];
  }
  return data;
});

const { data: lojas } = await useAsyncData('lojas-contratos', async () => {
  const { data } = await supabase.from('lojas').select('id, nome').order('nome');
  return data;
});

// Busca TODOS os consultores uma vez e guarda
const { data: todosConsultores } = await useAsyncData('consultores-contratos', async () => {
  const { data } = await supabase.from('funcionarios').select('id, nome_completo, loja_id').order('nome_completo');
  return data || [];
});

// --- LÓGICA COMPUTADA E AÇÕES ---

// Filtra a lista de consultores com base na loja selecionada
const consultoresFiltrados = computed(() => {
  if (!selectedLoja.value) {
    return [];
  }
  return todosConsultores.value.filter(c => c.loja_id === selectedLoja.value);
});

// Observa a seleção de loja para limpar o consultor
watch(selectedLoja, (newLoja) => {
  if (!newLoja) {
    selectedConsultor.value = null;
  }
});

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
    const start = new Date(startDate.value);
    start.setUTCHours(0, 0, 0, 0);
    filteredData = filteredData.filter(c => new Date(c.data_contrato) >= start);
  }
  if (endDate.value) {
    const end = new Date(endDate.value);
    end.setUTCHours(23, 59, 59, 999);
    filteredData = filteredData.filter(c => new Date(c.data_contrato) <= end);
  }
  return filteredData;
});

const totalValorContratos = computed(() => {
  if (!filteredRows.value) return 0;
  return filteredRows.value.reduce((acc, contrato) => acc + (contrato.valor_total || 0), 0);
});

// Função para limpar todos os filtros
const limparFiltros = () => {
  selectedStatus.value = null;
  selectedLoja.value = null;
  selectedConsultor.value = null;
  startDate.value = null;
  endDate.value = null;
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