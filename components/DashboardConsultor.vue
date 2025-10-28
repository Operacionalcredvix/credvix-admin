<template>
  <!-- NOVO: Filtro de Período -->
  <UCard class="mb-8">
    <div class="flex items-end gap-2">
      <UButton icon="i-heroicons-chevron-left-20-solid" color="gray" variant="ghost" @click="changeMonth(-1)" aria-label="Mês anterior" />
      <UFormGroup label="Mês de Referência" name="goalMonth" class="flex-grow">
        <UInput type="month" v-model="selectedPeriod" />
      </UFormGroup>
      <UButton icon="i-heroicons-chevron-right-20-solid" color="gray" variant="ghost" @click="changeMonth(1)" aria-label="Próximo mês" :disabled="isNextMonthDisabled" />
    </div>
  </UCard>

  <div v-if="pending" class="text-center py-10 text-gray-500">
    <UIcon name="i-heroicons-arrow-path" class="text-2xl animate-spin" />
    <p>A carregar seu desempenho...</p>
  </div>

  <div v-else-if="meuDesempenho?.consultor_id" class="mb-8">
    <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Meu Desempenho - {{ new Date(selectedPeriod + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) }}</h2>
    <!-- Card de Meta Individual -->
    <UCard class="mb-6">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-star" class="text-xl text-yellow-400" />
          <h3 class="font-semibold">Minha Meta Individual</h3>
        </div>
      </template>
      <!-- Cards de Produção -->
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      <UCard>
        <GoalProgress :current-value="meuDesempenho.atingido_cnc" :goal-value="meuDesempenho.meta_individual_cnc" title="CNC" />
      </UCard>
      <UCard>
        <GoalProgress :current-value="meuDesempenho.atingido_card" :goal-value="meuDesempenho.meta_individual_card" title="CARD" />
      </UCard>
      <UCard>
        <GoalProgress :current-value="meuDesempenho.atingido_card_beneficio" :goal-value="meuDesempenho.meta_individual_card_beneficio" title="CARD Benef." />
      </UCard>
      <UCard>
        <GoalProgress :current-value="meuDesempenho.atingido_consignado" :goal-value="meuDesempenho.meta_individual_consignado" title="Consignado" />
      </UCard>
      <UCard>
        <GoalProgress :current-value="meuDesempenho.atingido_fgts" :goal-value="meuDesempenho.meta_individual_fgts" title="FGTS" />
      </UCard>
      <UCard>
        <GoalProgress :current-value="meuDesempenho.atingido_bmg_med" :goal-value="meuDesempenho.meta_individual_bmg_med" format-as="number" title="BMG MED" />
      </UCard>
      <UCard>
        <GoalProgress :current-value="meuDesempenho.atingido_seguro_familiar" :goal-value="meuDesempenho.meta_individual_seguro_familiar" format-as="number" title="Seg. Familiar" />
      </UCard>
    </div>
  </UCard>
    <UDivider class="my-8" />

    <!-- NOVA SEÇÃO: META DA LOJA -->
    <div v-if="metaLoja" class="mb-8">
      <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Meta da Loja - {{ metaLoja.loja_nome }}</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UCard class="md:col-span-2">
          <GoalProgress :current-value="consultantContributionToStoreGoal" :goal-value="metaLoja.meta_multi_volume" title="Minha Contribuição para a Meta da Loja" />
        </UCard>
      </div>
      <UDivider class="my-8" />
    </div>

    <!-- Resumo das Posições do Consultor -->
    <UCard class="mb-6">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-trophy" class="text-xl text-primary-500" />
          <h3 class="font-semibold">Suas Posições nos Rankings</h3>
        </div>
      </template>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <UIcon name="i-heroicons-building-office" class="text-2xl text-blue-500 mb-2" />
        <p class="text-xs text-gray-500 mb-2 text-center font-medium">Posição na Loja</p>
        <UBadge v-if="myStoreRank" :color="getRankColor(myStoreRank)" variant="solid" size="lg" class="text-base font-bold">
          <UIcon v-if="myStoreRank <= 3" name="i-heroicons-trophy" class="mr-1" />
          #{{ myStoreRank }}
        </UBadge>
        <span v-else class="text-lg font-bold text-gray-400">—</span>
      </div>
      <div class="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <UIcon name="i-heroicons-map" class="text-2xl text-purple-500 mb-2" />
        <p class="text-xs text-gray-500 mb-2 text-center font-medium">Posição Regional</p>
        <UBadge v-if="myRegionalRank" :color="getRankColor(myRegionalRank)" variant="solid" size="lg" class="text-base font-bold">
          <UIcon v-if="myRegionalRank <= 3" name="i-heroicons-trophy" class="mr-1" />
          #{{ myRegionalRank }}
        </UBadge>
        <span v-else class="text-lg font-bold text-gray-400">—</span>
      </div>
      <div class="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <UIcon name="i-heroicons-globe-americas" class="text-2xl text-green-500 mb-2" />
        <p class="text-xs text-gray-500 mb-2 text-center font-medium">Posição Global</p>
        <UBadge v-if="myGlobalRank" :color="getRankColor(myGlobalRank)" variant="solid" size="lg" class="text-base font-bold">
          <UIcon v-if="myGlobalRank <= 3" name="i-heroicons-trophy" class="mr-1" />
          #{{ myGlobalRank }}
        </UBadge>
        <span v-else class="text-lg font-bold text-gray-400">—</span>
      </div>
      <div class="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <UIcon name="i-heroicons-chart-bar" class="text-2xl text-orange-500 mb-2" />
        <p class="text-xs text-gray-500 mb-2 text-center font-medium">Ranking de Lojas Regional</p>
        <UBadge v-if="myStoreRegionalRank" :color="getRankColor(myStoreRegionalRank)" variant="solid" size="lg" class="text-base font-bold">
          <UIcon v-if="myStoreRegionalRank <= 3" name="i-heroicons-trophy" class="mr-1" />
          #{{ myStoreRegionalRank }}
        </UBadge>
        <span v-else class="text-lg font-bold text-gray-400">—</span>
      </div>
    </div>
  </UCard>

  <!-- Rankings do Consultor: Loja, Regional e Geral em um único componente -->
  <UCard class="mb-8">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h3 class="font-semibold">Rankings</h3>
        <UButton 
          :icon="isRankingUsersExpanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" 
          size="xs" 
          color="gray" 
          variant="ghost"
          @click="isRankingUsersExpanded = !isRankingUsersExpanded"
        />
      </div>
    </template>
    <div v-show="isRankingUsersExpanded">
      <RankingUsers
        v-if="profile.value?.id"
        :consultores="consultores || []"
        :currentUserId="profile.value.id"
        profileType="consultor"
        :lojaId="profile.value.loja_id"
        :regionalId="profile.value.regional_id"
        :formatCurrency="formatCurrency"
        :showStoreRanking="true"
        :showRegionalRanking="true"
        :showGlobalRanking="true"
      />
    </div>
  </UCard>

  <!-- Removido: Tabela de Desempenho por Consultor; deixamos apenas os rankings para o consultor -->

    <!-- NOVO: Gráfico de Pizza -->
    <UCard v-if="hasProductionData" class="mb-8">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="font-semibold">Gráficos de Análise</h3>
          <UButton 
            :icon="isGraficosExpanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" 
            size="xs" 
            color="gray" 
            variant="ghost"
            @click="isGraficosExpanded = !isGraficosExpanded"
          />
        </div>
      </template>
      <div v-show="isGraficosExpanded">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <UCard class="lg:col-span-2">
            <template #header>
              <h3 class="font-semibold">Distribuição da Produção (Valor)</h3>
            </template>
            <div class="h-80">
              <Pie :data="pieChartData" :options="chartOptions" />
            </div>
          </UCard>
        </div>
      </div>
    </UCard>
  </div>
  <div v-else class="text-center py-10 text-gray-500">
    <UIcon name="i-heroicons-trophy" class="text-4xl" />
    <p class="mt-2">Nenhum dado de desempenho encontrado para o mês atual.</p>
    <p class="text-sm text-gray-400">Verifique se existem metas definidas para a sua loja.</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Pie } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale);

import RankingStores from '~/components/RankingStores.vue';
import RankingUsers from '~/components/RankingUsers.vue';

const supabase = useSupabaseClient();
const { profile } = useProfile();
const { formatCurrency, getPercentageColor } = useGoalCalculations();

// --- NOVO: Estado para o filtro de período ---
const selectedPeriod = ref(new Date().toISOString().slice(0, 7)); // Formato YYYY-MM

// Estados de expansão dos cards
const isRankingUsersExpanded = ref(true);
const isGraficosExpanded = ref(true);

// --- NOVO: Lógica para desabilitar o botão "Próximo Mês" ---
const isNextMonthDisabled = computed(() => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  return selectedPeriod.value >= currentMonth;
});

/**
 * Altera o mês selecionado para o anterior ou próximo.
 * @param {number} direction -1 para mês anterior, 1 para próximo mês.
 */
const changeMonth = (direction) => {
  const [year, month] = selectedPeriod.value.split('-').map(Number);
  // O construtor do Date lida com o overflow/underflow de meses (e.g., mês 0 vira Dezembro do ano anterior)
  const newDate = new Date(year, month - 1 + direction, 2); // Usa dia 2 para evitar bugs de fuso horário
  const newYear = newDate.getFullYear();
  const newMonth = (newDate.getMonth() + 1).toString().padStart(2, '0');
  selectedPeriod.value = `${newYear}-${newMonth}`;
};

const { data: meuDesempenho, pending } = await useAsyncData('meu-desempenho-pessoal', async () => {
  if (profile.value?.perfis?.nome !== 'Consultor' || !profile.value.id) {
    return null;
  }

  // Define o período com base no filtro
  const periodDate = new Date(selectedPeriod.value + '-02'); // Usa dia 2 para evitar problemas de fuso horário
  const firstDayOfMonth = new Date(periodDate.getFullYear(), periodDate.getMonth(), 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 0).toISOString().split('T')[0];

  // 1. Busca os valores ATINGIDOS pelo consultor no mês, independentemente de ter meta ou não.
  const [atingidoContratosRes, atingidoVendasExternasRes] = await Promise.all([
    supabase
      .from('contratos')
      .select('valor_total, produtos!inner(categoria_meta)')
      .eq('consultor_id', profile.value.id)
      .eq('status', 'Pago')
      .gte('data_pagamento', firstDayOfMonth)
      .lte('data_pagamento', lastDayOfMonth),
    supabase
      .from('vendas_externas')
      .select('quantidade, tipo_produto')
      .eq('consultor_id', profile.value.id)
      .gte('data_venda', firstDayOfMonth)
      .lte('data_venda', lastDayOfMonth)
  ]);

  // Calcula os totais atingidos
  const atingido = {
    atingido_cnc: atingidoContratosRes.data?.filter(c => c.produtos.categoria_meta === 'CNC').reduce((sum, c) => sum + c.valor_total, 0) || 0,
    atingido_card: atingidoContratosRes.data?.filter(c => c.produtos.categoria_meta === 'CARD').reduce((sum, c) => sum + c.valor_total, 0) || 0,
    atingido_card_beneficio: atingidoContratosRes.data?.filter(c => c.produtos.categoria_meta === 'CARD BENEFÍCIO').reduce((sum, c) => sum + c.valor_total, 0) || 0,
    atingido_consignado: atingidoContratosRes.data?.filter(c => c.produtos.categoria_meta === 'CONSIGNADO').reduce((sum, c) => sum + c.valor_total, 0) || 0,
    atingido_fgts: atingidoContratosRes.data?.filter(c => c.produtos.categoria_meta === 'FGTS').reduce((sum, c) => sum + c.valor_total, 0) || 0,
    atingido_bmg_med: atingidoVendasExternasRes.data?.filter(v => v.tipo_produto === 'bmg_med').reduce((sum, v) => sum + v.quantidade, 0) || 0,
    atingido_seguro_familiar: atingidoVendasExternasRes.data?.filter(v => v.tipo_produto === 'seguro_familiar').reduce((sum, v) => sum + v.quantidade, 0) || 0,
  };

  // 2. Tenta buscar as METAS individuais da view.
    const { data: metas, error: metasError } = await supabase
      .from('desempenho_consultores')
      .select('periodo, meta_individual_cnc, meta_individual_card, meta_individual_card_beneficio, meta_individual_consignado, meta_individual_fgts, meta_individual_bmg_med, meta_individual_seguro_familiar')
      .eq('consultor_id', profile.value.id)
      .eq('periodo', firstDayOfMonth)
      .maybeSingle(); // .maybeSingle() não retorna erro se não encontrar nada
  
  // Se houver erro (view não existe), log no console
  if (metasError) {
    console.warn('⚠️ View desempenho_consultores não encontrada. Execute o script de migração do banco.', metasError);
  }

  // 3. Combina os resultados. Se não houver metas, os valores de meta serão 0.
  return {
    consultor_id: profile.value.id,
    periodo: metas?.periodo || firstDayOfMonth,
    ...atingido,
    meta_individual_cnc: metas?.meta_individual_cnc || 0,
    meta_individual_card: metas?.meta_individual_card || 0,
    meta_individual_card_beneficio: metas?.meta_individual_card_beneficio || 0,
    meta_individual_consignado: metas?.meta_individual_consignado || 0,
    meta_individual_fgts: metas?.meta_individual_fgts || 0,
    meta_individual_bmg_med: metas?.meta_individual_bmg_med || 0,
    meta_individual_seguro_familiar: metas?.meta_individual_seguro_familiar || 0,
  };
}, { watch: [selectedPeriod, profile] }); // Adiciona o filtro ao watch

const { data: metaLoja } = await useAsyncData('meta-loja-consultor', async () => {
  if (profile.value?.perfis?.nome !== 'Consultor' || !profile.value.loja_id) {
    return null;
  }

  const firstDayOfMonth = `${selectedPeriod.value}-01`;

  const { data } = await supabase
    .from('metas_progresso')
    .select('*')
    .eq('loja_id', profile.value.loja_id)
    .eq('periodo', firstDayOfMonth)
    .maybeSingle();
  return data;
}, { watch: [selectedPeriod, profile] }); // Adiciona o filtro ao watch

// Busca metas de todas as lojas para o período (usado para posição global/regional)
const { data: metasAllStores } = await useAsyncData('metas-progresso-all-stores-for-consultor', async () => {
  if (!selectedPeriod.value) return [];
  const firstDayOfMonth = `${selectedPeriod.value}-01`;
  const { data } = await supabase.from('metas_progresso').select('*').eq('periodo', firstDayOfMonth);
  return data || [];
}, { watch: [selectedPeriod] });
// (Removed invalid pseudo-JSX lines; only valid code should be in <script setup>)
// --- BUSCA DE CONSULTORES (para ranking de usuários) ---
  const { data: consultores } = await useAsyncData('consultores-ranking-consultor', async () => {
  if (!selectedPeriod.value) return [];
  const firstDayOfMonth = `${selectedPeriod.value}-01`;
  // Alinha a seleção de campos com o DashboardMaster (inclui metas individuais)
  const { data, error } = await supabase.from('desempenho_consultores').select('consultor_id, consultor_nome, loja_id, loja_nome, regional_id, nome_regional, atingido_cnc, meta_individual_cnc, atingido_card, meta_individual_card, atingido_card_beneficio, meta_individual_card_beneficio, atingido_consignado, meta_individual_consignado, atingido_fgts, meta_individual_fgts').eq('periodo', firstDayOfMonth);
  
  // Se houver erro (view não existe), retorna array vazio e avisa
  if (error) {
    console.warn('⚠️ View desempenho_consultores não encontrada. Execute o script de migração do banco.', error);
    return [];
  }
  
  const result = (data || []).map(c => ({
    ...c,
    total_producao: (c.atingido_cnc || 0) + (c.atingido_card || 0) + (c.atingido_card_beneficio || 0) + (c.atingido_consignado || 0) + (c.atingido_fgts || 0)
  }));
  // Se o consultor logado não estiver presente (sem produção e sem meta), adicionamos um registro sintético
  const includesLogged = result.some(r => String(r.consultor_id) === String(profile.value?.id));
  try { console.debug('[consultores-ranking-consultor]', result.length, 'includesLoggedUser=', includesLogged); } catch (e) {}
  if (!includesLogged && profile.value?.id && meuDesempenho?.value) {
    const synthetic = {
      consultor_id: profile.value.id,
      consultor_nome: profile.value.nome_completo || profile.value.name || 'Você',
      loja_id: profile.value.loja_id,
      loja_nome: profile.value.loja_nome || null,
      regional_id: profile.value.regional_id,
      nome_regional: profile.value.nome_regional || null,
      atingido_cnc: meuDesempenho.value.atingido_cnc || 0,
      atingido_card: meuDesempenho.value.atingido_card || 0,
      atingido_card_beneficio: meuDesempenho.value.atingido_card_beneficio || 0,
      atingido_consignado: meuDesempenho.value.atingido_consignado || 0,
      atingido_fgts: meuDesempenho.value.atingido_fgts || 0,
      meta_individual_cnc: meuDesempenho.value.meta_individual_cnc || 0,
      meta_individual_card: meuDesempenho.value.meta_individual_card || 0,
      meta_individual_card_beneficio: meuDesempenho.value.meta_individual_card_beneficio || 0,
      meta_individual_consignado: meuDesempenho.value.meta_individual_consignado || 0,
      meta_individual_fgts: meuDesempenho.value.meta_individual_fgts || 0,
      total_producao: (meuDesempenho.value.atingido_cnc || 0) + (meuDesempenho.value.atingido_card || 0) + (meuDesempenho.value.atingido_card_beneficio || 0) + (meuDesempenho.value.atingido_consignado || 0) + (meuDesempenho.value.atingido_fgts || 0)
    };
    result.push(synthetic);
  }
  return result;
}, { watch: [selectedPeriod] });

// --- NOVO: Calcula a contribuição do consultor para a meta da loja ---
const consultantContributionToStoreGoal = computed(() => {
  if (!meuDesempenho.value) return 0;
  // Soma todos os valores atingidos de produtos que contam para o Multi Volume
  return (meuDesempenho.value.atingido_cnc || 0) + (meuDesempenho.value.atingido_card || 0) + (meuDesempenho.value.atingido_card_beneficio || 0) + (meuDesempenho.value.atingido_consignado || 0) + (meuDesempenho.value.atingido_fgts || 0);
});

// Evita acessar profile.value.loja_id direto na template quando profile.value ainda for undefined
const currentStoreId = computed(() => profile?.value?.loja_id ?? null);

// --- LÓGICA DO GRÁFICO DE PIZZA ---
const hasProductionData = computed(() => {
  if (!meuDesempenho.value) return false;
  const totalProduction = meuDesempenho.value.atingido_cnc + meuDesempenho.value.atingido_card + meuDesempenho.value.atingido_card_beneficio + meuDesempenho.value.atingido_consignado + meuDesempenho.value.atingido_fgts;
  return totalProduction > 0;
});

const pieChartData = computed(() => {
  if (!hasProductionData.value) return { labels: [], datasets: [] };

  const data = {
    'CNC': meuDesempenho.value.atingido_cnc,
    'CARD': meuDesempenho.value.atingido_card,
    'CARD Benefício': meuDesempenho.value.atingido_card_beneficio,
    'Consignado': meuDesempenho.value.atingido_consignado,
    'FGTS': meuDesempenho.value.atingido_fgts,
  };

  const filteredData = Object.entries(data).filter(([, value]) => value > 0);

  return {
    labels: filteredData.map(([label]) => label),
    datasets: [{
      backgroundColor: ['#3b82f6', '#22c55e', '#ef4444', '#eab308', '#8b5cf6'],
      data: filteredData.map(([, value]) => value)
    }]
  };
});

const chartOptions = { responsive: true, maintainAspectRatio: false };
// (Tabela de desempenho removida; usamos apenas os rankings para consultores)

// --- POSIÇÕES DO CONSULTOR (Loja, Regional, Geral) ---
const myUserId = computed(() => profile?.value?.id ?? null);

const myGlobalRank = computed(() => {
  const list = consultores.value || [];
  if (!myUserId.value || list.length === 0) return null;
  const sorted = list.slice().sort((a, b) => (b.total_producao || 0) - (a.total_producao || 0));
  const idx = sorted.findIndex(c => String(c.consultor_id) === String(myUserId.value));
  return idx === -1 ? null : idx + 1;
});

const myRegionalRank = computed(() => {
  const list = (consultores.value || []).filter(c => String(c.regional_id) === String(profile?.value?.regional_id));
  if (!myUserId.value || list.length === 0) return null;
  const sorted = list.slice().sort((a, b) => (b.total_producao || 0) - (a.total_producao || 0));
  const idx = sorted.findIndex(c => String(c.consultor_id) === String(myUserId.value));
  return idx === -1 ? null : idx + 1;
});

const myStoreRank = computed(() => {
  const list = (consultores.value || []).filter(c => String(c.loja_id) === String(profile?.value?.loja_id));
  if (!myUserId.value || list.length === 0) return null;
  const sorted = list.slice().sort((a, b) => (b.total_producao || 0) - (a.total_producao || 0));
  const idx = sorted.findIndex(c => String(c.consultor_id) === String(myUserId.value));
  return idx === -1 ? null : idx + 1;
});

// Posição da loja do consultor no ranking regional de lojas
const myStoreRegionalRank = computed(() => {
  const stores = metasAllStores.value || [];
  if (!profile?.value?.loja_id || !profile?.value?.regional_id || stores.length === 0) return null;
  
  // Filtra lojas da mesma regional
  const regionalStores = stores.filter(s => String(s.regional_id) === String(profile.value.regional_id));
  if (regionalStores.length === 0) return null;
  
  // Ordena por percentual atingido
  const sorted = regionalStores.slice().sort((a, b) => {
    const percentA = (a.atingido_multi_volume || 0) / (a.meta_multi_volume || 1) * 100;
    const percentB = (b.atingido_multi_volume || 0) / (b.meta_multi_volume || 1) * 100;
    return percentB - percentA;
  });
  
  // Encontra a posição da loja do consultor
  const idx = sorted.findIndex(s => String(s.loja_id) === String(profile.value.loja_id));
  return idx === -1 ? null : idx + 1;
});

// Função para retornar cor da posição (ouro/prata/bronze/cinza)
const getRankColor = (rank) => {
  if (!rank) return 'gray';
  if (rank === 1) return 'yellow'; // Ouro
  if (rank === 2) return 'gray'; // Prata
  if (rank === 3) return 'orange'; // Bronze
  return 'primary'; // Demais posições
};

</script>