<template>
  <div>
    <header class="mb-8 flex justify-between items-center">
      <h1 class="text-primary-500 text-3xl font-bold">Gestão de Bancos e Tabelas</h1>
      <UButton icon="i-heroicons-plus-circle" size="lg" @click="openModal()">
        Adicionar Novo Banco
      </UButton>
      <UButton icon="i-heroicons-plus-circle" size="lg" @click="openTableModal()">
        Adicionar Nova Tabela
      </UButton>
    </header>

    <UCard>
      <UTable :rows="tabelas || []" :columns="columns" :loading="pending">
        <template #banco-data="{ row }">
          <span>{{ row.bancos.nome_instituicao }}</span>
        </template>

        <template #prazos-data="{ row }">
          <div class="flex flex-wrap gap-1">
            <UBadge v-for="prazo in row.prazos" :key="prazo" :label="prazo" color="gray" variant="soft" />
          </div>
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
            {{ formData.id ? 'Editar Tabela' : 'Adicionar Nova Tabela' }}
          </h3>
        </template>

        <UForm :state="formData" @submit="handleFormSubmit" class="p-4 space-y-4">
          <UFormGroup label="Banco" name="banco_id" required>
            <USelectMenu v-model="formData.banco_id" :options="bancos" value-attribute="id" option-attribute="nome_instituicao" placeholder="Selecione o banco" />
          </UFormGroup>

          <UFormGroup label="Nome da Tabela" name="nome_tabela" required>
            <UInput v-model="formData.nome_tabela" placeholder="Ex: TX 1,85" />
          </UFormGroup>

          <UFormGroup label="Prazos (meses)" name="prazos" help="Adicione os prazos separados por vírgula. Ex: 36x, 48x, 72x">
            <UInput v-model="prazosInput" placeholder="Ex: 36x, 48x, 72x" />
          </UFormGroup>

          <div class="flex justify-end space-x-2 pt-4">
            <UButton label="Cancelar" color="gray" variant="ghost" @click="isModalOpen = false" />
            <UButton type="submit" :label="formData.id ? 'Salvar Alterações' : 'Criar Tabela'" :loading="saving" />
          </div>
        </UForm>
      </UCard>
    </USlideover>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth',
  profiles: ['Backoffice']
});

const supabase = useSupabaseClient();
const toast = useToast();

// --- ESTADO DA PÁGINA ---
const isModalOpen = ref(false);
const saving = ref(false);
const getInitialFormData = () => ({
  id: null,
  banco_id: null,
  nome_tabela: '',
  prazos: []
});
const formData = reactive(getInitialFormData());
const prazosInput = ref(''); // Variável auxiliar para o campo de texto dos prazos

// --- DEFINIÇÃO DAS COLUNAS DA TABELA ---
const columns = [
  { key: 'banco', label: 'Banco', sortable: true },
  { key: 'nome_tabela', label: 'Nome da Tabela', sortable: true },
  { key: 'prazos', label: 'Prazos Disponíveis' },
  { key: 'actions', label: 'Ações' }
];

// --- CARREGAMENTO DE DADOS ---
const { data: tabelas, pending, refresh } = await useAsyncData('tabelas', async () => {
  const { data } = await supabase.from('tabelas').select('*, bancos(nome_instituicao)').order('id');
  return data;
});

const { data: bancos } = await useAsyncData('bancos-form', async () => {
  const { data } = await supabase.from('bancos').select('id, nome_instituicao').order('nome_instituicao');
  return data;
});

// --- LÓGICA DO FORMULÁRIO ---
const openModal = (tabela = null) => {
  if (tabela) {
    Object.assign(formData, tabela);
    prazosInput.value = tabela.prazos.join(', '); // Converte o array para texto para edição
  } else {
    Object.assign(formData, getInitialFormData());
    prazosInput.value = '';
  }
  isModalOpen.value = true;
};

const handleFormSubmit = async () => {
  saving.value = true;
  // Converte o texto dos prazos de volta para um array de texto
  formData.prazos = prazosInput.value.split(',').map(p => p.trim()).filter(p => p);

  try {
    const dataToSave = { ...formData };
    if (dataToSave.bancos) delete dataToSave.bancos; // Remove dados de relação antes de salvar

    if (dataToSave.id) {
      const { error } = await supabase.from('tabelas').update(dataToSave).eq('id', dataToSave.id);
      if (error) throw error;
      toast.add({ title: 'Sucesso!', description: 'Tabela atualizada.' });
    } else {
      delete dataToSave.id;
      const { error } = await supabase.from('tabelas').insert(dataToSave);
      if (error) throw error;
      toast.add({ title: 'Sucesso!', description: 'Nova tabela criada.' });
    }
    isModalOpen.value = false;
    await refresh();
  } catch (error) {
    toast.add({ title: 'Erro!', description: error.message, color: 'red' });
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (tabela) => {
  if (confirm(`Tem a certeza que quer excluir a tabela "${tabela.nome_tabela}"?`)) {
    try {
      const { error } = await supabase.from('tabelas').delete().eq('id', tabela.id);
      if (error) throw error;
      toast.add({ title: 'Sucesso!', description: 'Tabela excluída.' });
      await refresh();
    } catch (error) {
      toast.add({ title: 'Erro!', description: error.message, color: 'red' });
    }
  }
};
</script>