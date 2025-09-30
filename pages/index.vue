<template>
  <div>
    <header class="mb-8">
      <h1 class=" text-primary-500 text-3xl font-bold">Dashboard de Produção</h1>
      <p class="mt-1 text-gray-500">
        Olá, {{ profile?.nome_completo }}! Aqui está um resumo da atividade.
      </p>
    </header>

    <UCard class="mb-8">
      <div class="flex items-center gap-4">
        <UFormGroup label="Período de:" name="startDate">
          <UInput type="date" v-model="startDate" />
        </UFormGroup>
        <UFormGroup label="Até:" name="endDate">
          <UInput type="date" v-model="endDate" />
        </UFormGroup>
        <div class="pt-6">
          <UButton @click="resetDateFilter" label="Mês Atual" color="gray" variant="ghost" />
        </div>
      </div>
    </UCard>

    <div v-if="pending" class="text-center text-gray-500">A carregar dados do dashboard...</div>
    
    <div v-else>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
            <UIcon name="i-heroicons-x-circle" class="text-3xl text-red-500" />
            <div>
              <p class="text-sm text-gray-500">Contratos Cancelados</p>
              <p class="text-2xl font-bold">{{ stats.contratosCancelados }}</p>
            </div>
          </div>
        </UCard>
        
        <UCard>
          <div class="flex items-center gap-4">
            <UIcon name="i-heroicons-banknotes" class="text-3xl text-green-400" />
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
          <p v-else class="text-center text-gray-500">Sem dados para exibir no período selecionado.</p>
        </UCard>
        
        <UCard>
          <template #header><h3 class="font-semibold">Contratos por Produto</h3></template>
          <div v-if="chartData.produtos.labels.length > 0">
            <Bar :data="chartData.produtos" :options="chartOptions" />
          </div>
          <p v-else class="text-center text-gray-500">Sem dados para exibir no período selecionado.</p>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Bar, Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

const supabase = useSupabaseClient();
const { profile } = useProfile();

// --- LÓGICA DE DATAS ---
const getFormattedDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getInitialDates = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: getFormattedDate(firstDay),
    end: getFormattedDate(lastDay)
  };
};

const startDate = ref(getInitialDates().start);
const endDate = ref(getInitialDates().end);

const resetDateFilter = () => {
  const { start, end } = getInitialDates();
  startDate.value = start;
  endDate.value = end;
};


// --- BUSCA DE DADOS COM FILTRO DE DATA E PERMISSÃO ---
const { data: contratos, pending } = useAsyncData(
  `dashboard-contratos-${profile.value?.id}`, 
  async () => {
    if (!profile.value?.id) return [];

    let query = supabase
      .from('contratos')
      .select('status, valor_total, loja_id, consultor_id, produtos(nome)');
      
    const userProfileName = profile.value.perfis?.nome;
    switch (userProfileName) {
      case 'Coordenador': {
        const { data: lojasDaRegional } = await supabase.from('lojas').select('id').eq('regional_id', profile.value.regional_id);
        const idsLojas = lojasDaRegional?.map(l => l.id) || [];
        if (idsLojas.length > 0) query = query.in('loja_id', idsLojas);
        else return []; 
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
    if (startDate.value) query = query.gte('data_contrato', startDate.value);
    if (endDate.value) query = query.lte('data_contrato', endDate.value);

    const { data } = await query;
    return data || [];
  },
  {
    // Re-executa a busca quando o perfil ou as datas mudarem
    watch: [profile, startDate, endDate]
  }
);


// --- CÁLCULOS PARA AS ESTATÍSTICAS E GRÁFICOS ---
const stats = computed(() => {
  if (!contratos.value || contratos.value.length === 0) {
    return { totalContratos: 0, contratosPagos: 0, contratosPendentes: 0, contratosCancelados: 0, valorTotalPago: 0 };
  }
  const pagos = contratos.value.filter(c => c.status === 'Pago');
  const pendentes = contratos.value.filter(c => c.status === 'Pendente' || c.status === 'Em Análise');
  const cancelados = contratos.value.filter(c => c.status === 'Cancelado' || c.status === 'Reprovado');

  return {
    totalContratos: contratos.value.length,
    contratosPagos: pagos.length,
    contratosPendentes: pendentes.length,
    contratosCancelados: cancelados.length,
    valorTotalPago: pagos.reduce((sum, c) => sum + (c.valor_total || 0), 0)
  };
});

const chartData = computed(() => {
    if (!contratos.value || contratos.value.length === 0) {
      return { status: { labels: [], datasets: [] }, produtos: { labels: [], datasets: [] } };
    }
    
    const statusCounts = contratos.value.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
    }, {});
    
    const produtosCounts = contratos.value.reduce((acc, c) => {
        const nomeProduto = c.produtos?.nome || 'Não identificado';
        acc[nomeProduto] = (acc[nomeProduto] || 0) + 1;
        return acc;
    }, {});

    const statusLabels = Object.keys(statusCounts);
    const statusColors = statusLabels.map(label => {
        switch (label) {
            case 'Pago': case 'Aprovado': return '#10b981'; // Verde
            case 'Pendente': case 'Em Análise': return '#f59e0b'; // Ambar
            case 'Cancelado': case 'Reprovado': return '#ef4444'; // Vermelho
            default: return '#6b7280'; // Cinza
        }
    });

    return {
        status: {
            labels: statusLabels,
            datasets: [{ backgroundColor: statusColors, data: Object.values(statusCounts) }]
        },
        produtos: {
            labels: Object.keys(produtosCounts),
            datasets: [{ label: 'Quantidade de Contratos', backgroundColor: '#f97316', data: Object.values(produtosCounts) }]
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