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

const supabase = useSupabaseClient();
const page = ref(1);
const pageCount = ref(20);
const totalSales = ref(0);

const selectedPeriod = ref(new Date().toISOString().slice(0, 7));
const selectedProduct = ref(null);
const productOptions = ['bmg_med', 'seguro_familiar'];

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
      lojas (nome),
      consultor:funcionarios!vendas_externas_consultor_id_fkey (nome_completo),
      supervisor:funcionarios!vendas_externas_supervisor_id_fkey (nome_completo),
      coordenador:funcionarios!vendas_externas_coordenador_id_fkey (nome_completo)
    `, { count: 'exact' })
    .gte('data_venda', firstDayOfMonth)
    .lte('data_venda', lastDayOfMonth);

  if (selectedProduct.value) {
    query = query.eq('tipo_produto', selectedProduct.value);
  }

  const { data, count, error } = await query.order('data_venda', { ascending: false }).range(from, to);
  if (error) throw error;

  totalSales.value = count;
  return data;
}, { watch: [page, selectedPeriod, selectedProduct] });
</script>