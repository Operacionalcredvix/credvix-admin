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
      <UTable :rows="clientes || []" :columns="columns" :loading="pending">
        <template #actions-data="{ row }">
          <UButton icon="i-heroicons-pencil" size="sm" color="gray" variant="ghost" @click="openModal(row)" />
          <UButton icon="i-heroicons-eye" size="sm" color="gray" variant="ghost" :to="`/clientes/${row.id}`" />
        </template>
      </UTable>
    </UCard>
    <!-- Modal de Criação/Edição -->
    <USlideover v-model="isModalOpen" :ui="{ width: 'sm:max-w-2xl' }">
      <UCard class="flex flex-col flex-1"
        :ui="{ body: { padding: '', base: 'flex-1' }, ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold">
              {{ formData.id ? 'Editar Cliente' : 'Novo Cliente' }}
            </h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1"
              @click="isModalOpen = false" />
          </div>
        </template>

        <div class="p-4 overflow-y-auto flex-1">
          <UForm :state="formData" @submit.prevent="handleFormSubmit" class="space-y-6">
            <UCard>
              <template #header>
                <h3 class="font-semibold">Dados Pessoais</h3>
              </template>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UFormGroup label="Nome Completo" name="nome_completo" required>
                  <UInput v-model="formData.nome_completo" placeholder="João da Silva" />
                </UFormGroup>
                <UFormGroup label="CPF" name="cpf" required :error="cpfError">
                  <UInput v-model="formData.cpf" @blur="validateCpf" placeholder="Apenas números" />
                </UFormGroup>
                <UFormGroup label="Data de Nascimento" name="data_nascimento">
                  <UInput v-model="formData.data_nascimento" type="date" />
                </UFormGroup>
                <UFormGroup label="Email" name="email">
                  <UInput v-model="formData.email" type="email" placeholder="conta@exemplo.com" />
                </UFormGroup>
                <UFormGroup label="Telefone Principal" name="telefone">
                  <UInput v-model="formData.telefone" placeholder="99 9999-9999" />
                </UFormGroup>
                <UFormGroup label="Telefone Secundário" name="telefone_secundario">
                  <UInput v-model="formData.telefone_secundario" placeholder="99 9999-9999" />
                </UFormGroup>
              </div>
            </UCard>

            <UCard>
              <template #header>
                <h3 class="font-semibold">Endereço</h3>
              </template>
              <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <UFormGroup label="CEP" name="cep">
                    <UInput v-model="formData.cep" @blur="consultarCEP" :loading="cepLoading" />
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
          </UForm>
        </div>

        <template #footer>
          <div class="flex justify-end space-x-2">
            <UButton label="Cancelar" color="gray" variant="ghost" @click="isModalOpen = false" />
            <UButton @click="handleFormSubmit" :label="formData.id ? 'Salvar Alterações' : 'Criar Cliente'"
              :loading="saving" />
          </div>
        </template>
      </UCard>
    </USlideover>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';

const supabase = useSupabaseClient();
const toast = useToast();

// --- ESTADO DA PÁGINA ---
const isModalOpen = ref(false);
const saving = ref(false);
const cepLoading = ref(false);
const searchTerm = ref('');
const cpfError = ref('');
const clientes = ref([]); // Onde guardaremos os clientes exibidos
const pending = ref(true); // Para o estado de carregamento da tabela

const getInitialFormData = () => ({
  id: null,
  nome_completo: '',
  cpf: '',
  data_nascimento: null,
  email: '',
  telefone: '',
  telefone_secundario: '',
  cep: '',
  endereco: '',
  numero_endereco: '',
  complemento_endereco: '',
  bairro: '',
  cidade: '',
  estado: '',
});
const formData = reactive(getInitialFormData());

// --- LÓGICA DE FORMATAÇÃO (MÁSCARAS) ---
watch(() => formData.cpf, (newCpf) => {
  if (typeof newCpf !== 'string') return;
  const cleaned = newCpf.replace(/\D/g, '').slice(0, 11);
  let formatted = cleaned;
  if (cleaned.length > 9) {
    formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  } else if (cleaned.length > 6) {
    formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  } else if (cleaned.length > 3) {
    formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  }
  formData.cpf = formatted;
});

const formatPhone = (phone) => {
  if (typeof phone !== 'string') return '';
  const cleaned = phone.replace(/\D/g, '').slice(0, 11);
  let formatted = cleaned;
  if (cleaned.length > 10) {
    formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length > 6) {
    formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length > 2) {
    formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  }
  return formatted;
};

watch(() => formData.telefone, (newPhone) => { formData.telefone = formatPhone(newPhone); });
watch(() => formData.telefone_secundario, (newPhone) => { formData.telefone_secundario = formatPhone(newPhone); });

// --- TABELA ---
const columns = [
  { key: 'nome_completo', label: 'Nome Completo', sortable: true },
  { key: 'cpf', label: 'CPF', sortable: true },
  { key: 'cidade', label: 'Cidade' },
  { key: 'telefone', label: 'Telefone' },
  { key: 'actions', label: 'Ações' }
];

// --- LÓGICA DE BUSCA DE DADOS OTIMIZADA ---
const fetchInitialClients = async () => {
  pending.value = true;
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(15);

  if (error) toast.add({ title: 'Erro!', description: error.message, color: 'red' });
  else clientes.value = data;
  pending.value = false;
};

const searchClients = async (term) => {
  pending.value = true;
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .or(`nome_completo.ilike.%${term}%,cpf.ilike.%${term}%`)
    .limit(15);

  if (error) toast.add({ title: 'Erro!', description: error.message, color: 'red' });
  else clientes.value = data;
  pending.value = false;
};

onMounted(fetchInitialClients);

watch(searchTerm, useDebounceFn((newSearchTerm) => {
  if (newSearchTerm.length >= 3) {
    searchClients(newSearchTerm);
  } else if (newSearchTerm.length === 0) {
    fetchInitialClients();
  }
}, 300));

// --- LÓGICA DO FORMULÁRIO ---
const openModal = (cliente = null) => {
  cpfError.value = '';
  if (cliente) Object.assign(formData, cliente);
  else Object.assign(formData, getInitialFormData());
  isModalOpen.value = true;
};

const isValidCPF = (cpf) => {
  if (typeof cpf !== 'string') return false;
  cpf = cpf.replace(/[^\d]/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  const cpfDigits = cpf.split('').map(el => +el);
  const rest = (count) => (cpfDigits.slice(0, count - 12).reduce((soma, el, index) => soma + el * (count - index), 0) * 10) % 11 % 10;
  return rest(10) === cpfDigits[9] && rest(11) === cpfDigits[10];
};

const validateCpf = () => {
  if (formData.cpf && !isValidCPF(formData.cpf)) cpfError.value = 'CPF inválido. Por favor, verifique.';
  else cpfError.value = '';
};

const consultarCEP = async () => {
  const cep = formData.cep?.replace(/\D/g, '');
  if (cep?.length !== 8) return;
  
  cepLoading.value = true;
  try {
    const data = await fetch(`https://viacep.com.br/ws/${cep}/json/`).then(res => res.json());
    if (data.erro) {
      toast.add({ title: 'Atenção!', description: 'CEP não encontrado.', color: 'amber' });
      return;
    }
    formData.endereco = data.logouro;
    formData.bairro = data.bairro;
    formData.cidade = data.localidade;
    formData.estado = data.uf;
  } catch (error) {
    toast.add({ title: 'Erro!', description: 'Não foi possível consultar o CEP.', color: 'red' });
  } finally {
    cepLoading.value = false;
  }
};

const handleFormSubmit = async () => {
  validateCpf();
  if (cpfError.value) {
    toast.add({ title: 'Atenção!', description: 'O formulário contém erros. Por favor, corrija o CPF.', color: 'amber' });
    return;
  }

  saving.value = true;
  try {
    const { id, ...dataToSave } = formData;
    
    if (dataToSave.cpf) dataToSave.cpf = dataToSave.cpf.replace(/\D/g, '');
    if (dataToSave.telefone) dataToSave.telefone = dataToSave.telefone.replace(/\D/g, '');
    if (dataToSave.telefone_secundario) dataToSave.telefone_secundario = dataToSave.telefone_secundario.replace(/\D/g, '');

    if (id) {
      const { error } = await supabase.from('clientes').update(dataToSave).eq('id', id);
      if (error) throw error;
      toast.add({ title: 'Sucesso!', description: 'Cliente atualizado.' });
    } else {
      if (dataToSave.cpf) {
        const { data: existingClient, error: checkError } = await supabase.from('clientes').select('id').eq('cpf', dataToSave.cpf).single();
        if (checkError && checkError.code !== 'PGRST116') throw checkError;
        if (existingClient) {
          toast.add({ title: 'Erro!', description: 'Já existe um cliente registado com este CPF.', color: 'red' });
          saving.value = false;
          return;
        }
      }
      const { error } = await supabase.from('clientes').insert(dataToSave);
      if (error) throw error;
      toast.add({ title: 'Sucesso!', description: 'Novo cliente criado.' });
    }
    isModalOpen.value = false;
    await fetchInitialClients();
  } catch (error) {
    toast.add({ title: 'Erro!', description: error.message, color: 'red' });
  } finally {
    saving.value = false;
  }
};
</script>