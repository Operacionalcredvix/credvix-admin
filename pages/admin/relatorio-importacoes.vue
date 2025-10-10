<template>
  <div>
    <header class="mb-8">
      <h1 class="text-primary-500 text-3xl font-bold">Relatório de Vendas Externas</h1>
      <p class="text-gray-500 mt-1">Visualize os dados importados de produtos externos.</p>
    </header>

    <!-- Filtros -->
    <UCard class="mb-8">
      <div class="flex flex-wrap items-end gap-4">
        <UFormGroup label="Período" name="period" class="w-48">
          <UInput type="month" v-model="selectedPeriod" />
        </UFormGroup>
        <UFormGroup label="Tipo de Produto" name="productType" class="w-64">
          <USelectMenu v-model="selectedProduct" :options="productOptions" placeholder="Todos os produtos" clearable />
        </UFormGroup>
        <UFormGroup label="Regional" name="regional" class="w-64">
          <USelectMenu v-model="selectedRegional" :options="regionais" value-attribute="id" option-attribute="nome_regional" placeholder="Todas as regionais" clearable />
        </UFormGroup>
        <div class="pt-6">
          <UButton @click="limparFiltros" label="Limpar Filtros" color="gray" variant="ghost" icon="i-heroicons-x-circle" />
        </div>
      </div>
    </UCard>

    <!-- Resultados Hierárquicos -->
    <div v-if="pending" class="text-center py-10">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-gray-500" />
      <p class="text-gray-500 mt-2">A carregar relatório...</p>
    </div>
    <div v-else-if="groupedSales.length === 0" class="text-center py-10">
      <UIcon name="i-heroicons-circle-stack" class="text-4xl text-gray-400" />
      <p class="text-gray-500 mt-2">Nenhum registo encontrado para os filtros selecionados.</p>
    </div>
    <div v-else class="space-y-4">
      <UAccordion :items="groupedSales" multiple>
        <template #default="{ item: regional, index, open }">
          <UCard :ui="{ header: { padding: 'px-4 py-3' } }">
            <template #header>
              <div class="flex justify-between items-center w-full cursor-pointer">
                <div class="flex items-center gap-3">
                  <UIcon name="i-heroicons-map" class="text-xl text-primary-500" />
                  <span class="font-bold text-lg">{{ regional.label }}</span>
                </div>
                <div class="flex items-center gap-6 text-right">
                  <div>
                    <p class="text-xs text-gray-500">Total BMG MED</p>
                    <p class="font-semibold">{{ regional.totalBmgMed }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500">Total Seguro Familiar</p>
                    <p class="font-semibold">{{ regional.totalSeguroFamiliar }}</p>
                  </div>
                  <UIcon name="i-heroicons-chevron-right-20-solid" class="w-5 h-5 ms-auto transform transition-transform duration-200" :class="[open && 'rotate-90']" />
                </div>
              </div>
            </template>
          </UCard>
        </template>

        <template #item="{ item: regional }">
          <div class="p-4 bg-gray-50 dark:bg-gray-800/50">
            <UAccordion :items="regional.lojas" multiple>
              <template #default="{ item: loja, index, open }">
                 <UCard :ui="{ header: { padding: 'px-4 py-3' } }" class="mb-2">
                    <template #header>
                      <div class="flex justify-between items-center w-full cursor-pointer">
                        <div class="flex items-center gap-3">
                          <UIcon name="i-heroicons-building-storefront" class="text-lg text-gray-600 dark:text-gray-300" />
                          <span class="font-semibold">{{ loja.label }}</span>
                        </div>
                        <div class="flex items-center gap-4 text-right">
                          <div><p class="text-xs text-gray-500">BMG</p><p class="font-semibold">{{ loja.totalBmgMed }}</p></div>
                          <div><p class="text-xs text-gray-500">Seg. Fam.</p><p class="font-semibold">{{ loja.totalSeguroFamiliar }}</p></div>
                          <UIcon name="i-heroicons-chevron-right-20-solid" class="w-5 h-5 ms-auto transform transition-transform duration-200" :class="[open && 'rotate-90']" />
                        </div>
                      </div>
                    </template>
                 </UCard>
              </template>
              <template #item="{ item: loja }">
                <div class="pl-4 pr-2 py-2">
                  <UTable :rows="loja.vendas" :columns="columns" />
                </div>
              </template>
            </UAccordion>
          </div>
        </template>
      </UAccordion>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

definePageMeta({
  middleware: 'auth',
  profiles: ['Master']
});

const supabase = useSupabaseClient();

const selectedPeriod = ref(new Date().toISOString().slice(0, 7));
const selectedProduct = ref(null);
const productOptions = ['bmg_med', 'seguro_familiar'];
const selectedRegional = ref(null);

const limparFiltros = () => {
  selectedPeriod.value = new Date().toISOString().slice(0, 7);
  selectedProduct.value = null;
  selectedRegional.value = null;
};

// --- CARREGAMENTO DE DADOS PARA FILTROS ---
const { data: regionais } = useAsyncData('regionais-list', async () => {
  const { data } = await supabase.from('regionais').select('id, nome_regional').order('nome_regional');
  return data || [];
});

const columns = [
  { key: 'adesao', label: 'Adesão' },
  { key: 'tipo_produto', label: 'Produto' },
  { key: 'data_venda', label: 'Data' },
  { key: 'quantidade', label: 'Qtd' },
  { key: 'consultor_nome', label: 'Consultor' },
  { key: 'supervisor_nome', label: 'Supervisor' },
];

const { data: sales, pending } = useAsyncData('vendas-externas-report', async () => {
  const firstDayOfMonth = `${selectedPeriod.value}-01`;
  const lastDayOfMonth = new Date(new Date(firstDayOfMonth).getFullYear(), new Date(firstDayOfMonth).getMonth() + 1, 0).toISOString().split('T')[0];

  // NOVA ABORDAGEM: Consulta a VIEW, que é muito mais simples e robusta.
  let query = supabase
    .from('relatorio_vendas_externas_view')
    .select('*')
    .gte('data_venda', firstDayOfMonth)
    .lte('data_venda', lastDayOfMonth);

  if (selectedProduct.value) {
    query = query.eq('tipo_produto', selectedProduct.value);
  }
  if (selectedRegional.value) {
    query = query.eq('regional_id', selectedRegional.value);
  }

  const { data, error } = await query.order('data_venda', { ascending: false });
  if (error) throw error;
  return data;
}, { watch: [selectedPeriod, selectedProduct, selectedRegional] });

// Lógica para agrupar os dados para a UI
const groupedSales = computed(() => {
  if (!sales.value) return [];

  const regionaisMap = sales.value.reduce((acc, venda) => {
    const regionalNome = venda.nome_regional || 'Sem Regional';
    if (!acc[regionalNome]) {
      acc[regionalNome] = { label: regionalNome, lojas: {}, totalBmgMed: 0, totalSeguroFamiliar: 0 };
    }
    const lojaNome = venda.loja_nome || 'Sem Loja';
    if (!acc[regionalNome].lojas[lojaNome]) {
      acc[regionalNome].lojas[lojaNome] = { label: lojaNome, vendas: [], totalBmgMed: 0, totalSeguroFamiliar: 0 };
    }

    acc[regionalNome].lojas[lojaNome].vendas.push(venda);

    // Acumula totais
    if (venda.tipo_produto === 'bmg_med') {
      acc[regionalNome].totalBmgMed += venda.quantidade;
      acc[regionalNome].lojas[lojaNome].totalBmgMed += venda.quantidade;
    } else if (venda.tipo_produto === 'seguro_familiar') {
      acc[regionalNome].totalSeguroFamiliar += venda.quantidade;
      acc[regionalNome].lojas[lojaNome].totalSeguroFamiliar += venda.quantidade;
    }

    return acc;
  }, {});

  return Object.values(regionaisMap).map(regional => ({
    ...regional,
    lojas: Object.values(regional.lojas)
  }));
});
</script>