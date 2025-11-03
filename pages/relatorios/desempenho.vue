<template>
  <div>
    <header class="mb-8">
      <h1 class="text-primary-500 text-3xl font-bold">Relatório de Desempenho</h1>
      <p class="text-gray-500 mt-1">Compare o desempenho entre lojas ou regionais num período específico.</p>
    </header>

    <!-- Card de Filtros -->
    <UCard class="mb-8">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-funnel" class="text-primary-500" />
          <h3 class="font-semibold">Filtros do Relatório</h3>
        </div>
      </template>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <!-- Linha 1: Filtros principais -->
        <UFormGroup label="Agrupar por" name="groupBy">
          <USelectMenu v-model="filters.groupBy" :options="groupByOptions" />
        </UFormGroup>

        <UFormGroup label="Data de Início" name="startDate">
          <UInput v-model="filters.startDate" type="date" />
        </UFormGroup>

        <UFormGroup label="Data de Fim" name="endDate">
          <UInput v-model="filters.endDate" type="date" />
        </UFormGroup>

        <!-- Linha 2: Filtros adicionais -->
        <UFormGroup label="Status" name="status" help="Deixe vazio para todos">
          <USelectMenu 
            v-model="filters.status" 
            :options="statusOptions" 
            multiple
            placeholder="Todos os status"
          />
        </UFormGroup>

        <UFormGroup label="Produto" name="produto" help="Deixe vazio para todos">
          <USelectMenu 
            v-model="filters.produto_id" 
            :options="produtosOptions" 
            multiple
            placeholder="Todos os produtos"
            value-attribute="id"
            option-attribute="nome"
          />
        </UFormGroup>

        <UFormGroup label="Banco" name="banco" help="Deixe vazio para todos">
          <USelectMenu 
            v-model="filters.banco_id" 
            :options="bancosOptions" 
            multiple
            placeholder="Todos os bancos"
            value-attribute="id"
            option-attribute="nome_instituicao"
          />
        </UFormGroup>

        <UFormGroup label="Regional" name="regional" help="Apenas ao agrupar por loja" v-if="filters.groupBy === 'loja'">
          <USelectMenu 
            v-model="filters.regional_id" 
            :options="regionaisOptions" 
            placeholder="Todas as regionais"
            value-attribute="id"
            option-attribute="nome_regional"
            clearable
          />
        </UFormGroup>

        <UFormGroup label="Consultor" name="consultor" help="Deixe vazio para todos">
          <USelectMenu 
            v-model="filters.consultor_id" 
            :options="consultoresOptions" 
            placeholder="Todos os consultores"
            value-attribute="id"
            option-attribute="nome_completo"
            clearable
          />
        </UFormGroup>
      </div>

      <div class="flex items-center gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <UButton @click="fetchReportData" :loading="loading" icon="i-heroicons-chart-bar" size="lg" color="primary">
          Gerar Relatório
        </UButton>
        <UButton @click="clearFilters" variant="ghost" icon="i-heroicons-x-mark" size="lg" color="gray">
          Limpar Filtros
        </UButton>
      </div>
    </UCard>

    <!-- Card de Resultados -->
    <UCard v-if="reportData.length > 0">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-lg">Resultados do Relatório</h2>
          <UBadge color="primary" variant="subtle">{{ reportData.length }} {{ filters.groupBy === 'loja' ? 'lojas' : 'regionais' }}</UBadge>
        </div>
      </template>

      <UTable :rows="reportData" :columns="columns" :loading="loading">
        <template #total_contratos-data="{ row }">
          <UBadge color="gray" variant="subtle" size="lg">{{ row.total_contratos }}</UBadge>
        </template>
        <template #contratos_pagos-data="{ row }">
          <UBadge color="green" variant="subtle">{{ row.contratos_pagos }}</UBadge>
        </template>
        <template #contratos_pendentes-data="{ row }">
          <UBadge color="amber" variant="subtle">{{ row.contratos_pendentes }}</UBadge>
        </template>
        <template #contratos_cancelados-data="{ row }">
          <UBadge color="red" variant="subtle">{{ row.contratos_cancelados }}</UBadge>
        </template>
        <template #volume_total-data="{ row }">
          <span class="font-semibold text-green-600 dark:text-green-400">{{ formatCurrency(row.volume_total) }}</span>
        </template>
        <template #ticket_medio-data="{ row }">
          <span>{{ formatCurrency(row.ticket_medio) }}</span>
        </template>
        <template #taxa_conversao-data="{ row }">
          <div class="flex items-center gap-2">
            <span class="font-semibold" :class="getConversionColor(row.taxa_conversao)">{{ row.taxa_conversao }}%</span>
            <UProgress :value="row.taxa_conversao" :max="100" :color="getConversionProgressColor(row.taxa_conversao)" size="xs" class="w-16" />
          </div>
        </template>
      </UTable>

      <!-- NOVO: Gráfico de Barras -->
      <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 class="font-semibold text-lg mb-4">Gráfico de Volume Total</h3>
        <div class="h-96"><Bar :data="chartData" :options="chartOptions" /></div>
      </div>

    </UCard>

    <!-- Loading State -->
    <UCard v-else-if="loading">
      <div class="text-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="text-4xl text-primary-500 mb-4 animate-spin" />
        <p class="text-gray-500">Gerando relatório...</p>
      </div>
    </UCard>

    <!-- Empty State -->
    <div v-else-if="searched" class="text-center py-12">
      <UIcon name="i-heroicons-chart-bar-square" class="text-6xl text-gray-300 dark:text-gray-600 mb-4" />
      <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Nenhum dado encontrado</h3>
      <p class="text-gray-500 mb-4">Não há contratos pagos no período selecionado.</p>
      <p class="text-sm text-gray-400">Tente ajustar os filtros e gerar novamente.</p>
    </div>

    <!-- Initial State -->
    <div v-else class="text-center py-12">
      <UIcon name="i-heroicons-document-chart-bar" class="text-6xl text-gray-300 dark:text-gray-600 mb-4" />
      <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Selecione os filtros</h3>
      <p class="text-gray-500">Configure o período e o agrupamento desejado e clique em "Gerar Relatório".</p>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

definePageMeta({
  middleware: 'auth',
  // Defina os perfis que podem acessar este relatório
  profiles: ['Master','Diretoria','Gerência', 'Coordenador']
});

const supabase = useSupabaseClient();
const toast = useToast();

// --- Estado dos Filtros ---
const groupByOptions = ['loja', 'regional'];
const statusOptions = ['Pendente', 'Em Análise', 'Pago', 'Reprovado', 'Cancelado'];

const filters = reactive({
  groupBy: 'loja',
  // Define as datas padrão para o mês atual
  startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  status: [],
  produto_id: [],
  banco_id: [],
  regional_id: null,
  consultor_id: null,
});

// --- Carregar opções de filtros ---
const { data: produtosOptions } = await useAsyncData('produtos-filtro', async () => {
  const { data } = await supabase.from('produtos').select('id, nome').eq('is_active', true).order('nome');
  return data || [];
});

const { data: bancosOptions } = await useAsyncData('bancos-filtro', async () => {
  const { data } = await supabase.from('bancos').select('id, nome_instituicao').order('nome_instituicao');
  return data || [];
});

const { data: regionaisOptions } = await useAsyncData('regionais-filtro', async () => {
  const { data } = await supabase.from('regionais').select('id, nome_regional').order('nome_regional');
  return data || [];
});

const { data: consultoresOptions } = await useAsyncData('consultores-filtro', async () => {
  const { data } = await supabase
    .from('funcionarios')
    .select('id, nome_completo, perfis!inner(nome)')
    .eq('perfis.nome', 'Consultor')
    .eq('is_active', true)
    .order('nome_completo');
  return data || [];
});

// --- Estado dos Dados ---
const loading = ref(false);
const searched = ref(false); // Para saber se uma busca já foi feita
const reportData = ref([]);

// --- Colunas da Tabela ---
const columns = computed(() => [
  { key: 'nome', label: filters.groupBy === 'loja' ? 'Loja' : 'Regional', sortable: true },
  { key: 'total_contratos', label: 'Total Contratos', sortable: true },
  { key: 'contratos_pagos', label: 'Pagos', sortable: true },
  { key: 'contratos_pendentes', label: 'Pendentes', sortable: true },
  { key: 'contratos_cancelados', label: 'Cancelados', sortable: true },
  { key: 'volume_total', label: 'Volume Total (Pagos)', sortable: true },
  { key: 'ticket_medio', label: 'Ticket Médio', sortable: true },
  { key: 'taxa_conversao', label: 'Taxa Conv. (%)', sortable: true },
]);

// --- NOVO: Configuração do Gráfico ---
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
};

const chartData = computed(() => {
  if (!reportData.value || reportData.value.length === 0) {
    return { labels: [], datasets: [] };
  }

  return {
    labels: reportData.value.map(item => item.nome),
    datasets: [
      {
        label: `Volume Total por ${filters.groupBy === 'loja' ? 'Loja' : 'Regional'}`,
        backgroundColor: '#3b82f6', // Cor primária
        data: reportData.value.map(item => item.volume_total),
      },
    ],
  };
});

// --- Lógica de Busca ---
const fetchReportData = async () => {
  loading.value = true;
  searched.value = true;
  reportData.value = [];

  try {
    console.log('🔍 Buscando relatório com filtros:', {
      data_inicio: filters.startDate,
      data_fim: filters.endDate,
      agrupar_por: filters.groupBy,
      status: filters.status,
      produto_id: filters.produto_id,
      banco_id: filters.banco_id,
      regional_id: filters.regional_id,
      consultor_id: filters.consultor_id,
    });

    // Prepara os parâmetros (converte arrays vazios para null)
    const params = {
      data_inicio: filters.startDate,
      data_fim: filters.endDate,
      agrupar_por: filters.groupBy,
      p_status: filters.status.length > 0 ? filters.status : null,
      p_produto_ids: filters.produto_id.length > 0 ? filters.produto_id : null,
      p_banco_ids: filters.banco_id.length > 0 ? filters.banco_id : null,
      p_regional_id: filters.regional_id || null,
      p_consultor_id: filters.consultor_id || null,
    };

    const { data, error } = await supabase.rpc('gerar_relatorio_desempenho_v2', params);

    if (error) {
      console.error('❌ Erro na RPC:', error);
      throw error;
    }

    console.log('✅ Dados retornados:', data);

    if (!data || data.length === 0) {
      toast.add({ 
        title: 'Sem dados', 
        description: 'Nenhum contrato encontrado no período selecionado.', 
        color: 'amber' 
      });
      reportData.value = [];
      return;
    }

    // TODO: Aplicar filtros client-side (status, produto, banco, etc)
    // Isso será melhorado quando criarmos uma função SQL mais robusta

    // Ordena os dados pelo volume total para um ranking mais claro
    reportData.value = data.sort((a, b) => (b.volume_total || 0) - (a.volume_total || 0));

    toast.add({ 
      title: 'Sucesso!', 
      description: `${data.length} ${filters.groupBy === 'loja' ? 'lojas' : 'regionais'} encontradas.`, 
      color: 'green' 
    });

  } catch (error) {
    console.error("❌ Erro ao gerar relatório:", error);
    
    let errorMessage = 'Não foi possível gerar o relatório.';
    
    if (error.message) {
      errorMessage = error.message;
    }
    
    if (error.code === 'PGRST202') {
      errorMessage = 'Função SQL não encontrada no banco. Execute o script 10_create_performance_report_function.sql';
    }
    
    toast.add({ 
      title: 'Erro!', 
      description: errorMessage, 
      color: 'red',
      timeout: 5000
    });
  } finally {
    loading.value = false;
  }
};

// --- Limpar Filtros ---
const clearFilters = () => {
  filters.status = [];
  filters.produto_id = [];
  filters.banco_id = [];
  filters.regional_id = null;
  filters.consultor_id = null;
  filters.startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  filters.endDate = new Date().toISOString().split('T')[0];
  
  toast.add({ 
    title: 'Filtros limpos', 
    description: 'Todos os filtros foram redefinidos para os valores padrão.', 
    color: 'gray' 
  });
};

// --- Funções de Formatação ---
const formatCurrency = (value) => {
  if (value === null || isNaN(value)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const getConversionColor = (percentage) => {
  if (percentage >= 70) return 'text-green-600 dark:text-green-400';
  if (percentage >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
};

const getConversionProgressColor = (percentage) => {
  if (percentage >= 70) return 'green';
  if (percentage >= 50) return 'amber';
  return 'red';
};

</script>