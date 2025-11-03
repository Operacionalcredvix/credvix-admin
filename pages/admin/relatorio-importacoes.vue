<template>
  <div>
    <header class="mb-8">
      <h1 class="text-primary-500 text-3xl font-bold">Relatório de Seguros</h1>
      <p class="text-gray-500 mt-1">Visualize e analise as vendas de seguros (BMG MED e Seguro Familiar).</p>
    </header>

    <!-- KPIs -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Total de Seguros</p>
            <p class="text-3xl font-bold text-primary-500">{{ kpis.totalSeguros }}</p>
            <p class="text-xs text-gray-500 mt-1">BMG: {{ kpis.totalBmg }} | Seg. Fam.: {{ kpis.totalSeguro }}</p>
          </div>
          <UIcon name="i-heroicons-shield-check" class="text-4xl text-primary-500 opacity-20" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Melhor Consultor</p>
            <p class="text-lg font-bold text-green-600 dark:text-green-400 truncate" :title="kpis.melhorConsultor.nome">
              {{ kpis.melhorConsultor.nome }}
            </p>
            <p class="text-xs text-gray-500 mt-1">{{ kpis.melhorConsultor.total }} seguros</p>
          </div>
          <UIcon name="i-heroicons-trophy" class="text-4xl text-yellow-500 opacity-20" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Melhor Loja</p>
            <p class="text-lg font-bold text-blue-600 dark:text-blue-400 truncate" :title="kpis.melhorLoja.nome">
              {{ kpis.melhorLoja.nome }}
            </p>
            <p class="text-xs text-gray-500 mt-1">{{ kpis.melhorLoja.total }} seguros</p>
          </div>
          <UIcon name="i-heroicons-building-storefront" class="text-4xl text-blue-500 opacity-20" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Taxa de Crescimento</p>
            <p class="text-3xl font-bold" :class="kpis.crescimento >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
              {{ kpis.crescimento >= 0 ? '+' : '' }}{{ kpis.crescimento }}%
            </p>
            <p class="text-xs text-gray-500 mt-1">vs. mês anterior</p>
          </div>
          <UIcon :name="kpis.crescimento >= 0 ? 'i-heroicons-arrow-trending-up' : 'i-heroicons-arrow-trending-down'" 
                 class="text-4xl opacity-20" 
                 :class="kpis.crescimento >= 0 ? 'text-green-500' : 'text-red-500'" />
        </div>
      </UCard>
    </div>

    <!-- Filtros -->
    <UCard class="mb-8">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-lg">Filtros</h3>
          <UButton @click="exportarExcel" icon="i-heroicons-arrow-down-tray" color="green" variant="soft" size="sm">
            Exportar Excel
          </UButton>
        </div>
      </template>
      <div class="flex flex-wrap items-end gap-4">
        <UFormGroup label="Período" name="period" class="w-48">
          <UInput type="month" v-model="selectedPeriod" />
        </UFormGroup>
        <UFormGroup label="Tipo de Produto" name="productType" class="w-64">
          <USelectMenu 
            v-model="selectedProduct" 
            :options="productOptions" 
            value-attribute="value" 
            option-attribute="label" 
            placeholder="Todos os produtos" 
            clearable 
          />
        </UFormGroup>
        <UFormGroup label="Regional" name="regional" class="w-64">
          <USelectMenu v-model="selectedRegional" :options="regionais" value-attribute="id" option-attribute="nome_regional" placeholder="Todas as regionais" clearable />
        </UFormGroup>
        <UFormGroup label="Loja" name="loja" class="w-64">
          <USelectMenu v-model="selectedLoja" :options="lojasFiltradas" value-attribute="id" option-attribute="nome" placeholder="Todas as lojas" clearable />
        </UFormGroup>
        <UFormGroup label="Buscar Consultor" name="searchConsultor" class="flex-1 min-w-64">
          <UInput v-model="searchConsultor" icon="i-heroicons-magnifying-glass" placeholder="Digite o nome do consultor..." />
        </UFormGroup>
        <div class="pt-6">
          <UButton @click="limparFiltros" label="Limpar Filtros" color="gray" variant="ghost" icon="i-heroicons-x-circle" />
        </div>
      </div>
    </UCard>

    <!-- Ranking de Consultores -->
    <UCard class="mb-8">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-trophy" class="text-xl text-yellow-500" />
          <h3 class="font-semibold text-lg">Ranking de Consultores</h3>
        </div>
      </template>

      <div v-if="pending" class="text-center py-10">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-gray-500" />
        <p class="text-gray-500 mt-2">A carregar dados...</p>
      </div>

      <div v-else-if="rankingConsultores.length === 0" class="text-center py-10">
        <UIcon name="i-heroicons-user-group" class="text-4xl text-gray-400" />
        <p class="text-gray-500 mt-2">Nenhum consultor encontrado para os filtros selecionados.</p>
      </div>

      <UTable v-else :rows="rankingConsultores" :columns="rankingColumns">
        <template #rank-data="{ row }">
          <div class="flex items-center gap-2">
            <span v-if="row.rank === 1" class="text-2xl">🏆</span>
            <span v-else-if="row.rank === 2" class="text-2xl">🥈</span>
            <span v-else-if="row.rank === 3" class="text-2xl">🥉</span>
            <span v-else class="font-semibold text-gray-600">{{ row.rank }}º</span>
          </div>
        </template>

        <template #consultor_nome-data="{ row }">
          <div>
            <p class="font-semibold">{{ row.consultor_nome }}</p>
            <p class="text-xs text-gray-500">{{ row.loja_nome }}</p>
          </div>
        </template>

        <template #regional-data="{ row }">
          <span class="text-sm text-gray-600">{{ row.regional_nome || 'N/A' }}</span>
        </template>

        <template #total_bmg-data="{ row }">
          <UBadge color="cyan" variant="subtle" size="lg">{{ row.total_bmg }}</UBadge>
        </template>

        <template #total_seguro-data="{ row }">
          <UBadge color="sky" variant="subtle" size="lg">{{ row.total_seguro }}</UBadge>
        </template>

        <template #total_geral-data="{ row }">
          <div class="flex flex-col gap-1">
            <span class="font-bold text-lg text-primary-600">{{ row.total_geral }}</span>
            <UProgress :value="(row.total_geral / rankingConsultores[0].total_geral) * 100" color="primary" size="xs" />
          </div>
        </template>
      </UTable>
    </UCard>

    <!-- Gráficos -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <UCard>
        <template #header>
          <h3 class="font-semibold text-lg">Distribuição por Tipo de Seguro</h3>
        </template>
        <div class="h-80 flex items-center justify-center">
          <Pie v-if="chartDataPie.labels.length > 0" :data="chartDataPie" :options="chartOptionsPie" />
          <p v-else class="text-gray-500">Sem dados para exibir</p>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h3 class="font-semibold text-lg">Top 10 Consultores</h3>
        </template>
        <div class="h-80 flex items-center justify-center">
          <Bar v-if="chartDataBar.labels.length > 0" :data="chartDataBar" :options="chartOptionsBar" />
          <p v-else class="text-gray-500">Sem dados para exibir</p>
        </div>
      </UCard>
    </div>

    <!-- Resultados Hierárquicos -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-list-bullet" class="text-xl text-primary-500" />
          <h3 class="font-semibold text-lg">Detalhamento por Regional e Loja</h3>
        </div>
      </template>

      <div v-if="pending" class="text-center py-10">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-gray-500" />
        <p class="text-gray-500 mt-2">A carregar relatório...</p>
      </div>
      <div v-else-if="groupedSales.length === 0" class="text-center py-10">
        <UIcon name="i-heroicons-circle-stack" class="text-4xl text-gray-400" />
        <p class="text-gray-500 mt-2">Nenhum registo encontrado para os filtros selecionados.</p>
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
    </UCard>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Pie, Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement } from 'chart.js';
import * as XLSX from 'xlsx';

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement);

definePageMeta({
  middleware: 'auth',
  profiles: ['Master','Diretoria','Gerência']
});

const supabase = useSupabaseClient();
const toast = useAppToast();

const selectedPeriod = ref(new Date().toISOString().slice(0, 7));
const selectedProduct = ref(null);
const productOptions = [
  { label: 'BMG MED', value: 'bmg_med' },
  { label: 'Seguro Familiar', value: 'seguro_familiar' }
];
const selectedRegional = ref(null);
const selectedLoja = ref(null);
const searchConsultor = ref('');

const limparFiltros = () => {
  selectedPeriod.value = new Date().toISOString().slice(0, 7);
  selectedProduct.value = null;
  selectedRegional.value = null;
  selectedLoja.value = null;
  searchConsultor.value = '';
};

// --- CARREGAMENTO DE DADOS PARA FILTROS ---
const { data: regionais } = useAsyncData('regionais-list', async () => {
  const { data } = await supabase.from('regionais').select('id, nome_regional').order('nome_regional');
  return data || [];
});

const { data: lojas } = useAsyncData('lojas-list', async () => {
  const { data } = await supabase.from('lojas').select('id, nome, regional_id').order('nome');
  return data || [];
});

const lojasFiltradas = computed(() => {
  if (!lojas.value) return [];
  if (!selectedRegional.value) return lojas.value;
  return lojas.value.filter(l => l.regional_id === selectedRegional.value);
});

const columns = [
  { key: 'adesao', label: 'Adesão' },
  { key: 'tipo_produto', label: 'Produto' },
  { key: 'data_venda', label: 'Data' },
  { key: 'quantidade', label: 'Qtd' },
  { key: 'consultor_nome', label: 'Consultor' },
  { key: 'supervisor_nome', label: 'Supervisor' },
];

const rankingColumns = [
  { key: 'rank', label: '#', sortable: false },
  { key: 'consultor_nome', label: 'Consultor', sortable: true },
  { key: 'regional', label: 'Regional', sortable: true },
  { key: 'total_bmg', label: 'BMG MED', sortable: true },
  { key: 'total_seguro', label: 'Seguro Familiar', sortable: true },
  { key: 'total_geral', label: 'Total Geral', sortable: true }
];

// --- BUSCA DE DADOS DO MÊS ATUAL ---
const { data: sales, pending } = useAsyncData('vendas-externas-report', async () => {
  // Cálculo robusto sem toISOString (evita problemas de fuso)
  const [yStr, mStr] = String(selectedPeriod.value || '').split('-');
  const y = Number(yStr);
  const m = Number(mStr); // 1..12
  const firstDayOfMonth = `${yStr}-${mStr}-01`;
  const lastDayNum = new Date(y, m, 0).getDate(); // último dia do mês selecionado
  const lastDayOfMonth = `${yStr}-${mStr}-${String(lastDayNum).padStart(2, '0')}`;

  console.log('🔍 [Relatório Seguros] Buscando dados:', {
    periodo: selectedPeriod.value,
    firstDay: firstDayOfMonth,
    lastDay: lastDayOfMonth,
    produto: selectedProduct.value,
    regional: selectedRegional.value,
    loja: selectedLoja.value
  });

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
  if (selectedLoja.value) {
    query = query.eq('loja_id', selectedLoja.value);
  }

  const { data, error } = await query.order('data_venda', { ascending: false });
  
  if (error) {
    console.error('❌ [Relatório Seguros] Erro ao buscar dados:', error);
    toast.add({ 
      title: 'Erro ao carregar seguros', 
      description: error.message, 
      color: 'red' 
    });
  } else {
    console.log('✅ [Relatório Seguros] Dados carregados:', data?.length || 0, 'registros');
  }
  
  return data || [];
}, { watch: [selectedPeriod, selectedProduct, selectedRegional, selectedLoja] });

// --- BUSCA DE DADOS DO MÊS ANTERIOR (para crescimento) ---
const { data: salesPrevMonth } = useAsyncData('vendas-externas-prev-month', async () => {
  // Cálculo robusto do mês anterior sem toISOString
  const [cyStr, cmStr] = String(selectedPeriod.value || '').split('-');
  const cy = Number(cyStr);
  const cm = Number(cmStr); // 1..12
  const prevDate = new Date(cy, cm - 2, 1); // mês anterior (índice 0-based)
  const py = prevDate.getFullYear();
  const pm = prevDate.getMonth() + 1; // 1..12
  const prevMonthStr = `${py}-${String(pm).padStart(2, '0')}`;
  const firstDayOfMonth = `${prevMonthStr}-01`;
  const lastDayPrev = new Date(py, pm, 0).getDate();
  const lastDayOfMonth = `${prevMonthStr}-${String(lastDayPrev).padStart(2, '0')}`;

  let query = supabase
    .from('relatorio_vendas_externas_view')
    .select('quantidade')
    .gte('data_venda', firstDayOfMonth)
    .lte('data_venda', lastDayOfMonth);

  if (selectedRegional.value) {
    query = query.eq('regional_id', selectedRegional.value);
  }
  if (selectedLoja.value) {
    query = query.eq('loja_id', selectedLoja.value);
  }

  const { data, error } = await query;
  if (error) return [];
  return data || [];
}, { watch: [selectedPeriod, selectedRegional, selectedLoja] });

// --- FILTRO POR BUSCA DE CONSULTOR ---
const salesFiltradas = computed(() => {
  if (!sales.value) return [];
  if (!searchConsultor.value) return sales.value;
  
  const searchLower = searchConsultor.value.toLowerCase();
  return sales.value.filter(v => 
    v.consultor_nome?.toLowerCase().includes(searchLower)
  );
});

// --- KPIs ---
const kpis = computed(() => {
  if (!salesFiltradas.value || salesFiltradas.value.length === 0) {
    return {
      totalSeguros: 0,
      totalBmg: 0,
      totalSeguro: 0,
      melhorConsultor: { nome: 'N/A', total: 0 },
      melhorLoja: { nome: 'N/A', total: 0 },
      crescimento: 0
    };
  }

  const totalBmg = salesFiltradas.value
    .filter(v => v.tipo_produto === 'bmg_med')
    .reduce((sum, v) => sum + (v.quantidade || 0), 0);
  
  const totalSeguro = salesFiltradas.value
    .filter(v => v.tipo_produto === 'seguro_familiar')
    .reduce((sum, v) => sum + (v.quantidade || 0), 0);

  // Melhor Consultor
  const consultoresMap = {};
  salesFiltradas.value.forEach(v => {
    const nome = v.consultor_nome || 'Sem Consultor';
    if (!consultoresMap[nome]) consultoresMap[nome] = 0;
    consultoresMap[nome] += v.quantidade || 0;
  });
  const melhorConsultorEntry = Object.entries(consultoresMap).sort((a, b) => b[1] - a[1])[0];

  // Melhor Loja
  const lojasMap = {};
  salesFiltradas.value.forEach(v => {
    const nome = v.loja_nome || 'Sem Loja';
    if (!lojasMap[nome]) lojasMap[nome] = 0;
    lojasMap[nome] += v.quantidade || 0;
  });
  const melhorLojaEntry = Object.entries(lojasMap).sort((a, b) => b[1] - a[1])[0];

  // Crescimento
  const totalAtual = totalBmg + totalSeguro;
  const totalAnterior = salesPrevMonth.value?.reduce((sum, v) => sum + (v.quantidade || 0), 0) || 0;
  const crescimento = totalAnterior > 0 ? Math.round(((totalAtual - totalAnterior) / totalAnterior) * 100) : 0;

  return {
    totalSeguros: totalBmg + totalSeguro,
    totalBmg,
    totalSeguro,
    melhorConsultor: melhorConsultorEntry ? { nome: melhorConsultorEntry[0], total: melhorConsultorEntry[1] } : { nome: 'N/A', total: 0 },
    melhorLoja: melhorLojaEntry ? { nome: melhorLojaEntry[0], total: melhorLojaEntry[1] } : { nome: 'N/A', total: 0 },
    crescimento
  };
});

// --- RANKING DE CONSULTORES ---
const rankingConsultores = computed(() => {
  if (!salesFiltradas.value || salesFiltradas.value.length === 0) return [];

  const consultoresMap = {};
  
  salesFiltradas.value.forEach(v => {
    const id = v.consultor_id || 0;
    const nome = v.consultor_nome || 'Sem Consultor';
    const loja = v.loja_nome || 'Sem Loja';
    const regional = v.nome_regional || 'Sem Regional';

    if (!consultoresMap[id]) {
      consultoresMap[id] = {
        consultor_id: id,
        consultor_nome: nome,
        loja_nome: loja,
        regional_nome: regional,
        total_bmg: 0,
        total_seguro: 0,
        total_geral: 0
      };
    }

    if (v.tipo_produto === 'bmg_med') {
      consultoresMap[id].total_bmg += v.quantidade || 0;
    } else if (v.tipo_produto === 'seguro_familiar') {
      consultoresMap[id].total_seguro += v.quantidade || 0;
    }
    consultoresMap[id].total_geral += v.quantidade || 0;
  });

  const ranking = Object.values(consultoresMap)
    .sort((a, b) => b.total_geral - a.total_geral)
    .map((c, index) => ({ ...c, rank: index + 1 }));

  return ranking;
});

// --- GRÁFICO DE PIZZA ---
const chartDataPie = computed(() => {
  if (!salesFiltradas.value || salesFiltradas.value.length === 0) {
    return { labels: [], datasets: [] };
  }

  return {
    labels: ['BMG MED', 'Seguro Familiar'],
    datasets: [{
      data: [kpis.value.totalBmg, kpis.value.totalSeguro],
      backgroundColor: ['#06b6d4', '#0ea5e9'],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };
});

const chartOptionsPie = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' },
    tooltip: {
      callbacks: {
        label: (context) => `${context.label}: ${context.parsed} seguros`
      }
    }
  }
};

// --- GRÁFICO DE BARRAS (TOP 10) ---
const chartDataBar = computed(() => {
  if (rankingConsultores.value.length === 0) {
    return { labels: [], datasets: [] };
  }

  const top10 = rankingConsultores.value.slice(0, 10);

  return {
    labels: top10.map(c => c.consultor_nome.split(' ')[0]), // Primeiro nome
    datasets: [
      {
        label: 'BMG MED',
        data: top10.map(c => c.total_bmg),
        backgroundColor: '#06b6d4'
      },
      {
        label: 'Seguro Familiar',
        data: top10.map(c => c.total_seguro),
        backgroundColor: '#0ea5e9'
      }
    ]
  };
});

const chartOptionsBar = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' }
  },
  scales: {
    x: { stacked: true },
    y: { stacked: true, beginAtZero: true }
  }
};

// --- EXPORTAR PARA EXCEL ---
const exportarExcel = () => {
  if (rankingConsultores.value.length === 0) {
    toast.add({ title: 'Aviso', description: 'Não há dados para exportar', color: 'amber' });
    return;
  }

  const dataToExport = rankingConsultores.value.map(c => ({
    'Posição': c.rank,
    'Consultor': c.consultor_nome,
    'Loja': c.loja_nome,
    'Regional': c.regional_nome,
    'BMG MED': c.total_bmg,
    'Seguro Familiar': c.total_seguro,
    'Total Geral': c.total_geral
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ranking Seguros');

  const fileName = `ranking_seguros_${selectedPeriod.value}.xlsx`;
  XLSX.writeFile(workbook, fileName);

  toast.add({ title: 'Sucesso', description: 'Relatório exportado com sucesso!', color: 'green' });
};

// Lógica para agrupar os dados para a UI hierárquica
const groupedSales = computed(() => {
  if (!salesFiltradas.value) return [];

  const regionaisMap = salesFiltradas.value.reduce((acc, venda) => {
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