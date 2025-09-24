<template>
  <div>
    <header class="mb-8 flex justify-between items-center">
      <h1 class="text-3xl font-bold">Gestão de Clientes</h1>
      <UButton icon="i-heroicons-plus-circle" size="lg" @click="openModal()">
        Novo Cliente
      </UButton>
    </header>

    <UCard>
      <template #header>
        <UInput v-model="searchTerm" placeholder="Filtrar por nome ou CPF..." icon="i-heroicons-magnifying-glass" />
      </template>
      <UTable :rows="filteredRows || []" :columns="columns" :loading="pending">
        <template #actions-data="{ row }">
          <UButton icon="i-heroicons-pencil" size="sm" color="gray" variant="ghost" @click="openModal(row)" />
          <UButton icon="i-heroicons-eye" size="sm" color="gray" variant="ghost" :to="`/clientes/${row.id}`" />
        </template>
      </UTable>
    </UCard>

    <USlideover v-model="isModalOpen" :ui="{ width: 'sm:max-w-2xl' }">
      <UCard class="flex flex-col flex-1" :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <h3 class="text-base font-semibold">
            {{ formData.id ? 'Editar Cliente' : 'Novo Cliente' }}
          </h3>
        </template>
        
        <UForm :state="formData" @submit="handleFormSubmit" class="p-4 space-y-6">
          <UCard>
            <template #header><h3 class="font-semibold">Dados Pessoais</h3></template>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormGroup label="Nome Completo" name="nome_completo" required>
                <UInput v-model="formData.nome_completo" />
              </UFormGroup>
              <UFormGroup label="CPF" name="cpf" required>
                <UInput v-model="formData.cpf" />
              </UFormGroup>
              <UFormGroup label="Data de Nascimento" name="data_nascimento">
                <UInput v-model="formData.data_nascimento" type="date" />
              </UFormGroup>
              <UFormGroup label="Email" name="email">
                <UInput v-model="formData.email" type="email" />
              </UFormGroup>
              <UFormGroup label="Telefone" name="telefone">
                <UInput v-model="formData.telefone" />
              </UFormGroup>
            </div>
          </UCard>

          <UCard>
            <template #header><h3 class="font-semibold">Endereço</h3></template>
            <div class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <UFormGroup label="CEP" name="cep">
                  <UInput v-model="formData.cep" @blur="consultarCEP" />
                </UFormGroup>
                <div class="md:col-span-2">
                  <UFormGroup label="Endereço" name="endereco">
                    <UInput v-model="formData.endereco" />
                  </UFormGroup>
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <UFormGroup label="Número" name="numero_endereco">
                  <UInput v-model="formData.numero_endereco" />
                </UFormGroup>
                <UFormGroup label="Complemento" name="complemento_endereco">
                  <UInput v-model="formData.complemento_endereco" />
                </UFormGroup>
                <UFormGroup label="Bairro" name="bairro">
                  <UInput v-model="formData.bairro" />
                </UFormGroup>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UFormGroup label="Cidade" name="cidade">
                  <UInput v-model="formData.cidade" />
                </UFormGroup>
                <UFormGroup label="Estado" name="estado">
                  <UInput v-model="formData.estado" />
                </UFormGroup>
              </div>
            </div>
          </UCard>

          <div class="flex justify-end space-x-2 pt-4">
            <UButton label="Cancelar" color="gray" variant="ghost" @click="isModalOpen = false" />
            <UButton type="submit" :label="formData.id ? 'Salvar Alterações' : 'Criar Cliente'" :loading="saving" />
          </div>
        </UForm>
      </UCard>
    </USlideover>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient();
const toast = useToast();
const { profile } = useProfile(); // Para saber o consultor e a loja

// --- ESTADO DA PÁGINA ---
const isModalOpen = ref(false);
const saving = ref(false);
const searchTerm = ref('');
const getInitialFormData = () => ({
  id: null,
  nome_completo: '',
  cpf: '',
  data_nascimento: null,
  email: '',
  telefone: '',
  cep: '',
  endereco: '',
  numero_endereco: '',
  complemento_endereco: '',
  bairro: '',
  cidade: '',
  estado: '',
  // Associa o novo cliente ao consultor e loja atuais
  consultor_id: profile.value?.id || null,
  loja_id: profile.value?.loja_id || null,
});
const formData = reactive(getInitialFormData());

// --- TABELA ---
const columns = [
  { key: 'nome_completo', label: 'Nome Completo', sortable: true },
  { key: 'cpf', label: 'CPF', sortable: true },
  { key: 'funcionarios.nome_completo', label: 'Consultor' },
  { key: 'lojas.nome', label: 'Loja de Origem' },
  { key: 'actions', label: 'Ações' }
];

const { data: clientes, pending, refresh } = await useAsyncData('clientes', async () => {
  const { data } = await supabase
    .from('clientes')
    .select('*, funcionarios(nome_completo), lojas(nome)')
    .order('nome_completo');
  return data;
});

const filteredRows = computed(() => {
  if (!clientes.value || !searchTerm.value) return clientes.value;
  return clientes.value.filter(cliente => 
    cliente.nome_completo.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
    cliente.cpf.includes(searchTerm.value)
  );
});

// --- LÓGICA DO FORMULÁRIO ---
const openModal = (cliente = null) => {
  if (cliente) {
    Object.assign(formData, cliente);
  } else {
    Object.assign(formData, getInitialFormData());
  }
  isModalOpen.value = true;
};

const consultarCEP = async () => { /* ... (mesma lógica do CEP de funcionários) ... */ };

const handleFormSubmit = async () => {
  saving.value = true;
  try {
    const { id, funcionarios, lojas, ...dataToSave } = formData;
    if (id) { // UPDATE
      const { error } = await supabase.from('clientes').update(dataToSave).eq('id', id);
      if (error) throw error;
      toast.add({ title: 'Sucesso!', description: 'Cliente atualizado.' });
    } else { // CREATE
      const { error } = await supabase.from('clientes').insert(dataToSave);
      if (error) throw error;
      toast.add({ title: 'Sucesso!', description: 'Novo cliente criado.' });
    }
    isModalOpen.value = false;
    await refresh();
  } catch (error) {
    toast.add({ title: 'Erro!', description: error.message, color: 'red' });
  } finally {
    saving.value = false;
  }
};
</script>