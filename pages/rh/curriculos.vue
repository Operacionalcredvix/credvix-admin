<template>
  <div>
    <header class="mb-8 flex justify-between items-center">
      <h1 class="text-3xl font-bold">Banco de Currículos</h1>
    </header>

    <UCard class="mb-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <UFormGroup label="Buscar por Nome" name="search">
          <UInput v-model="searchTerm" placeholder="Nome do candidato..." icon="i-heroicons-magnifying-glass" />
        </UFormGroup>
        
        <UFormGroup label="Filtrar por Localidade" name="localidade">
          <USelectMenu v-model="selectedLocalidade" :options="localidades" placeholder="Todas as localidades" clearable />
        </UFormGroup>
        
        <UFormGroup label="Filtrar por Categoria" name="categoria">
          <USelectMenu v-model="selectedCategoria" :options="categorias" placeholder="Todas as categorias" clearable />
        </UFormGroup>
      </div>
    </UCard>

    <UCard>
      <UTable :rows="filteredRows || []" :columns="columns" :loading="pending">
        <template #nome_completo-data="{ row }">
          <div>
            <div class="font-medium">{{ row.nome_completo }}</div>
            <div class="text-xs text-gray-500">{{ row.email }}</div>
          </div>
        </template>

        <template #created_at-data="{ row }">
          <span>{{ new Date(row.created_at).toLocaleDateString('pt-BR') }}</span>
        </template>
        
        <template #tipo_candidatura-data="{ row }">
          <UBadge :label="row.tipo_candidatura" variant="subtle" />
        </template>

        <template #actions-data="{ row }">
          <UButton 
            icon="i-heroicons-arrow-down-tray" 
            size="sm" 
            color="gray" 
            variant="ghost" 
            :to="row.curriculo_url"
            target="_blank"
            label="Baixar CV"
          />
        </template>
      </UTable>
    </UCard>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient();

// --- ESTADO DOS FILTROS ---
const searchTerm = ref('');
const selectedLocalidade = ref(null);
const selectedCategoria = ref(null);
const categorias = ['Aberta', 'Banco de Talentos'];

// --- DEFINIÇÃO DAS COLUNAS DA TABELA ---
const columns = [
  { key: 'nome_completo', label: 'Candidato', sortable: true },
  { key: 'vaga', label: 'Vaga de Interesse', sortable: true },
  { key: 'loja', label: 'Localidade' },
  { key: 'tipo_candidatura', label: 'Tipo' },
  { key: 'created_at', label: 'Data de Envio', sortable: true },
  { key: 'actions', label: 'Ações' }
];

// --- CARREGAMENTO DE DADOS ---
const { data: candidatos, pending } = await useAsyncData('candidatos', async () => {
  const { data } = await supabase
    .from('candidatos')
    .select('*')
    .order('created_at', { ascending: false });
  return data;
});

// Extrai as localidades únicas para o filtro a partir dos dados carregados
const localidades = computed(() => {
  if (!candidatos.value) return [];
  const allLocalidades = candidatos.value.map(c => c.loja).filter(Boolean); // Filtra valores nulos
  return [...new Set(allLocalidades)].sort();
});

// --- LÓGICA DE FILTRO ---
const filteredRows = computed(() => {
  if (!candidatos.value) return [];

  let filteredData = [...candidatos.value];

  // Filtro por termo de busca (nome)
  if (searchTerm.value) {
    filteredData = filteredData.filter(candidato =>
      candidato.nome_completo.toLowerCase().includes(searchTerm.value.toLowerCase())
    );
  }

  // Filtro por localidade selecionada
  if (selectedLocalidade.value) {
    filteredData = filteredData.filter(candidato =>
      candidato.loja === selectedLocalidade.value
    );
  }
  
  // Filtro por categoria selecionada
  if (selectedCategoria.value) {
    filteredData = filteredData.filter(candidato =>
      candidato.tipo_candidatura === selectedCategoria.value
    );
  }

  return filteredData;
});
</script>