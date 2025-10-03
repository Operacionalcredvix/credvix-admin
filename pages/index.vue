<template>
  <div>
    <header class="mb-8">
      <h1 class="text-primary-500 text-3xl font-bold">Dashboard de Produção</h1>
      <p class="mt-1 text-gray-500">
        Olá, {{ profile?.nome_completo }}! Aqui está um resumo da atividade.
      </p>
    </header>

    <UCard class="mb-8">
      <div class="flex flex-wrap items-center gap-4">
        <UFormGroup label="Período de:" name="startDate" class="flex-grow">
          <UInput type="date" v-model="dateRange.start" />
        </UFormGroup>
        <UFormGroup label="Até:" name="endDate" class="flex-grow">
          <UInput type="date" v-model="dateRange.end" />
        </UFormGroup>
        <div class="pt-6 flex gap-2">
          <UButton @click="setDateRange('current_month')" label="Mês Atual" color="gray" variant="ghost" />
          <UButton @click="setDateRange('last_30_days')" label="Últimos 30 dias" color="gray" variant="ghost" />
          <UButton @click="exportToPDF" label="Exportar PDF" color="gray" icon="i-heroicons-document-arrow-down" :loading="exporting" />
        </div>
      </div>
    </UCard>

    <div v-if="pending" class="text-center py-10 text-gray-500">
      <UIcon name="i-heroicons-arrow-path" class="text-2xl animate-spin" />
      <p>A carregar dados do dashboard...</p>
    </div>

    <div v-else>
      <!-- Cards de Estatísticas -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <UCard>
          <div class="flex items-center gap-4">
            <UIcon name="i-heroicons-document-text" class="text-3xl text-primary-500" />
            <div>
              <p class="text-sm text-gray-500">Contratos Totais</p>
              <p class="text-2xl font-bold">{{ stats.total }}</p>
            </div>
          </div>
        </UCard>
        <UCard>
          <div class="flex items-center gap-4">
            <UIcon name="i-heroicons-check-circle" class="text-3xl text-green-500" />
            <div>
              <p class="text-sm text-gray-500">Contratos Pagos</p>
              <p class="text-2xl font-bold">{{ stats.pagos }}</p>
            </div>
          </div>
        </UCard>
        <UCard>
          <div class="flex items-center gap-4">
            <UIcon name="i-heroicons-clock" class="text-3xl text-amber-500" />
            <div>
              <p class="text-sm text-gray-500">Contratos Pendentes</p>
              <p class="text-2xl font-bold">{{ stats.pendentes }}</p>
            </div>
          </div>
        </UCard>
        <UCard>
          <div class="flex items-center gap-4">
            <UIcon name="i-heroicons-x-circle" class="text-3xl text-red-500" />
            <div>
              <p class="text-sm text-gray-500">Contratos Cancelados</p>
              <p class="text-2xl font-bold">{{ stats.cancelados }}</p>
            </div>
          </div>
        </UCard>
        <UCard>
          <div class="flex items-center gap-4">
            <UIcon name="i-heroicons-banknotes" class="text-3xl text-green-400" />
            <div>
              <p class="text-sm text-gray-500">Valor Total Pago</p>
              <p class="text-2xl font-bold">{{ formatCurrency(stats.valorTotal) }}</p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Gráficos -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <UCard>
          <template #header><h3 class="font-semibold">Contratos por Status</h3></template>
          <div v-if="hasData" class="h-80">
            <Doughnut ref="doughnutChartRef" :data="chartData.status" :options="chartOptions" />
          </div>
          <p v-else class="text-center text-gray-500">Sem dados para exibir no período selecionado.</p>
        </UCard>
        
        <UCard class="lg:col-span-2">
          <template #header><h3 class="font-semibold">Top 10 Lojas por Contrato</h3></template>
          <div v-if="hasData" class="h-80">
            <Bar ref="barChartLojasRef" :data="chartData.lojas" :options="chartOptions" />
          </div>
          <p v-else class="text-center text-gray-500">Sem dados para exibir no período selecionado.</p>
        </UCard>
        
        <UCard class="lg:col-span-3">
          <template #header><h3 class="font-semibold">Contratos por Produto</h3></template>
          <div v-if="hasData" class="h-80">
            <Bar ref="barChartProdutosRef" :data="chartData.produtos" :options="chartOptions" />
          </div>
          <p v-else class="text-center text-gray-500">Sem dados para exibir no período selecionado.</p>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { Bar, Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

const supabase = useSupabaseClient();
const { profile } = useProfile();
const toast = useToast();

// --- ESTADO DA EXPORTAÇÃO E REFERÊNCIAS DOS GRÁFICOS ---
const exporting = ref(false);
const doughnutChartRef = ref(null);
const barChartLojasRef = ref(null);
const barChartProdutosRef = ref(null);

// --- LÓGICA DE DATAS ---
const dateRange = reactive({ start: '', end: '' });

const setDateRange = (period) => {
  const now = new Date();
  let startDate, endDate = now;

  if (period === 'current_month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'last_30_days') {
    startDate = new Date();
    startDate.setDate(now.getDate() - 30);
  }

  dateRange.start = startDate.toISOString().split('T')[0];
  dateRange.end = endDate.toISOString().split('T')[0];
};

// Define o período inicial como o mês atual
setDateRange('current_month');

// --- BUSCA DE DADOS COM FILTRO DE DATA E PERMISSÃO ---
const { data: contratos, pending } = useAsyncData(
  'dashboard-contratos',
  async () => {
    if (!profile.value?.id) return [];

    let query = supabase
      .from('contratos')
      .select(`
        status, valor_total, loja_id, consultor_id,
        produtos (nome),
        lojas (nome, regional_id)
      `);

    const userProfileName = profile.value.perfis?.nome;
    switch (userProfileName) {
      case 'Coordenador': {
        // Busca as regionais associadas ao coordenador
        const { data: minhasRegionais } = await supabase.from('regionais').select('id').eq('coordenador_id', profile.value.id);
        const idsRegionais = minhasRegionais?.map(r => r.id) || [];
        if (idsRegionais.length === 0) return [];

        // Busca as lojas dessas regionais
        const { data: lojasDaRegional } = await supabase.from('lojas').select('id').in('regional_id', idsRegionais);
        const idsLojas = lojasDaRegional?.map(l => l.id) || [];
        if (idsLojas.length === 0) return [];
        query = query.in('loja_id', idsLojas);
        break;
      }
      case 'Supervisor':
        query = query.eq('loja_id', profile.value.loja_id);
        break;
      case 'Consultor':
        query = query.eq('consultor_id', profile.value.id);
        break;
    }

    // Adiciona o filtro de data à consulta
    if (dateRange.start) query = query.gte('data_contrato', dateRange.start);
    if (dateRange.end) query = query.lte('data_contrato', dateRange.end);

    const { data } = await query;
    return data || [];
  },
  {
    // Re-executa a busca quando o perfil ou as datas mudarem
    watch: [profile, dateRange]
  }
);

// --- CÁLCULOS PARA AS ESTATÍSTICAS E GRÁFICOS ---
const hasData = computed(() => contratos.value && contratos.value.length > 0);

const stats = computed(() => {
  if (!hasData.value) return { total: 0, pagos: 0, pendentes: 0, cancelados: 0, valorTotal: 0 };

  const statusPagos = ['Pago', 'Aprovado'];
  const statusPendentes = ['Pendente', 'Em Análise'];
  const statusCancelados = ['Cancelado', 'Reprovado'];

  return {
    total: contratos.value.length,
    pagos: contratos.value.filter(c => statusPagos.includes(c.status)).length,
    pendentes: contratos.value.filter(c => statusPendentes.includes(c.status)).length,
    cancelados: contratos.value.filter(c => statusCancelados.includes(c.status)).length,
    valorTotal: contratos.value
      .filter(c => statusPagos.includes(c.status))
      .reduce((sum, c) => sum + (c.valor_total || 0), 0)
  };
});

const chartData = computed(() => {
  if (!hasData.value) return { status: { labels: [], datasets: [] }, produtos: { labels: [], datasets: [] }, lojas: { labels: [], datasets: [] } };

  const statusCounts = contratos.value.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  const lojasCounts = contratos.value.reduce((acc, c) => {
    const nomeLoja = c.lojas?.nome || 'Loja não identificada';
    acc[nomeLoja] = (acc[nomeLoja] || 0) + 1;
    return acc;
  }, {});
  const top10Lojas = Object.entries(lojasCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const produtosCounts = contratos.value.reduce((acc, c) => {
    const nomeProduto = c.produtos?.nome || 'Não identificado';
    acc[nomeProduto] = (acc[nomeProduto] || 0) + 1;
    return acc;
  }, {});

  // Paleta de cores para os produtos. Se houver mais produtos que cores, elas se repetirão.
  const productColors = [
    '#3b82f6', '#22c55e', '#ef4444', '#eab308', '#8b5cf6',
    '#f97316', '#14b8a6', '#ec4899', '#64748b', '#d946ef'
  ];
  const produtosBackgroundColors = Object.keys(produtosCounts).map((_, index) => productColors[index % productColors.length]);

  const statusLabels = Object.keys(statusCounts);
  const statusColors = statusLabels.map(label => {
    if (['Pago', 'Aprovado'].includes(label)) return '#10b981'; // Verde
    if (['Pendente', 'Em Análise'].includes(label)) return '#f59e0b'; // Ambar
    if (['Cancelado', 'Reprovado'].includes(label)) return '#ef4444'; // Vermelho
    return '#6b7280'; // Cinza
  });

  return {
    status: {
      labels: statusLabels,
      datasets: [{ backgroundColor: statusColors, data: Object.values(statusCounts) }]
    },
    lojas: {
      labels: top10Lojas.map(item => item[0]),
      datasets: [{ label: 'Quantidade de Contratos', backgroundColor: '#8b5cf6', data: top10Lojas.map(item => item[1]) }]
    },
    produtos: {
      labels: Object.keys(produtosCounts),
      datasets: [{ label: 'Quantidade de Contratos', backgroundColor: produtosBackgroundColors, data: Object.values(produtosCounts) }]
    }
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false
};

const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

// --- LÓGICA DE EXPORTAÇÃO PARA PDF ---
const exportToPDF = async () => {
  if (pending.value || !hasData.value) {
    toast.add({ title: 'Nenhum dado para exportar', color: 'amber' });
    return;
  }

  exporting.value = true;
  try {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || 10;

    // 1. Título e Período
    doc.setFontSize(18);
    doc.text('Relatório de Produção', 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Período: ${new Date(dateRange.start).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} a ${new Date(dateRange.end).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}`, 14, 28);

    // 2. Tabela de Estatísticas
    autoTable(doc, {
      startY: 36,
      head: [['Indicador', 'Valor']],
      body: [
        ['Contratos Totais', stats.value.total],
        ['Contratos Pagos', stats.value.pagos],
        ['Contratos Pendentes', stats.value.pendentes],
        ['Contratos Cancelados', stats.value.cancelados],
        ['Valor Total Pago', formatCurrency(stats.value.valorTotal)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] }, // Cor primária
    });

    // 3. Adicionar Gráficos como Imagens
    const addChartToPDF = (chartRef, title, y) => {
      if (chartRef.value?.chart.canvas) {
        const imgData = chartRef.value.chart.canvas.toDataURL('image/png');
        doc.setFontSize(14);
        doc.text(title, 14, y + 15);
        doc.addImage(imgData, 'PNG', 14, y + 20, 180, 90);
      }
    };

    doc.addPage();
    addChartToPDF(doughnutChartRef, 'Contratos por Status', 10);
    addChartToPDF(barChartLojasRef, 'Top 10 Lojas por Contrato', 130);
    doc.addPage();
    addChartToPDF(barChartProdutosRef, 'Contratos por Produto', 10);

    doc.save(`dashboard_producao_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (err) {
    toast.add({ title: 'Erro na Exportação', description: 'Não foi possível gerar o arquivo PDF.', color: 'red' });
    console.error(err);
  } finally {
    exporting.value = false;
  }
};
</script>