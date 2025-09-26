<template>
  <div>
    <header class="mb-8 flex justify-between items-center">
      <h1 class="text-primary-500 text-3xl font-bold">Gestão de Produtos</h1>
      <UButton icon="i-heroicons-plus-circle" size="lg" @click="openModal()">
        Adicionar Novo Produto
      </UButton>
    </header>

    <UCard>
      <UTable :rows="produtos || []" :columns="columns" :loading="pending">
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
            {{ formData.id ? 'Editar Produto' : 'Adicionar Novo Produto' }}
          </h3>
        </template>

        <UForm :state="formData" @submit="handleFormSubmit" class="p-4 space-y-4">
          <UFormGroup label="Nome do Produto" name="nome" required>
            <UInput v-model="formData.nome" placeholder="Ex: Empréstimo Consignado" />
          </UFormGroup>

          <UFormGroup label="Status do Produto" name="is_active" class="flex items-center space-x-2">
             <UToggle v-model="formData.is_active" />
             <span class="ml-2">{{ formData.is_active ? 'Ativo' : 'Inativo' }}</span>
          </UFormGroup>

          <div class="flex justify-end space-x-2 pt-4">
            <UButton label="Cancelar" color="gray" variant="ghost" @click="isModalOpen = false" />
            <UButton type="submit" :label="formData.id ? 'Salvar Alterações' : 'Criar Produto'" :loading="saving" />
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
  nome: '',
  is_active: true
});
const formData = reactive(getInitialFormData());

// --- DEFINIÇÃO DAS COLUNAS DA TABELA ---
const columns = [
  { key: 'nome', label: 'Nome do Produto', sortable: true },
  { key: 'is_active', label: 'Status' },
  { key: 'actions', label: 'Ações' }
];

// --- CARREGAMENTO DE DADOS ---
const { data: produtos, pending, refresh } = await useAsyncData('produtos', async () => {
  const { data } = await supabase.from('produtos').select('*').order('nome');
  return data;
});

// --- LÓGICA DO FORMULÁRIO ---
const openModal = (produto = null) => {
  if (produto) {
    Object.assign(formData, produto);
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
      const { error } = await supabase.from('produtos').update(dataToSave).eq('id', id);
      if (error) throw error;
      toast.add({ title: 'Sucesso!', description: 'Produto atualizado.' });
    } else { // Modo de Criação
      const { error } = await supabase.from('produtos').insert(dataToSave);
      if (error) throw error;
      toast.add({ title: 'Sucesso!', description: 'Novo produto criado.' });
    }
    isModalOpen.value = false;
    await refresh();
  } catch (error) {
    toast.add({ title: 'Erro!', description: error.message, color: 'red' });
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (produto) => {
  if (confirm(`Tem a certeza que quer excluir o produto "${produto.nome}"?`)) {
    try {
      const { error } = await supabase.from('produtos').delete().eq('id', produto.id);
      if (error) throw error;
      toast.add({ title: 'Sucesso!', description: 'Produto excluído.' });
      await refresh();
    } catch (error) {
      toast.add({ title: 'Erro!', description: 'Não foi possível excluir. Verifique se este produto está a ser usado em algum contrato.', color: 'red' });
    }
  }
};
</script>