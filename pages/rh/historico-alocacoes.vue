<template>
  <div>
    <header class="mb-8">
      <h1 class="text-primary-500 text-3xl font-bold">Relatório de Histórico de Alocações</h1>
      <p class="text-gray-500 mt-1">Pesquise por um funcionário para ver seu histórico de mudanças de perfil e loja.</p>
    </header>

    <UCard class="mb-8">
      <template #header>
        <h3 class="text-lg font-semibold">Buscar Funcionário</h3>
      </template>
      <div class="flex flex-col gap-4">
        <UFormGroup label="Buscar por Nome ou CPF" name="search">
          <UInput 
            v-model="searchTerm" 
            placeholder="Digite o nome ou CPF do funcionário..."
            icon="i-heroicons-magnifying-glass"
            size="lg"
          />
        </UFormGroup>

        <UTable 
          v-if="searchResults.length > 0"
          :rows="searchResults" 
          :columns="searchColumns" 
          :loading="searching"
        >
          <template #actions-data="{ row }">
            <UButton 
              label="Ver Histórico"
              size="sm" 
              @click="selectEmployee(row)" 
            />
          </template>
        </UTable>
      </div>
    </UCard>

    <div v-if="selectedEmployee">
      <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
        Histórico de: <span class="text-primary-500">{{ selectedEmployee.nome_completo }}</span>
      </h2>
      <UCard>
        <UTable 
          :rows="allocationHistory" 
          :columns="historyColumns" 
          :loading="loadingHistory"
          :empty-state="{ icon: 'i-heroicons-archive-box-x-mark', label: 'Nenhum histórico de alocação encontrado.' }"
        >
           <template #data_inicio-data="{ row }">
            <span>{{ new Date(row.data_inicio).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) }}</span>
          </template>
          <template #data_fim-data="{ row }">
            <span v-if="row.data_fim">{{ new Date(row.data_fim).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) }}</span>
            <UBadge v-else color="green" variant="subtle" label="Atual" />
          </template>
        </UTable>
      </UCard>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';

definePageMeta({
  middleware: 'auth',
  profiles: ['Master','Diretoria','Gerência', 'RH'] // Master-like e RH podem acessar
});

const supabase = useSupabaseClient();
const toast = useToast();

// --- Estado da Busca ---
const searchTerm = ref('');
const searching = ref(false);
const searchResults = ref([]);
const searchColumns = [
  { key: 'nome_completo', label: 'Nome' },
  { key: 'cpf', label: 'CPF' },
  { key: 'actions', label: 'Ações', class: 'text-right' }
];

// --- Estado do Histórico ---
const selectedEmployee = ref(null);
const loadingHistory = ref(false);
const allocationHistory = ref([]);
const historyColumns = [
  { key: 'perfis.nome', label: 'Perfil' },
  { key: 'lojas.nome', label: 'Loja' },
  { key: 'data_inicio', label: 'Data de Início' },
  { key: 'data_fim', label: 'Data de Fim' }
];

// --- Lógica de Busca de Funcionário ---
watch(searchTerm, useDebounceFn(async (newVal) => {
  if (newVal.length < 3) {
    searchResults.value = [];
    return;
  }
  searching.value = true;
  const { data, error } = await supabase
    .from('funcionarios')
    .select('id, nome_completo, cpf')
    .or(`nome_completo.ilike.%${newVal}%,cpf.ilike.%${newVal}%`)
    .limit(10);

  if (error) {
    toast.add({ title: 'Erro na busca', description: error.message, color: 'red' });
  } else {
    searchResults.value = data || [];
  }
  searching.value = false;
}, 300));

// --- Lógica para Selecionar Funcionário e Buscar Histórico ---
const selectEmployee = async (employee) => {
  selectedEmployee.value = employee;
  loadingHistory.value = true;
  allocationHistory.value = [];

  const { data, error } = await supabase
    .from('historico_alocacoes')
    .select('data_inicio, data_fim, perfis(nome), lojas(nome)')
    .eq('funcionario_id', employee.id)
    .order('data_inicio', { ascending: false });

  if (error) {
    toast.add({ title: 'Erro ao buscar histórico', description: error.message, color: 'red' });
  } else {
    allocationHistory.value = data || [];
  }
  loadingHistory.value = false;
};
</script>