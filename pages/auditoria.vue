<template>
  <div>
    <header class="mb-8 flex justify-between items-center">
      <h1 class="text-primary-500 text-3xl font-bold">Auditoria do Sistema</h1>
    </header>

    <UCard>
      <template #header>
        <div class="flex items-center gap-4">
          <UFormGroup label="Filtrar por Entidade" name="entidade" class="w-full md:w-1/4">
            <USelectMenu v-model="selectedEntidade" :options="entidades" placeholder="Todas as Entidades" clearable />
          </UFormGroup>
        </div>
      </template>

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

        <template #descricao-data="{ row }">
          <AuditDescription :acao="row.acao" :descricao="row.descricao" :entidade="row.entidade" />
        </template>

        <template #created_at-data="{ row }">
          <span>{{ new Date(row.created_at).toLocaleString('pt-BR') }}</span>
        </template>

      </UTable>

      <template #footer>
        <div class="flex justify-end">
          <UPagination v-model="page" :page-count="pageCount" :total="totalLogs" />
        </div>
      </template>

    </UCard>
  </div>
</template>

<script setup>
// O script permanece o mesmo da versão com paginação
definePageMeta({
  middleware: 'auth-master'
});

const supabase = useSupabaseClient();
const page = ref(1);
const pageCount = ref(15);
const totalLogs = ref(0);
const selectedEntidade = ref(null);

// Busca as entidades distintas para popular o filtro
const { data: entidades } = useAsyncData('auditoria-entidades', async () => {
  // Usamos RPC para uma busca mais eficiente de valores distintos
  const { data, error } = await supabase.rpc('get_distinct_audit_entities');
  if (error) {
    console.error("Erro ao buscar entidades de auditoria:", error);
    return [];
  }
  return data.sort(); // Ordena alfabeticamente
});

const columns = [
  { key: 'autor', label: 'Autor', class: 'w-1/6' },
  { key: 'acao', label: 'Ação', class: 'w-1/12' },
  { key: 'entidade', label: 'Entidade', class: 'w-1/12' },
  { key: 'descricao', label: 'Descrição', class: 'w-2/5' },
  { key: 'created_at', label: 'Quando', sortable: true, class: 'w-1/6' },
];

const { data: auditoriaLogs, pending } = useAsyncData(
  `auditoria-logs`, // A chave agora é mais genérica, pois o watch cuidará da re-execução
  async () => {
    const from = (page.value - 1) * pageCount.value;
    const to = from + pageCount.value - 1;

    let query = supabase
      .from('auditoria')
      .select(`*, funcionarios (nome_completo, avatar_url)`, { count: 'exact' });

    // Adiciona o filtro de entidade à consulta, se uma for selecionada
    if (selectedEntidade.value) {
      query = query.eq('entidade', selectedEntidade.value);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
      
    if (error) {
      console.error("Erro ao buscar auditoria:", error);
      return [];
    }
    
    totalLogs.value = count;
    return data;
  },
  { 
    // A busca será re-executada sempre que a página ou o filtro de entidade mudar
    watch: [page, selectedEntidade] 
  }
);

const getActionColor = (action) => {
  switch (action) {
    case 'INSERT': return 'primary';
    case 'UPDATE': return 'amber';
    case 'DELETE': return 'red';
    default: return 'gray';
  }
};

const formatAction = (action) => {
  switch (action) {
    case 'INSERT': return 'CRIADO';
    case 'UPDATE': return 'ATUALIZADO';
    case 'DELETE': return 'EXCLUÍDO';
    default: return action;
  }
};
</script>