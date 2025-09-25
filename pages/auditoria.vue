<template>
  <div>
    <header class="mb-8 flex justify-between items-center">
      <h1 class="text-3xl font-bold">Auditoria do Sistema</h1>
    </header>

    <UCard>
      <UTable :rows="auditoriaLogs || []" :columns="columns" :loading="pending">

        <template #autor-data="{ row }">
          <div class="flex items-center gap-3">
            <UAvatar :src="row.funcionarios?.avatar_url" :alt="row.funcionarios?.nome_completo" size="sm" />
            <span>{{ row.funcionarios?.nome_completo || 'Sistema' }}</span>
          </div>
        </template>

        <template #acao-data="{ row }">
          <UBadge :label="formatAction(row.acao)" :color="getActionColor(row.acao)" variant="subtle" />
        </template>

        <template #created_at-data="{ row }">
          <span>{{ new Date(row.created_at).toLocaleString('pt-BR') }}</span>
        </template>

      </UTable>
    </UCard>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth-master'
});

const supabase = useSupabaseClient();

// --- DEFINIÇÃO DAS COLUNAS DA TABELA ---
const columns = [
  { key: 'autor', label: 'Autor' },
  { key: 'acao', label: 'Ação' },
  { key: 'entidade', label: 'Entidade' },
  { key: 'descricao', label: 'Descrição' },
  { key: 'created_at', label: 'Quando', sortable: true },
];

// --- CARREGAMENTO DOS DADOS DE AUDITORIA ---
const { data: auditoriaLogs, pending } = await useAsyncData('auditoria', async () => {
  const { data } = await supabase
    .from('auditoria')
    .select(`
      *,
      funcionarios (nome_completo, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(100);
  return data;
});

// --- FUNÇÕES AUXILIARES ---
const getActionColor = (action) => {
  switch (action) {
    case 'INSERT': return 'primary';
    case 'UPDATE': return 'amber';
    case 'DELETE': return 'red';
    default: return 'gray';
  }
};

// --- NOVA FUNÇÃO PARA TRADUZIR A AÇÃO ---
const formatAction = (action) => {
  switch (action) {
    case 'INSERT': return 'CRIADO';
    case 'UPDATE': return 'ATUALIZADO';
    case 'DELETE': return 'EXCLUÍDO';
    default: return action; // Retorna o original se não for um dos esperados
  }
};
</script>