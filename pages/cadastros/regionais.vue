<template>
  <div>
    <header class="mb-8 flex justify-between items-center">
      <h1 class="text-primary-500 text-3xl font-bold">Gestão de Regionais</h1>
      <UButton icon="i-heroicons-plus-circle" size="lg" @click="openModal()">
        Adicionar Nova Regional
      </UButton>
    </header>

    <UCard>
      <UTable :rows="regionais || []" :columns="columns" :loading="pending">
        <template #actions-data="{ row }">
          <UButton icon="i-heroicons-pencil" size="sm" color="gray" variant="ghost" @click="openModal(row)" />
          <UButton icon="i-heroicons-trash" size="sm" color="red" variant="ghost" @click="handleDelete(row)" />
        </template>
      </UTable>
    </UCard>

    <USlideover v-model="isModalOpen">
      <UCard class="flex flex-col flex-1" :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <h3 class="text-base font-semibold">
            {{ formData.id ? 'Editar Regional' : 'Adicionar Nova Regional' }}
          </h3>
        </template>

        <UForm :state="formData" @submit="handleFormSubmit" class="p-4 space-y-4">
          <UFormGroup label="Nome da Regional" name="nome_regional" required>
            <UInput v-model="formData.nome_regional" placeholder="Ex: Regional Sudeste" />
          </UFormGroup>

          <div class="flex justify-end space-x-2 pt-4">
            <UButton label="Cancelar" color="gray" variant="ghost" @click="isModalOpen = false" />
            <UButton type="submit" :label="formData.id ? 'Salvar Alterações' : 'Criar Regional'" :loading="saving" />
          </div>
        </UForm>
      </UCard>
    </USlideover>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient();
const toast = useToast();

// --- ESTADO DA PÁGINA ---
const isModalOpen = ref(false);
const saving = ref(false);
const getInitialFormData = () => ({
  id: null,
  nome_regional: '',
});
const formData = reactive(getInitialFormData());

// --- DEFINIÇÃO DAS COLUNAS DA TABELA ---
const columns = [
  { key: 'nome_regional', label: 'Nome da Regional', sortable: true },
  { key: 'actions', label: 'Ações' }
];

// --- CARREGAMENTO DE DADOS ---
const { data: regionais, pending, refresh } = await useAsyncData('regionais', async () => {
  const { data } = await supabase.from('regionais').select('*').order('nome_regional');
  return data;
});

// --- LÓGICA DO FORMULÁRIO ---
const openModal = (regional = null) => {
  if (regional) {
    Object.assign(formData, regional);
  } else {
    Object.assign(formData, getInitialFormData());
  }
  isModalOpen.value = true;
};

const handleFormSubmit = async () => {
  saving.value = true;
  try {
    const { id, ...dataToSave } = formData;

    if (id) { // Modo de Edição
      const { error } = await supabase.from('regionais').update(dataToSave).eq('id', id);
      if (error) throw error;
      toast.add({ title: 'Sucesso!', description: 'Regional atualizada.' });
    } else { // Modo de Criação
      const { error } = await supabase.from('regionais').insert(dataToSave);
      if (error) throw error;
      toast.add({ title: 'Sucesso!', description: 'Nova regional criada.' });
    }
    isModalOpen.value = false;
    await refresh();
  } catch (error) {
    toast.add({ title: 'Erro!', description: error.message, color: 'red' });
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (regional) => {
  if (confirm(`Tem a certeza que quer excluir a regional "${regional.nome_regional}"?`)) {
    try {
      const { error } = await supabase.from('regionais').delete().eq('id', regional.id);
      if (error) throw error;
      toast.add({ title: 'Sucesso!', description: 'Regional excluída.' });
      await refresh();
    } catch (error) {
      toast.add({ title: 'Erro!', description: 'Não foi possível excluir. Verifique se esta regional está a ser usada em alguma loja ou funcionário.', color: 'red' });
    }
  }
};
</script>