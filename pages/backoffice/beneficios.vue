<template>
  <div>
    <header class="mb-8 flex justify-between items-center">
      <h1 class="text-primary-500 text-3xl font-bold">Gestão de Benefícios</h1>
      <UButton icon="i-heroicons-plus-circle" size="lg" @click="openModal()">
        Adicionar Novo Benefício
      </UButton>
    </header>

    <UCard>
      <UTable :rows="beneficios || []" :columns="columns" :loading="pending">
        <template #is_active-data="{ row }">
          <UBadge :label="row.is_active ? 'Ativo' : 'Inativo'" :color="row.is_active ? 'primary' : 'red'" variant="subtle" />
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
          <h3 class="text-base font-semibold">
            {{ formData.id ? 'Editar Benefício' : 'Adicionar Novo Benefício' }}
          </h3>
        </template>

        <UForm :state="formData" @submit="handleFormSubmit" class="p-4 space-y-4">
          <UFormGroup label="Especie Beneficio" name="especie_beneficio" required>
            <UInput v-model="formData.especie_beneficio" />
          </UFormGroup>
          <UFormGroup label="Numero do Benefício" name="numero_beneficio" required>
            <UInput v-model="formData.numero_beneficio" />
          </UFormGroup>
          <UFormGroup label="Status" name="is_active" class="flex items-center space-x-2">
             <UToggle v-model="formData.is_active" />
          </UFormGroup>

          <div class="flex justify-end space-x-2 pt-4">
            <UButton label="Cancelar" color="gray" variant="ghost" @click="isModalOpen = false" />
            <UButton type="submit" :label="formData.id ? 'Salvar Alterações' : 'Criar Benefício'" :loading="saving" />
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
  // Campos Alterados
  especie_beneficio: '',
  numero_beneficio: '',
  is_active: true
});
const formData = reactive(getInitialFormData());

// --- DEFINIÇÃO DAS COLUNAS DA TABELA (ALTERADO) ---
const columns = [
  { key: 'especie_beneficio', label: 'Especie Beneficio', sortable: true },
  { key: 'numero_beneficio', label: 'Numero do Benefício', sortable: true },
  { key: 'is_active', label: 'Status' },
  { key: 'actions', label: 'Ações' }
];

// --- CARREGAMENTO DE DADOS ---
const { data: beneficios, pending, refresh } = await useAsyncData('beneficios', async () => {
  // A query select('*') adapta-se automaticamente às novas colunas
  const { data } = await supabase.from('beneficios').select('*').order('especie_beneficio');
  return data;
});

// --- LÓGICA DO FORMULÁRIO ---
const openModal = (beneficio = null) => {
  if (beneficio) {
    Object.assign(formData, beneficio);
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
      const { error } = await supabase.from('beneficios').update(dataToSave).eq('id', id);
      if (error) throw error;
      toast.add({ title: 'Sucesso!', description: 'Benefício atualizado.' });
    } else { // Modo de Criação
      const { error } = await supabase.from('beneficios').insert(dataToSave);
      if (error) throw error;
      toast.add({ title: 'Sucesso!', description: 'Novo benefício criado.' });
    }
    isModalOpen.value = false;
    await refresh();
  } catch (error) {
    toast.add({ title: 'Erro!', description: error.message, color: 'red' });
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (beneficio) => {
  // Mensagem de confirmação atualizada
  if (confirm(`Tem a certeza que quer excluir o benefício "${beneficio.numero_beneficio}"?`)) {
    try {
      const { error } = await supabase.from('beneficios').delete().eq('id', beneficio.id);
      if (error) throw error;
      toast.add({ title: 'Sucesso!', description: 'Benefício excluído.' });
      await refresh();
    } catch (error) {
      toast.add({ title: 'Erro!', description: 'Não foi possível excluir o benefício.', color: 'red' });
    }
  }
};
</script>