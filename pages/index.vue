<template>
  <div>
    <header class="mb-8">
      <h1 class=" text-primary-500 text-3xl font-bold">Dashboard de Produção</h1>
      <p class="mt-1 text-gray-500">
        Olá, {{ profile?.nome_completo }}! Aqui está um resumo da sua atividade.
      </p>
    </header>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <UCard>
        <div class="flex items-center gap-4">
          <UIcon name="i-heroicons-document-text" class="text-3xl text-primary-500" />
          <div>
            <p class="text-sm text-gray-500">Contratos Totais</p>
            <p class="text-2xl font-bold">{{ stats.totalContratos }}</p>
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center gap-4">
          <UIcon name="i-heroicons-check-circle" class="text-3xl text-green-500" />
          <div>
            <p class="text-sm text-gray-500">Contratos Pagos</p>
            <p class="text-2xl font-bold">{{ stats.contratosPagos }}</p>
          </div>
        </div>
      </UCard>
       <UCard>
        <div class="flex items-center gap-4">
          <UIcon name="i-heroicons-clock" class="text-3xl text-amber-500" />
          <div>
            <p class="text-sm text-gray-500">Contratos Pendentes</p>
            <p class="text-2xl font-bold">{{ stats.contratosPendentes }}</p>
          </div>
        </div>
      </UCard>
       <UCard>
        <div class="flex items-center gap-4">
          <UIcon name="i-heroicons-banknotes" class="text-3xl text-gray-800" />
          <div>
            <p class="text-sm text-gray-500">Valor Total Pago</p>
            <p class="text-2xl font-bold">{{ formatCurrency(stats.valorTotalPago) }}</p>
          </div>
        </div>
      </UCard>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <UCard>
        <template #header><h3 class="font-semibold">Contratos por Status</h3></template>
        <div v-if="chartData.status.labels.length > 0">
          <Doughnut :data="chartData.status" :options="chartOptions" />
        </div>
        <p v-else class="text-center text-gray-500">Sem dados para exibir.</p>
      </UCard>
      
      <UCard>
        <template #header><h3 class="font-semibold">Contratos por Produto</h3></template>
         <div v-if="chartData.produtos.labels.length > 0">
          <Bar :data="chartData.produtos" :options="chartOptions" />
        </div>
        <p v-else class="text-center text-gray-500">Sem dados para exibir.</p>
      </UCard>
    </div>
  </div>
</template>

<script setup>
import { Bar, Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';

// Regista os componentes do Chart.js
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

const supabase = useSupabaseClient();
const { profile } = useProfile();

// --- BUSCA DE DADOS ---
// Busca todos os contratos do consultor logado
const { data: contratos, pending } = await useAsyncData(`dashboard-contratos-${profile.value?.id}`, async () => {
  if (!profile.value?.id) return [];
  const { data } = await supabase
    .from('contratos')
    .select('status, valor_total, produtos(nome)')
    .eq('consultor_id', profile.value.id);
  return data || [];
});

// --- CÁLCULOS PARA AS ESTATÍSTICAS E GRÁFICOS ---
const stats = computed(() => {
  if (!contratos.value) return { totalContratos: 0, contratosPagos: 0, contratosPendentes: 0, valorTotalPago: 0 };

  const pagos = contratos.value.filter(c => c.status === 'Pago');
  const pendentes = contratos.value.filter(c => c.status === 'Pendente' || c.status === 'Em Análise');

  return {
    totalContratos: contratos.value.length,
    contratosPagos: pagos.length,
    contratosPendentes: pendentes.length,
    valorTotalPago: pagos.reduce((sum, c) => sum + (c.valor_total || 0), 0)
  };
});

const chartData = computed(() => {
    if (!contratos.value) return { status: { labels: [], datasets: [] }, produtos: { labels: [], datasets: [] } };
    
    // Dados para o gráfico de Status
    const statusCounts = contratos.value.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
    }, {});
    
    // Dados para o gráfico de Produtos
    const produtosCounts = contratos.value.reduce((acc, c) => {
        const nomeProduto = c.produtos?.nome || 'Não identificado';
        acc[nomeProduto] = (acc[nomeProduto] || 0) + 1;
        return acc;
    }, {});

    return {
        status: {
            labels: Object.keys(statusCounts),
            datasets: [{
                backgroundColor: ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#6b7280'],
                data: Object.values(statusCounts)
            }]
        },
        produtos: {
            labels: Object.keys(produtosCounts),
            datasets: [{
                label: 'Quantidade de Contratos',
                backgroundColor: '#f97316',
                data: Object.values(produtosCounts)
            }]
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
</script>