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
          <USelectMenu v-model="selectedLoja" :options="lojasParaFiltro" option-attribute="nome" value-attribute="id"
            placeholder="Todas" clearable :disabled="lojaSelectDisabled" />
        </UFormGroup>

        <UFormGroup label="Consultor" name="consultor">
          <USelectMenu v-model="selectedConsultor" :options="consultoresParaFiltro" option-attribute="nome_completo"
            value-attribute="id" placeholder="Todos" clearable :disabled="consultorSelectDisabled" />
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
definePageMeta({
  middleware: 'auth',
  profiles: ['Master', 'Backoffice', 'Coordenador', 'Consultor']
});

import { ref, computed, watch, watchEffect } from 'vue';

const supabase = useSupabaseClient();
const { profile } = useProfile();
const route = useRoute();

// --- ESTADO DOS FILTROS E PAGINAÇÃO ---
const selectedStatus = ref(null);
const selectedLoja = ref(null);
const selectedConsultor = ref(null);
const startDate = ref(null);
const endDate = ref(null);
const statusOptions = ['Em Análise', 'Reprovado', 'Pendente', 'Pago', 'Cancelado'];
const page = ref(1);
const pageCount = ref(15);
const totalRows = ref(0);
const totalValorContratos = ref(0);

// --- COLUNAS DA TABELA ---
const columns = [
  { key: 'clientes.nome_completo', label: 'Cliente' }, { key: 'produtos.nome', label: 'Produto' },
  { key: 'data_contrato', label: 'Data' }, { key: 'valor_total', label: 'Valor Total' },
  { key: 'status', label: 'Status' }, { key: 'actions', label: 'Ações' }
];

// --- LÓGICA PARA FILTRO VIA URL ---
const { data: todosClientes } = await useAsyncData('todosClientes', () => supabase.from('clientes').select('id, nome_completo').order('nome_completo').then(res => res.data));
const selectedCliente = ref(route.query.cliente_id ? parseInt(route.query.cliente_id) : null);
const clienteSearchTerm = ref(route.query.cliente_id ? todosClientes.value?.find(c => c.id === selectedCliente.value)?.nome_completo : '');


// --- CARREGAMENTO DE DADOS PARA DROPDOWNS ---
const { data: todasLojas } = await useAsyncData('todasLojas', () => supabase.from('lojas').select('id, nome, regional_id').order('nome').then(res => res.data));
const { data: todosConsultores } = await useAsyncData('todosConsultores', async () => {
  const { data: perfilConsultor } = await supabase.from('perfis').select('id').eq('nome', 'Consultor').single();
  if (!perfilConsultor) return [];
  try {
    const tokenResp = await supabase.auth.getSession();
    const token = tokenResp?.data?.session?.access_token || null;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await $fetch('/api/funcionarios/search', { method: 'POST', headers, body: { perfil_ids: [perfilConsultor.id], is_active: true, limit: 1000 } });
    return (res?.data) || [];
  } catch (err) {
    console.error('Erro ao carregar consultores via endpoint:', err);
    return [];
  }
});

// --- ESTADO DA UI DOS FILTROS ---
const lojasParaFiltro = ref([]);
const lojaSelectDisabled = ref(false);
const consultorSelectDisabled = ref(false);

watchEffect(async () => {
  if (!profile.value || !todasLojas.value) return;

  const userProfileName = profile.value.perfis?.nome;
  lojaSelectDisabled.value = false;
  consultorSelectDisabled.value = false;

  switch (userProfileName) {
    case 'Coordenador': {
      const { data: lojasDaRegional } = await supabase.from('lojas').select('id').eq('regional_id', profile.value.regional_id);
      const idsLojas = lojasDaRegional?.map(l => l.id) || [];
      lojasParaFiltro.value = todasLojas.value?.filter(l => idsLojas.includes(l.id)) || [];
      break;
    }
    case 'Supervisor': {
      lojasParaFiltro.value = todasLojas.value?.filter(l => l.id === profile.value.loja_id) || [];
      selectedLoja.value = profile.value.loja_id;
      lojaSelectDisabled.value = true;
      break;
    }
    case 'Consultor': {
      lojasParaFiltro.value = [];
      selectedLoja.value = profile.value.loja_id;
      selectedConsultor.value = profile.value.id;
      lojaSelectDisabled.value = true;
      consultorSelectDisabled.value = true;
      break;
    }
    default: // Master
      lojasParaFiltro.value = todasLojas.value || [];
      break;
  }
});

const consultoresParaFiltro = computed(() => {
  if (!todosConsultores.value) return [];
  if (profile.value?.perfis?.nome === 'Consultor') return [];
  if (selectedLoja.value) {
    return todosConsultores.value.filter(c => c.loja_id === selectedLoja.value);
  }
  if (profile.value?.perfis?.nome === 'Coordenador') {
    const idsLojas = lojasParaFiltro.value.map(l => l.id);
    return todosConsultores.value.filter(c => idsLojas.includes(c.loja_id));
  }
  return todosConsultores.value;
});

watch(selectedLoja, (newLoja, oldLoja) => {
  if (newLoja !== oldLoja && !consultorSelectDisabled.value) {
    selectedConsultor.value = null;
  }
});

// --- LÓGICA DE BUSCA DE DADOS (USANDO ENDPOINT SERVER PARA RESPEITAR RLS E RBAC) ---
const { data: contratos, pending, refresh } = useAsyncData(
  'contratos',
  async () => {
    // Espera o perfil carregar
    if (!profile.value) return [];

    try {
      const tokenResp = await supabase.auth.getSession();
      const token = tokenResp?.data?.session?.access_token || null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const body = {
        page: page.value,
        pageSize: pageCount.value,
        status: selectedStatus.value,
        loja_id: selectedLoja.value,
        cliente_id: selectedCliente.value,
        consultor_id: selectedConsultor.value,
        startDate: startDate.value,
        endDate: endDate.value
      };

  const res = await $fetch('/api/contratos/search', { method: 'POST', headers, body });
      if (!res || res.success === false) {
        console.error('Erro ao buscar contratos (server):', res?.error || 'Resposta inválida');
        totalRows.value = 0;
        totalValorContratos.value = 0;
        return [];
      }

      totalRows.value = res.count || 0;
      totalValorContratos.value = res.totalValor || 0;
      return res.data || [];
    } catch (err) {
      console.error('Exceção ao buscar contratos (server):', err);
      totalRows.value = 0;
      totalValorContratos.value = 0;
      return [];
    }
  }, {
  watch: [page, selectedStatus, selectedLoja, selectedConsultor, selectedCliente, startDate, endDate, profile]
}
);

// O UTable agora usa 'contratos' diretamente, pois a filtragem é no servidor.
// 'filteredRows' não é mais necessário para a tabela principal.
const filteredRows = computed(() => contratos.value || []);

// Função para limpar filtros
const limparFiltros = () => {
  selectedStatus.value = null;
  selectedLoja.value = null;
  selectedConsultor.value = null;
  startDate.value = null;
  endDate.value = null;
  page.value = 1;
};

// Funções de formatação
const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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