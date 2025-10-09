<template>
  <div v-if="pending" class="text-center py-10 text-gray-500">
    <UIcon name="i-heroicons-arrow-path" class="text-2xl animate-spin" />
    <p>A carregar seu desempenho...</p>
  </div>

  <div v-else-if="meuDesempenho?.consultor_id" class="mb-8">
    <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Meu Desempenho - {{ new Date(meuDesempenho.periodo).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }) }}</h2>
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      <!-- CNC -->
      <UCard>
        <div class="flex justify-between items-start">
          <h3 class="text-sm font-medium text-gray-500">CNC</h3>
          <span class="font-bold text-sm" :class="getPercentageColor(calculatePercentage(meuDesempenho.atingido_cnc, meuDesempenho.meta_individual_cnc))">{{ calculatePercentage(meuDesempenho.atingido_cnc, meuDesempenho.meta_individual_cnc).toFixed(1) }}%</span>
        </div>
        <p class="text-xl font-bold mt-1">{{ formatCurrency(meuDesempenho.atingido_cnc) }}</p>
        <p class="text-xs text-gray-400">Meta: {{ formatCurrency(meuDesempenho.meta_individual_cnc) }}</p>
        <UProgress :value="calculatePercentage(meuDesempenho.atingido_cnc, meuDesempenho.meta_individual_cnc)" class="mt-2" />
      </UCard>
      <!-- CARD -->
      <UCard>
        <div class="flex justify-between items-start">
          <h3 class="text-sm font-medium text-gray-500">CARD</h3>
          <span class="font-bold text-sm" :class="getPercentageColor(calculatePercentage(meuDesempenho.atingido_card, meuDesempenho.meta_individual_card))">{{ calculatePercentage(meuDesempenho.atingido_card, meuDesempenho.meta_individual_card).toFixed(1) }}%</span>
        </div>
        <p class="text-xl font-bold mt-1">{{ formatCurrency(meuDesempenho.atingido_card) }}</p>
        <p class="text-xs text-gray-400">Meta: {{ formatCurrency(meuDesempenho.meta_individual_card) }}</p>
        <UProgress :value="calculatePercentage(meuDesempenho.atingido_card, meuDesempenho.meta_individual_card)" class="mt-2" />
      </UCard>
      <!-- CARD Benef. -->
      <UCard>
        <div class="flex justify-between items-start">
          <h3 class="text-sm font-medium text-gray-500">CARD Benef.</h3>
          <span class="font-bold text-sm" :class="getPercentageColor(calculatePercentage(meuDesempenho.atingido_card_beneficio, meuDesempenho.meta_individual_card_beneficio))">{{ calculatePercentage(meuDesempenho.atingido_card_beneficio, meuDesempenho.meta_individual_card_beneficio).toFixed(1) }}%</span>
        </div>
        <p class="text-xl font-bold mt-1">{{ formatCurrency(meuDesempenho.atingido_card_beneficio) }}</p>
        <p class="text-xs text-gray-400">Meta: {{ formatCurrency(meuDesempenho.meta_individual_card_beneficio) }}</p>
        <UProgress :value="calculatePercentage(meuDesempenho.atingido_card_beneficio, meuDesempenho.meta_individual_card_beneficio)" class="mt-2" />
      </UCard>
      <!-- Consignado -->
      <UCard>
        <div class="flex justify-between items-start">
          <h3 class="text-sm font-medium text-gray-500">Consignado</h3>
          <span class="font-bold text-sm" :class="getPercentageColor(calculatePercentage(meuDesempenho.atingido_consignado, meuDesempenho.meta_individual_consignado))">{{ calculatePercentage(meuDesempenho.atingido_consignado, meuDesempenho.meta_individual_consignado).toFixed(1) }}%</span>
        </div>
        <p class="text-xl font-bold mt-1">{{ formatCurrency(meuDesempenho.atingido_consignado) }}</p>
        <p class="text-xs text-gray-400">Meta: {{ formatCurrency(meuDesempenho.meta_individual_consignado) }}</p>
        <UProgress :value="calculatePercentage(meuDesempenho.atingido_consignado, meuDesempenho.meta_individual_consignado)" class="mt-2" />
      </UCard>
      <!-- FGTS -->
      <UCard>
        <div class="flex justify-between items-start">
          <h3 class="text-sm font-medium text-gray-500">FGTS</h3>
          <span class="font-bold text-sm" :class="getPercentageColor(calculatePercentage(meuDesempenho.atingido_fgts, meuDesempenho.meta_individual_fgts))">{{ calculatePercentage(meuDesempenho.atingido_fgts, meuDesempenho.meta_individual_fgts).toFixed(1) }}%</span>
        </div>
        <p class="text-xl font-bold mt-1">{{ formatCurrency(meuDesempenho.atingido_fgts) }}</p>
        <p class="text-xs text-gray-400">Meta: {{ formatCurrency(meuDesempenho.meta_individual_fgts) }}</p>
        <UProgress :value="calculatePercentage(meuDesempenho.atingido_fgts, meuDesempenho.meta_individual_fgts)" class="mt-2" />
      </UCard>
      <!-- BMG MED -->
      <UCard>
        <div class="flex justify-between items-start">
          <h3 class="text-sm font-medium text-gray-500">BMG MED</h3>
          <span class="font-bold text-sm" :class="getPercentageColor(calculatePercentage(meuDesempenho.atingido_bmg_med, meuDesempenho.meta_individual_bmg_med))">{{ calculatePercentage(meuDesempenho.atingido_bmg_med, meuDesempenho.meta_individual_bmg_med).toFixed(1) }}%</span>
        </div>
        <p class="text-xl font-bold mt-1">{{ meuDesempenho.atingido_bmg_med }}</p>
        <p class="text-xs text-gray-400">Meta: {{ meuDesempenho.meta_individual_bmg_med }}</p>
        <UProgress :value="calculatePercentage(meuDesempenho.atingido_bmg_med, meuDesempenho.meta_individual_bmg_med)" class="mt-2" />
      </UCard>
      <!-- Seg. Familiar -->
      <UCard>
        <div class="flex justify-between items-start">
          <h3 class="text-sm font-medium text-gray-500">Seg. Familiar</h3>
          <span class="font-bold text-sm" :class="getPercentageColor(calculatePercentage(meuDesempenho.atingido_seguro_familiar, meuDesempenho.meta_individual_seguro_familiar))">{{ calculatePercentage(meuDesempenho.atingido_seguro_familiar, meuDesempenho.meta_individual_seguro_familiar).toFixed(1) }}%</span>
        </div>
        <p class="text-xl font-bold mt-1">{{ meuDesempenho.atingido_seguro_familiar }}</p>
        <p class="text-xs text-gray-400">Meta: {{ meuDesempenho.meta_individual_seguro_familiar }}</p>
        <UProgress :value="calculatePercentage(meuDesempenho.atingido_seguro_familiar, meuDesempenho.meta_individual_seguro_familiar)" class="mt-2" />
      </UCard>
    </div>
    <UDivider class="my-8" />

    <!-- NOVA SEÇÃO: META DA LOJA -->
    <div v-if="metaLoja" class="mb-8">
      <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Meta da Loja - {{ metaLoja.loja_nome }}</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UCard>
          <h3 class="text-sm font-medium text-gray-500">Meta Multi Volume</h3>
          <p class="text-xl font-bold mt-1">{{ formatCurrency(metaLoja.meta_multi_volume) }}</p>
        </UCard>
        <UCard>
          <h3 class="text-sm font-medium text-gray-500">Atingido Multi Volume</h3>
          <p class="text-xl font-bold mt-1">{{ formatCurrency(metaLoja.atingido_multi_volume) }}</p>
        </UCard>
        <UCard>
          <div class="w-full">
            <p class="text-center font-bold text-lg" :class="getPercentageColor(metaLoja.percentual_multi_volume)">
              {{ metaLoja.percentual_multi_volume.toFixed(2) }}%
            </p>
            <UProgress :value="metaLoja.percentual_multi_volume" class="mt-2" />
            <p class="text-xs text-gray-500 text-center mt-1">
              {{ formatCurrency(metaLoja.atingido_multi_volume) }} / {{ formatCurrency(metaLoja.meta_multi_volume) }}
            </p>
          </div>
        </UCard>
      </div>
      <UDivider class="my-8" />
    </div>

  </div>
</template>

<script setup>
const supabase = useSupabaseClient();
const { profile } = useProfile();

const { data: meuDesempenho, pending } = await useAsyncData('meu-desempenho-pessoal', async () => {
  if (profile.value?.perfis?.nome !== 'Consultor' || !profile.value.id) {
    return null;
  }

  // Define o período atual
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

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
  const { data: metas } = await supabase
    .from('desempenho_consultores')
    .select('periodo, meta_individual_cnc, meta_individual_card, meta_individual_card_beneficio, meta_individual_consignado, meta_individual_fgts, meta_individual_bmg_med, meta_individual_seguro_familiar')
    .eq('consultor_id', profile.value.id)
    .eq('periodo', firstDayOfMonth)
    .maybeSingle(); // .maybeSingle() não dá erro se não encontrar nada, retorna null.

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
});

const { data: metaLoja } = await useAsyncData('meta-loja-consultor', async () => {
  if (profile.value?.perfis?.nome !== 'Consultor' || !profile.value.loja_id) {
    return null;
  }

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];

  const { data } = await supabase
    .from('metas_progresso')
    .select('*')
    .eq('loja_id', profile.value.loja_id)
    .eq('periodo', firstDayOfMonth)
    .maybeSingle();
  return data;
});

const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const calculatePercentage = (atingido, meta) => {
  if (!meta || meta === 0) {
    return atingido > 0 ? 100 : 0; // Se não há meta, mas produziu algo, considera 100%
  }
  return (atingido / meta) * 100;
};

const getPercentageColor = (percentage) => {
  if (percentage >= 100) return 'text-green-500';
  if (percentage >= 75) return 'text-yellow-500';
  return 'text-red-500';
};
</script>