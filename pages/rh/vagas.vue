<template>
  <div>
    <header class="mb-8 flex justify-between items-center">
      <h1 class="text-3xl font-bold">Gestão de Vagas</h1>
      <UButton icon="i-heroicons-plus-circle" size="lg" @click="openModal()">
        Criar Nova Vaga
      </UButton>
    </header>

    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <h2 class="font-semibold text-lg">Vagas Registadas</h2>
          <UInput v-model="searchTerm" placeholder="Filtrar por título ou localidade..." icon="i-heroicons-magnifying-glass" />
        </div>
      </template>

      <UTable :rows="filteredRows || []" :columns="columns" :loading="pending">
        <template #is_active-data="{ row }">
          <UBadge :label="row.is_active ? 'Ativa' : 'Inativa'" :color="row.is_active ? 'primary' : 'red'" variant="subtle" />
        </template>
        <template #actions-data="{ row }">
          <UButton icon="i-heroicons-pencil" size="sm" color="gray" variant="ghost" @click="openModal(row)" />
          <UButton icon="i-heroicons-trash" size="sm" color="red" variant="ghost" @click="handleDelete(row)" />
        </template>
      </UTable>
    </UCard>

    <USlideover v-model="isModalOpen">
      <UCard class="flex flex-col flex-1" :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold">
              {{ formData.id ? 'Editar Vaga' : 'Criar Nova Vaga' }}
            </h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isModalOpen = false" />
          </div>
        </template>

        <UForm :state="formData" @submit="handleFormSubmit" class="p-4 space-y-4">
          <UFormGroup label="Título da Vaga" name="title" required>
            <UInput v-model="formData.title" placeholder="Ex: Gerente de Vendas" />
          </UFormGroup>

          <UFormGroup label="Selecione a Localidade" name="localidade" required>
            <USelectMenu
              v-model="formData.localidade"
              :options="localidades"
              placeholder="Busque por uma cidade ou estado"
              searchable
            />
          </UFormGroup>
          
          <UFormGroup label="Tipo de Contrato" name="type">
            <UInput v-model="formData.type" placeholder="Ex: Tempo Integral" />
          </UFormGroup>

          <UFormGroup label="Descrição da Vaga" name="description">
            <UTextarea v-model="formData.description" :rows="5" />
          </UFormGroup>
          
          <UFormGroup label="Categoria da Vaga" name="job_category" required>
            <USelectMenu v-model="formData.job_category" :options="['Aberta', 'Banco de Talentos']" />
          </UFormGroup>

          <UFormGroup label="Vaga Ativa" name="is_active" class="flex items-center space-x-2">
             <UToggle v-model="formData.is_active" />
          </UFormGroup>

          <div class="flex justify-end space-x-2 pt-4">
             <UButton label="Cancelar" color="gray" variant="ghost" @click="isModalOpen = false" />
             <UButton type="submit" :label="formData.id ? 'Salvar Alterações' : 'Criar Vaga'" :loading="saving" />
          </div>
        </UForm>
      </UCard>
    </USlideover>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth', profiles: ['Master', 'RH'] });


import { ref, reactive, computed } from 'vue';

const supabase = useSupabaseClient();
const toast = useToast();

// --- ESTADO DA PÁGINA ---
const isModalOpen = ref(false);
const saving = ref(false);
const searchTerm = ref('');
const getInitialFormData = () => ({
  id: null,
  title: '',
  localidade: '',
  type: 'Tempo Integral',
  description: '',
  job_category: 'Aberta',
  is_active: true
});
const formData = reactive(getInitialFormData());

// --- DEFINIÇÃO DAS COLUNAS DA TABELA ---
const columns = [
  { key: 'title', label: 'Título da Vaga', sortable: true },
  { key: 'localidade', label: 'Localidade', sortable: true },
  { key: 'job_category', label: 'Categoria' },
  { key: 'is_active', label: 'Status' },
  { key: 'actions', label: 'Ações' }
];

// --- CARREGAMENTO DE DADOS ---
const { data: vagas, pending, refresh } = await useAsyncData('vagas', async () => {
  const { data } = await supabase.from('vagas').select('*').order('created_at', { ascending: false });
  return data;
});

// Busca as cidades das lojas para popular o dropdown de localidades
const { data: lojas } = await useAsyncData('lojas-localidades', async () => {
  const { data } = await supabase.from('lojas').select('city');
  return data;
});

// --- LÓGICA COMPUTADA E AÇÕES ---
const localidades = computed(() => {
  if (!lojas.value) return [];
  // Cria uma lista de cidades únicas e adiciona "Grande Vitória"
  const cidades = [...new Set(lojas.value.map(item => item.city))].sort();
  return ['Grande Vitória', ...cidades];
});

const filteredRows = computed(() => {
  if (!vagas.value) return [];
  if (!searchTerm.value) {
    return vagas.value;
  }
  return vagas.value.filter((vaga) => {
    const searchTermLower = searchTerm.value.toLowerCase();
    return (
      vaga.title.toLowerCase().includes(searchTermLower) ||
      vaga.localidade.toLowerCase().includes(searchTermLower)
    );
  });
});

const openModal = (vaga = null) => {
  if (vaga) {
    Object.assign(formData, vaga);
  } else {
    Object.assign(formData, getInitialFormData());
  }
  isModalOpen.value = true;
};

const handleFormSubmit = async () => {
  saving.value = true;
  try {
    const dataToSave = { ...formData };

    if (dataToSave.id) { // Modo de Edição
      const { error } = await supabase.from('vagas').update(dataToSave).eq('id', dataToSave.id);
      if (error) throw error;
      toast.add({ title: 'Sucesso!', description: 'Vaga atualizada com sucesso.' });
    } else { // Modo de Criação
      delete dataToSave.id;
      const { error } = await supabase.from('vagas').insert(dataToSave);
      if (error) throw error;
      toast.add({ title: 'Sucesso!', description: 'Vaga criada com sucesso.' });
    }
    isModalOpen.value = false;
    await refresh(); // Recarrega os dados da tabela
  } catch (error) {
    console.error('Erro ao salvar vaga:', error);
    toast.add({ title: 'Erro!', description: error.message, color: 'red' });
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (vaga) => {
  if (confirm(`Tem a certeza de que quer excluir a vaga "${vaga.title}"?`)) {
    try {
      const { error } = await supabase.from('vagas').delete().eq('id', vaga.id);
      if (error) throw error;
      toast.add({ title: 'Sucesso!', description: 'Vaga excluída.' });
      await refresh();
    } catch (error) {
      console.error('Erro ao excluir vaga:', error);
      toast.add({ title: 'Erro!', description: error.message, color: 'red' });
    }
  }
};
</script>