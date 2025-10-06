<template>
  <div>
    <header class="mb-8">
      <h1 class="text-primary-500 text-3xl font-bold">Relatório de Vendas Externas</h1>
      <p class="text-gray-500 mt-1">Visualize os dados importados de produtos externos.</p>
    </header>

    <!-- Filtros -->
    <UCard class="mb-8">
      <div class="flex items-end gap-4">
        <UFormGroup label="Período" name="period" class="w-48">
          <UInput type="month" v-model="selectedPeriod" />
        </UFormGroup>
        <UFormGroup label="Tipo de Produto" name="productType" class="w-64">
          <USelectMenu v-model="selectedProduct" :options="productOptions" placeholder="Todos os produtos" clearable />
        </UFormGroup>
        <UFormGroup label="Coordenador" name="coordenador" class="w-64">
          <USelectMenu v-model="selectedCoordenador" :options="coordenadores" value-attribute="id" option-attribute="nome_completo" placeholder="Todos os coordenadores" clearable />
        </UFormGroup>
        <UFormGroup label="Supervisor" name="supervisor" class="w-64">
          <USelectMenu v-model="selectedSupervisor" :options="supervisores" value-attribute="id" option-attribute="nome_completo" placeholder="Todos os supervisores" clearable />
        </UFormGroup>
        <UFormGroup label="Consultor" name="consultor" class="w-64">
          <USelectMenu v-model="selectedConsultor" :options="consultors" value-attribute="id" option-attribute="nome_completo" placeholder="Todos os consultores" clearable />
        </UFormGroup>
        <div class="self-end">
          <UButton @click="limparFiltros" label="Limpar Filtros" color="gray" variant="ghost" icon="i-heroicons-x-circle" />
        </div>
      </div>
    </UCard>

    <!-- Tabela de Dados -->
    <UCard>
      <UTable 
        :rows="sales" 
        :columns="columns" 
        :loading="pending"
        :empty-state="{ icon: 'i-heroicons-circle-stack', label: 'Nenhum registo encontrado.' }"
      >
        <template #loja-data="{ row }">
          <span>{{ row.lojas?.nome || 'N/A' }}</span>
        </template>
        <template #consultor-data="{ row }">
          <span>{{ row.consultor?.nome_completo || 'N/A' }}</span>
        </template>
        <template #supervisor-data="{ row }">
          <span>{{ row.supervisor?.nome_completo || 'N/A' }}</span>
        </template>
        <template #coordenador-data="{ row }">
          <span>{{ row.coordenador?.nome_completo || 'N/A' }}</span>
        </template>
        <template #data_venda-data="{ row }">
          <span>{{ new Date(row.data_venda).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) }}</span>
        </template>
      </UTable>

      <template #footer>
        <div class="flex justify-end">
          <UPagination v-model="page" :page-count="pageCount" :total="totalSales" />
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

definePageMeta({
  middleware: 'auth',
  profiles: ['Master']
});

const supabase = useSupabaseClient();
const page = ref(1);
const pageCount = ref(20);
const totalSales = ref(0);

const selectedPeriod = ref(new Date().toISOString().slice(0, 7));
const selectedProduct = ref(null);
const productOptions = ['bmg_med', 'seguro_familiar'];
const selectedCoordenador = ref(null);
const selectedSupervisor = ref(null);
const selectedConsultor = ref(null);

const limparFiltros = () => {
  selectedPeriod.value = new Date().toISOString().slice(0, 7);
  selectedProduct.value = null;
  selectedCoordenador.value = null;
  selectedSupervisor.value = null;
  selectedConsultor.value = null;
  page.value = 1;
};

// --- CARREGAMENTO DE DADOS PARA FILTROS ---
const { data: coordenadores } = useAsyncData('coordenadores-list', async () => {
  const { data: perfil } = await supabase.from('perfis').select('id').eq('nome', 'Coordenador').single();
  if (!perfil) return [];
  const { data } = await supabase.from('funcionarios').select('id, nome_completo').eq('perfil_id', perfil.id).order('nome_completo');
  return data || [];
});

const { data: supervisores } = useAsyncData('supervisores-list', async () => {
  const { data: perfil } = await supabase.from('perfis').select('id').eq('nome', 'Supervisor').single();
  if (!perfil) return [];
  const { data } = await supabase.from('funcionarios').select('id, nome_completo').eq('perfil_id', perfil.id).order('nome_completo');
  return data || [];
});

const { data: consultors } = useAsyncData('consultores-list', async () => {
  const { data: perfil } = await supabase.from('perfis').select('id').eq('nome', 'Consultor').single();
  if (!perfil) return [];
  const { data } = await supabase.from('funcionarios').select('id, nome_completo').eq('perfil_id', perfil.id).order('nome_completo');
  return data || [];
});

const columns = [
  { key: 'adesao', label: 'Adesão' },
  { key: 'tipo_produto', label: 'Produto' },
  { key: 'data_venda', label: 'Data da Venda' },
  { key: 'quantidade', label: 'Qtd' },
  { key: 'loja', label: 'Loja' },
  { key: 'consultor', label: 'Consultor' },
  { key: 'supervisor', label: 'Supervisor' },
  { key: 'coordenador', label: 'Coordenador' },
];

const { data: sales, pending } = useAsyncData('vendas-externas-report', async () => {
  const from = (page.value - 1) * pageCount.value;
  const to = from + pageCount.value - 1;

  const firstDayOfMonth = `${selectedPeriod.value}-01`;
  const lastDayOfMonth = new Date(new Date(firstDayOfMonth).getFullYear(), new Date(firstDayOfMonth).getMonth() + 1, 0).toISOString().split('T')[0];

  let query = supabase
    .from('vendas_externas')
    .select(`
      id, adesao, tipo_produto, data_venda, quantidade,
      lojas!inner(nome),
      consultor:consultor_id(nome_completo),
      supervisor:supervisor_id(nome_completo),
      coordenador:coordenador_id(nome_completo)
    `, { count: 'exact' })
    .gte('data_venda', firstDayOfMonth)
    .lte('data_venda', lastDayOfMonth);

  if (selectedProduct.value) {
    query = query.eq('tipo_produto', selectedProduct.value);
  }

  if (selectedCoordenador.value) {
    query = query.eq('coordenador_id', selectedCoordenador.value);
  }

  if (selectedSupervisor.value) {
    query = query.eq('supervisor_id', selectedSupervisor.value);
  }

  if (selectedConsultor.value) {
    query = query.eq('consultor_id', selectedConsultor.value);
  }
  const { data, count, error } = await query.order('data_venda', { ascending: false }).range(from, to);
  if (error) throw error;

  totalSales.value = count;
  return data;
}, { watch: [page, selectedPeriod, selectedProduct, selectedCoordenador, selectedSupervisor, selectedConsultor] });
</script>