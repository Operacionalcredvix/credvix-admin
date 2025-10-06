<template>
  <div>
    <header class="mb-8 flex justify-between items-center">
      <h1 class="text-primary-500 text-3xl font-bold">Gestão de Clientes</h1>
      <UButton icon="i-heroicons-plus-circle" size="lg" @click="openModal()">
        Novo Cliente
      </UButton>
    </header>

    <UCard>
      <template #header>
        <div class="flex justify-between items-center gap-4">
          <UInput v-model="searchTerm" placeholder="Filtrar por nome ou CPF..." icon="i-heroicons-magnifying-glass" class="flex-grow" />
          <UDropdown :items="exportOptions" :ui="{ item: { disabled: 'cursor-not-allowed opacity-50' } }">
            <UButton color="gray" label="Exportar" icon="i-heroicons-document-arrow-down" trailing-icon="i-heroicons-chevron-down-20-solid" :loading="exporting" />
          </UDropdown>
        </div>
      </template>
      <UTable :rows="clientes || []" :columns="columns" :loading="pending">
        <template #actions-data="{ row }">
          <UButton icon="i-heroicons-pencil" size="sm" color="gray" variant="ghost" @click="openModal(row)" />
          <UButton icon="i-heroicons-eye" size="sm" color="gray" variant="ghost" :to="`/backoffice/clientes/${row.id}`" />
        </template>

        <template #contratos-data="{ row }">
          <NuxtLink :to="`/backoffice/contratos?cliente_id=${row.id}`">
            <UBadge :label="row.contratos[0]?.count || 0" variant="subtle"
              class="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700" />
          </NuxtLink>
        </template>
      </UTable>

      <template #footer>
        <div class="flex justify-end">
          <UPagination v-model="page" :page-count="pageCount" :total="totalClients" />
        </div>
      </template>
    </UCard>
    <!-- Modal de Criação/Edição -->
    <UModal v-model="isModalOpen" :ui="{ width: 'sm:max-w-4xl' }">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800', body: { padding: 'p-4 sm:p-6' } }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold">
              {{ formData.id ? 'Editar Cliente' : 'Novo Cliente' }}
            </h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1"
              @click="isModalOpen = false" />
          </div>
        </template>

        <div>
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
                <h3 class="font-semibold">Benefícios</h3>
              </template>
              <div class="space-y-4">
                <p class="text-sm text-gray-500">Registe até dois benefícios para este cliente.</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                  <UFormGroup label="Espécie Benefício 1" name="especie_beneficio_1">
                    <UInput v-model="formData.especie_beneficio_1" placeholder="Especie do benefício" />
                  </UFormGroup>
                  <UFormGroup label="Número Benefício 1" name="numero_beneficio_1">
                    <UInput v-model="formData.numero_beneficio_1" placeholder="Número do benefício"/>
                  </UFormGroup>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                  <UFormGroup label="Espécie Benefício 2" name="especie_beneficio_2">
                    <UInput v-model="formData.especie_beneficio_2" placeholder="Especie do benefício"/>
                  </UFormGroup>
                  <UFormGroup label="Número Benefício 2" name="numero_beneficio_2">
                    <UInput v-model="formData.numero_beneficio_2" placeholder="Número do benefício"/>
                  </UFormGroup>
                </div>
              </div>
            </UCard>
            <UCard>
              <template #header>
                <h3 class="font-semibold">Endereço</h3>
              </template>
              <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <UFormGroup label="CEP" name="cep">
                    <UInput v-model="formData.cep" @blur="consultarCEP" :loading="cepLoading" placeholder="Apenas números"/>
                  </UFormGroup>
                  <div class="md:col-span-2">
                    <UFormGroup label="Endereço" name="endereco">
                      <UInput v-model="formData.endereco" placeholder="Endereço completo"/>
                    </UFormGroup>
                  </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <UFormGroup label="Número" name="numero_endereco">
                    <UInput v-model="formData.numero_endereco" placeholder="Número" />
                  </UFormGroup>
                  <UFormGroup label="Complemento" name="complemento_endereco">
                    <UInput v-model="formData.complemento_endereco" placeholder="Complemento" />
                  </UFormGroup>
                  <UFormGroup label="Bairro" name="bairro">
                    <UInput v-model="formData.bairro" placeholder="Bairro" />
                  </UFormGroup>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <UFormGroup label="Cidade" name="cidade">
                    <UInput v-model="formData.cidade" placeholder="Cidade" />
                  </UFormGroup>
                  <UFormGroup label="Estado" name="estado">
                    <UInput v-model="formData.estado" placeholder="Estado" />
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
    </UModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { useCepLookup } from '~/composables/useCepLookup';

definePageMeta({
  middleware: 'auth',
  profiles: ['Master', 'Backoffice']
});

const supabase = useSupabaseClient();
const toast = useToast();

// --- ESTADO DA PÁGINA ---
const isModalOpen = ref(false);
const saving = ref(false);
const searchTerm = ref('');
const cpfError = ref('');
const exporting = ref(false);

// --- ESTADO DA PAGINAÇÃO ---
const page = ref(1);
const pageCount = ref(15);
const totalClients = ref(0);

// --- COMPOSABLES ---
const { loading: cepLoading, error: cepErrorApi, lookupCep } = useCepLookup();

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
  especie_beneficio_1: '', numero_beneficio_1: '',
  especie_beneficio_2: '', numero_beneficio_2: ''  
});
const formData = reactive(getInitialFormData());

// --- LÓGICA DE FORMATAÇÃO (MÁSCARAS) ---
watch(() => formData.cpf, (value) => {
  if (!value) return;
  const digits = value.replace(/\D/g, '').slice(0, 11);
  let result = digits;
  if (digits.length > 9) {
    result = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  } else if (digits.length > 6) {
    result = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  } else if (digits.length > 3) {
    result = `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }
  formData.cpf = result;
});

const applyPhoneMask = (value) => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length > 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
};

watch(() => formData.telefone, (value) => { formData.telefone = applyPhoneMask(value); });
watch(() => formData.telefone_secundario, (value) => { formData.telefone_secundario = applyPhoneMask(value); });

// --- TABELA ---
const columns = [
  { key: 'nome_completo', label: 'Nome Completo', sortable: true },
  { key: 'cpf', label: 'CPF', sortable: true },
  { key: 'cidade', label: 'Cidade' },
  { key: 'contratos', label: 'Contratos', sortable: false },
  { key: 'telefone', label: 'Telefone' },
  { key: 'actions', label: 'Ações' }
];

// --- LÓGICA DE BUSCA DE DADOS COM PAGINAÇÃO ---
const debouncedSearchTerm = ref('');
watch(searchTerm, useDebounceFn((newVal) => {
  debouncedSearchTerm.value = newVal;
  page.value = 1; // Volta para a primeira página ao pesquisar
}, 300));

const { data: clientes, pending, refresh } = useAsyncData(
  'clientes',
  async () => {
    const from = (page.value - 1) * pageCount.value;
    const to = from + pageCount.value - 1;

    let query = supabase
      .from('clientes')
      .select('*, contratos(count)', { count: 'exact' });

    if (debouncedSearchTerm.value) {
      query = query.or(`nome_completo.ilike.%${debouncedSearchTerm.value}%,cpf.ilike.%${debouncedSearchTerm.value}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    totalClients.value = count;
    return data;
  }, { watch: [page, debouncedSearchTerm] }
);

// Observa o campo de busca e executa a pesquisa com debounce
watch(searchTerm, useDebounceFn((newSearchTerm) => {
  if (newSearchTerm.length >= 3) {
    searchClients(newSearchTerm);
  } else if (newSearchTerm.length === 0) {
    fetchInitialClients(); // Se o campo for limpo, volta a mostrar os últimos 15
  }
}, 300));

// --- OPÇÕES DE EXPORTAÇÃO ---
const exportOptions = [
  [{
    label: 'Exportar para CSV',
    icon: 'i-heroicons-document-text',
    click: () => exportToCSV()
  }, {
    label: 'Exportar para PDF',
    icon: 'i-heroicons-document',
    click: () => exportToPDF()
  }]
];

// --- LÓGICA DE EXPORTAÇÃO PARA PDF ---
const exportToPDF = async () => {
  exporting.value = true;
  try {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    // 1. Busca os dados filtrados (semelhante ao CSV)
    let query = supabase
      .from('clientes')
      .select('nome_completo, cpf, cidade, estado, contratos(count)');

    if (debouncedSearchTerm.value) {
      query = query.or(`nome_completo.ilike.%${debouncedSearchTerm.value}%,cpf.ilike.%${debouncedSearchTerm.value}%`);
    }

    const { data: allClients, error } = await query.order('nome_completo', { ascending: true });

    if (error) throw error;
    if (!allClients || allClients.length === 0) {
      toast.add({ title: 'Nenhum dado para exportar', color: 'amber' });
      return; // Adicionado 'exporting.value = false' no finally
    }

    // 2. Gera o documento PDF
    const doc = new jsPDF();
    const tableColumn = ["Nome Completo", "CPF", "Cidade", "Estado", "Contratos"];
    const tableRows = [];

    allClients.forEach(client => {
      const clientData = [
        client.nome_completo,
        client.cpf,
        client.cidade,
        client.estado,
        client.contratos[0]?.count || 0,
      ];
      tableRows.push(clientData);
    });

    // CORREÇÃO: A função autoTable é acessada através de 'doc.default.autoTable'
    // ou podemos chamar a função importada diretamente.
    // Usando a chamada direta para maior clareza.
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
    doc.text("Relatório de Clientes", 14, 15);
    doc.save(`clientes_export_${new Date().toISOString().split('T')[0]}.pdf`);

  } catch (err) {
    toast.add({ title: 'Erro na Exportação', description: 'Não foi possível gerar o arquivo PDF.', color: 'red' });
  } finally {
    exporting.value = false;
  }
};

// --- LÓGICA DE EXPORTAÇÃO PARA CSV ---
const exportToCSV = async () => {
  exporting.value = true;
  try {
    // 1. Monta a query para buscar TODOS os clientes filtrados, sem paginação
    let query = supabase
      .from('clientes')
      .select('nome_completo, cpf, email, telefone, telefone_secundario, cidade, estado, contratos(count)');

    if (debouncedSearchTerm.value) {
      query = query.or(`nome_completo.ilike.%${debouncedSearchTerm.value}%,cpf.ilike.%${debouncedSearchTerm.value}%`);
    }

    const { data: allClients, error } = await query.order('nome_completo', { ascending: true });

    if (error) throw error;
    if (!allClients || allClients.length === 0) {
      toast.add({ title: 'Nenhum dado para exportar', description: 'A seleção atual de filtros não retornou clientes.', color: 'amber' });
      return;
    }

    // 2. Prepara o conteúdo do CSV
    const headers = ['Nome Completo', 'CPF', 'Email', 'Telefone', 'Telefone Secundário', 'Cidade', 'Estado', 'Qtd. Contratos'];
    const rows = allClients.map(client => [
      client.nome_completo,
      client.cpf,
      client.email,
      client.telefone,
      client.telefone_secundario,
      client.cidade,
      client.estado,
      client.contratos[0]?.count || 0
    ]);

    // Função para escapar células que possam conter vírgulas
    const escapeCell = (cell) => `"${String(cell || '').replace(/"/g, '""')}"`;

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.map(escapeCell).join(',') + '\n' 
      + rows.map(row => row.map(escapeCell).join(',')).join('\n');

    // 3. Cria o link e dispara o download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clientes_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (err) {
    toast.add({ title: 'Erro na Exportação', description: 'Não foi possível gerar o arquivo CSV.', color: 'red' });
  } finally {
    exporting.value = false;
  }
};

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
  const data = await lookupCep(formData.cep);

  if (data) {
    formData.endereco = data.logradouro;
    formData.bairro = data.bairro;
    formData.cidade = data.localidade;
    formData.estado = data.uf;
  } else if (cepErrorApi.value) {
    toast.add({
      title: cepErrorApi.value === 'CEP não encontrado.' ? 'Atenção!' : 'Erro!',
      description: cepErrorApi.value,
      color: cepErrorApi.value === 'CEP não encontrado.' ? 'amber' : 'red'
    });
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
    await refresh(); // Recarrega os dados da tabela
  } catch (error) {
    toast.add({ title: 'Erro!', description: error.message, color: 'red' });
  } finally {
    saving.value = false;
  }
};
</script>