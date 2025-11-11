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
          <h2 class="font-semibold text-lg">Lojas Registradas</h2>
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
            <UInput v-model="formData.nome" placeholder="Nome da Loja" />
          </UFormGroup>
          <UFormGroup label="Nome da Franquia" name="franquia" required>
            <UInput v-model="formData.franquia" placeholder="Nome da Franquia" />
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
           <UButton type="submit" :label="formData.id ? 'Salvar Loja' : 'Criar Loja'" :loading="saving" :disabled="saving || justSubmitted" />
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
const justSubmitted = ref(false);
const searchTerm = ref('');
const getInitialFormData = () => ({
  id: null,
  nome: '',
  franquia: '',
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
  { key: 'franquia', label: 'Franquia', sortable: true },
  { key: 'nome', label: 'Nome da Loja', sortable: true },
  { key: 'regionais.nome_regional', label: 'Regional', sortable: true },
  { key: 'city', label: 'Cidade' },
  { key: 'state', label: 'Estado' },
  { key: 'is_active', label: 'Status' },
  { key: 'actions', label: 'Ações' }
];

// --- CARREGAMENTO DE DADOS ---
const { data: regionais } = await useAsyncData('regionais', async () => {
  const { data } = await supabase.from('regionais').select('*').order('nome_regional');
  return data;
});

// CORREÇÃO DEFINITIVA: Tenta RPC JSONB primeiro, fallback para API endpoint
const lojas = ref([]);
const pending = ref(true);

const refresh = async () => {
  pending.value = true;
  try {
    // 1) Tenta RPC que retorna JSONB (bypass do cache _vts)
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_lojas_completas')
    if (!rpcError && rpcData) {
      lojas.value = rpcData || []
      return
    }

    if (rpcError) {
      console.warn('Erro RPC get_lojas_completas, tentando endpoint /api/lojas:', rpcError)
    }

    // 2) TENTATIVA 2: Usa endpoint de API do Nuxt (server-side fetch)
    try {
      const response = await $fetch('/api/lojas')
      if (response && response.success && response.data) {
        lojas.value = response.data
        return
      }
      console.warn('API /api/lojas retornou erro ou sem dados, prosseguindo para client supabase')
    } catch (e) {
      console.warn('Erro ao chamar /api/lojas:', e)
    }

    // 3) Último recurso: tentar o cliente supabase direto (pode apresentar erro _vts)
    const { data, error } = await supabase
      .from('lojas')
      .select('*')
      .eq('is_internal', false)
      .order('nome')

    if (error) {
      throw error
    }

    lojas.value = data || []
  } catch (error) {
    console.error('Erro ao carregar lojas (todas tentativas falharam):', error)
    toast.add({ title: 'Erro', description: error.message || 'Não foi possível carregar as lojas', color: 'red' })
    lojas.value = []
  } finally {
    pending.value = false
  }
}

// Carrega dados inicialmente
await refresh();

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
    // Garante que o ID da regional seja atribuído corretamente, pois o objeto 'loja'
    // pode conter o objeto 'regionais' aninhado em vez do ID direto.
    if (loja.regionais && loja.regionais.id) {
      formData.regional_id = loja.regionais.id;
    }
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

    // CORREÇÃO: A verificação deve ser feita no `formData.id` original.
    if (formData.id) { // Modo de Edição
      // Remove o 'id' do objeto a ser salvo para não tentar atualizar a chave primária.
      delete dataToSave.id;

  // Usar endpoint server-side para atualizar (service role)
  const sessionResp = await supabase.auth.getSession()
  const token = sessionResp?.data?.session?.access_token || null
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const resp = await $fetch('/api/lojas', { method: 'PUT', body: { id: formData.id, ...dataToSave }, headers })
      if (!resp || !resp.success) throw new Error(resp?.error || 'Erro ao atualizar loja')
      toast.add({ title: 'Sucesso!', description: 'Loja atualizada com sucesso.' });
    } else { // Modo de Criação
      // Garante que o id não seja enviado na criação.
      delete dataToSave.id;

  // Chama endpoint server-side para criar a loja (service role)
  const sessionResp = await supabase.auth.getSession()
  const token = sessionResp?.data?.session?.access_token || null
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const resp = await $fetch('/api/lojas', { method: 'POST', body: dataToSave, headers })
      if (!resp || !resp.success) throw new Error(resp?.error || 'Erro ao criar loja')
      toast.add({ title: 'Sucesso!', description: 'Loja criada com sucesso.' });
    }
  // Limpa o formulário para evitar re-submissões ou edição acidental
  Object.assign(formData, getInitialFormData());
  // Proteção extra: bloqueia o botão por 1s para evitar cliques duplos
  justSubmitted.value = true
  setTimeout(() => { justSubmitted.value = false }, 1000)
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
  const sessionResp = await supabase.auth.getSession()
  const token = sessionResp?.data?.session?.access_token || null
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const resp = await $fetch('/api/lojas', { method: 'DELETE', body: { id: loja.id }, headers })
      if (!resp || !resp.success) throw new Error(resp?.error || 'Erro ao excluir loja')
      toast.add({ title: 'Sucesso!', description: 'Loja excluída.' });
      await refresh();
    } catch (error) {
      console.error('Erro ao excluir loja:', error);
      toast.add({ title: 'Erro!', description: error.message, color: 'red' });
    }
  }
};
</script>