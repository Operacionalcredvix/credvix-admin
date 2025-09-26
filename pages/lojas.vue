<template>
  <div>
    <header class="mb-8 flex justify-between items-center">
      <h1 class="text-primary-500 text-3xl font-bold">Gestão de Lojas</h1>
      <UButton icon="i-heroicons-plus-circle" size="lg" @click="openModal">
        Criar Nova Loja
      </UButton>
    </header>

    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <h2 class="font-semibold text-lg">Lojas Registadas</h2>
          <UInput v-model="searchTerm" placeholder="Filtrar por nome..." icon="i-heroicons-magnifying-glass" />
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
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              {{ formData.id ? 'Editar Loja' : 'Criar Nova Loja' }}
            </h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isModalOpen = false" />
          </div>
        </template>

        <UForm :state="formData" @submit="handleFormSubmit" class="p-4 space-y-4">
          <UFormGroup label="Nome da Loja" name="nome" required>
            <UInput v-model="formData.nome" />
          </UFormGroup>

          <UFormGroup label="Selecione a Regional" name="regional_id" required>
            <USelectMenu v-model="formData.regional_id" :options="regionais" value-attribute="id" option-attribute="nome_regional" placeholder="Selecione..." />
          </UFormGroup>
          
          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Cidade" name="city">
              <UInput v-model="formData.city" placeholder="ex. Vila Velha" />
            </UFormGroup>
            <UFormGroup label="Estado" name="state">
              <UInput v-model="formData.state" placeholder="ex. ES" />
            </UFormGroup>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Telefone" name="phone">
              <UInput v-model="formData.phone" placeholder="(00) 0000-0000" />
            </UFormGroup>
            <UFormGroup label="Nº de WhatsApp" name="whatsapp">
              <UInput v-model="formData.whatsapp" placeholder="(00) 00000-0000" />
            </UFormGroup>
          </div>

          <UFormGroup label="Endereço Completo" name="address">
            <UInput v-model="formData.address" />
          </UFormGroup>

          <UFormGroup label="URL do Instagram" name="instagram_url">
            <UInput v-model="formData.instagram_url" placeholder="https://instagram.com/sua_loja" />
          </UFormGroup>

          <UFormGroup label="Loja Ativa" name="is_active" class="flex items-center space-x-2">
             <UToggle v-model="formData.is_active" />
          </UFormGroup>

          <div class="flex justify-end space-x-2 pt-4">
             <UButton label="Cancelar" color="gray" @click="isModalOpen = false" />
             <UButton type="submit" :label="formData.id ? 'Salvar Loja' : 'Criar Loja'" :loading="saving" />
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
const searchTerm = ref('');
const getInitialFormData = () => ({
  id: null,
  nome: '',
  regional_id: null,
  city: '',
  state: '',
  phone: '',
  whatsapp: '',
  address: '',
  instagram_url: '',
  is_active: true
});
const formData = reactive(getInitialFormData());

// --- DEFINIÇÃO DAS COLUNAS DA TABELA ---
const columns = [
  { key: 'nome', label: 'Nome da Loja', sortable: true },
  { key: 'regionais.nome_regional', label: 'Regional', sortable: true },
  { key: 'city', label: 'Cidade' },
  { key: 'state', label: 'Estado' },
  { key: 'is_active', label: 'Status' },
  { key: 'actions', label: 'Ações' }
];

// --- CARREGAMENTO DE DADOS ---
const { data: lojas, pending, refresh } = await useAsyncData('lojas', async () => {
  const { data } = await supabase.from('lojas').select('*, regionais(nome_regional)').order('nome');
  return data;
});

const { data: regionais } = await useAsyncData('regionais', async () => {
  const { data } = await supabase.from('regionais').select('*').order('nome_regional');
  return data;
});

// --- LÓGICA COMPUTADA E AÇÕES ---
const filteredRows = computed(() => {
  if (!searchTerm.value) {
    return lojas.value;
  }
  return lojas.value.filter((loja) => {
    return loja.nome.toLowerCase().includes(searchTerm.value.toLowerCase());
  });
});

const openModal = (loja = null) => {
  if (loja) {
    Object.assign(formData, loja);
  } else {
    Object.assign(formData, getInitialFormData());
  }
  isModalOpen.value = true;
};

const handleFormSubmit = async () => {
  saving.value = true;
  try {
    const dataToSave = { ...formData };
    
    // Omitir a propriedade 'regionais' se ela existir, pois é apenas para exibição
    delete dataToSave.regionais;

    if (dataToSave.id) { // Modo de Edição
      const { error } = await supabase.from('lojas').update(dataToSave).eq('id', dataToSave.id);
      if (error) throw error;
      toast.add({ title: 'Sucesso!', description: 'Loja atualizada com sucesso.' });
    } else { // Modo de Criação
      delete dataToSave.id;
      const { error } = await supabase.from('lojas').insert(dataToSave);
      if (error) throw error;
      toast.add({ title: 'Sucesso!', description: 'Loja criada com sucesso.' });
    }
    isModalOpen.value = false;
    await refresh(); // Recarrega os dados da tabela
  } catch (error) {
    console.error('Erro ao salvar loja:', error);
    toast.add({ title: 'Erro!', description: error.message, color: 'red' });
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (loja) => {
  if (confirm(`Tem a certeza de que quer excluir a loja "${loja.nome}"?`)) {
    try {
      const { error } = await supabase.from('lojas').delete().eq('id', loja.id);
      if (error) throw error;
      toast.add({ title: 'Sucesso!', description: 'Loja excluída.' });
      await refresh();
    } catch (error) {
      console.error('Erro ao excluir loja:', error);
      toast.add({ title: 'Erro!', description: error.message, color: 'red' });
    }
  }
};
</script>