<template>
  <div>
    <header class="mb-8 flex justify-between items-center">
      <h1 class="text-primary-500 text-3xl font-bold">Gestão de Tabelas de Comissão</h1>
      <div class="flex gap-2">
        <UButton icon="i-heroicons-arrow-up-tray" size="lg" color="gray" @click="isImportModalOpen = true">
          Importar Excel
        </UButton>
        <UButton icon="i-heroicons-plus-circle" size="lg" @click="openModal()">
          Adicionar Nova Tabela
        </UButton>
      </div>
    </header>

    <!-- NOVO: Card de Filtros -->
    <UCard class="mb-8">
      <div class="flex items-center gap-4">
        <UFormGroup label="Filtrar por Produto" name="productFilter" class="w-64">
          <USelectMenu v-model="selectedProduct" :options="produtos" value-attribute="id" option-attribute="nome"
            placeholder="Todos os produtos" clearable />
        </UFormGroup>
      </div>
    </UCard>

    <UCard>
      <!-- CORREÇÃO: Usa a lista filtrada em vez da lista completa -->
      <UTable :rows="filteredTabelas || []" :columns="columns" :loading="pending">
        <template #banco-data="{ row }">
          <span>{{ row.bancos.nome_instituicao }}</span>
        </template>

        <template #produto-data="{ row }">
          <span>{{ row.produtos?.nome || 'N/A' }}</span>
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

          <UFormGroup label="Produto" name="produto_id" required>
            <USelectMenu v-model="formData.produto_id" :options="produtos" value-attribute="id" option-attribute="nome" placeholder="Selecione o produto" />
          </UFormGroup>

          <UFormGroup label="Nome da Tabela" name="nome_tabela" required>
            <UInput v-model="formData.nome_tabela" placeholder="Ex: TX 1,85" />
          </UFormGroup>

          <UFormGroup label="Prazos (meses)" name="prazos" help="Adicione os prazos separados por vírgula. Ex: 36, 48, 72">
            <UInput v-model="prazosInput" placeholder="Ex: 36, 48, 72" />
          </UFormGroup>

          <div class="flex justify-end space-x-2 pt-4">
            <UButton label="Cancelar" color="gray" variant="ghost" @click="isModalOpen = false" />
            <UButton type="submit" :label="formData.id ? 'Salvar Alterações' : 'Criar Tabela'" :loading="saving" />
          </div>
        </UForm>
      </UCard>
    </USlideover>

    <!-- NOVO: Modal de Importação -->
    <UModal v-model="isImportModalOpen">
      <UCard>
        <template #header>
          <h3 class="text-base font-semibold">Importar Tabelas de Comissão via Excel</h3>
        </template>

        <div class="space-y-4">
          <p class="text-sm text-gray-500">
            Selecione um arquivo Excel (.xlsx) com as colunas: <UBadge color="gray" variant="soft">banco</UBadge>, <UBadge color="gray" variant="soft">tabela</UBadge>, <UBadge color="gray" variant="soft">prazo</UBadge>, <UBadge color="gray" variant="soft">produto</UBadge>.
          </p>
          <UInput type="file" accept=".xlsx" @change="handleFileSelect" />

          <div v-if="importSummary.total > 0" class="text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <p><strong>Resumo da Importação:</strong></p>
            <p>Tabelas encontradas: {{ importSummary.total }}</p>
            <p class="text-green-500">Novas a serem criadas: {{ importSummary.new }}</p>
            <p class="text-amber-500">Existentes a serem atualizadas: {{ importSummary.updated }}</p>
          </div>
        </div>

        <!-- NOVO: Bloco de Erros de Validação -->
        <div v-if="importValidationErrors.length > 0" class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md max-h-60 overflow-y-auto">
          <p class="font-bold text-red-600 dark:text-red-400">Erros de Validação Encontrados:</p>
          <ul class="list-disc list-inside text-sm text-red-500 dark:text-red-300 mt-2">
            <li v-for="(error, index) in importValidationErrors" :key="index">{{ error }}</li>
          </ul>
        </div>

        <!-- NOVO: Barra de progresso durante a leitura do arquivo -->
        <div v-if="readingFile" class="space-y-2 pt-4">
          <p class="text-sm text-gray-500">A processar o arquivo...</p>
          <UProgress animation="carousel" />
        </div>

        <template #footer>
          <!-- CORREÇÃO: O botão agora é desabilitado se houver erros de validação. -->
          <UButton label="Processar Importação" :loading="importing" :disabled="!fileToImport || readingFile || importValidationErrors.length > 0" @click="processImport" />
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth',
  profiles: ['Backoffice', 'Master']
});

const supabase = useSupabaseClient();
const { success, error: showError, warning } = useAppToast();

// --- ESTADO DA PÁGINA ---
const isModalOpen = ref(false);
const saving = ref(false);

// --- NOVO: ESTADO PARA O FILTRO ---
const selectedProduct = ref(null);

// --- NOVO: ESTADO PARA IMPORTAÇÃO ---
const isImportModalOpen = ref(false);
const readingFile = ref(false); // NOVO: Estado para a leitura do arquivo
const importing = ref(false);
const fileToImport = ref(null);
const parsedData = ref([]);
const importSummary = reactive({ total: 0, new: 0, updated: 0 });
const importValidationErrors = ref([]); // NOVO: Estado para os erros de validação

const getInitialFormData = () => ({
  id: null,
  banco_id: null,
  produto_id: null,
  nome_tabela: '',
  prazos: []
});
const formData = reactive(getInitialFormData());
const prazosInput = ref(''); // Variável auxiliar para o campo de texto dos prazos

// --- DEFINIÇÃO DAS COLUNAS DA TABELA ---
const columns = [
  { key: 'banco', label: 'Banco', sortable: true },
  { key: 'produto', label: 'Produto', sortable: true },
  { key: 'nome_tabela', label: 'Nome da Tabela', sortable: true },
  { key: 'prazos', label: 'Prazos Disponíveis' },
  { key: 'actions', label: 'Ações' }
];

// --- CARREGAMENTO DE DADOS ---
const { data: tabelas, pending, refresh } = await useAsyncData('tabelas', async () => {
  // CORREÇÃO: Remove espaços na string do select para evitar erros de parsing no PostgREST.
  // CORREÇÃO: Especifica explicitamente a relação com 'produtos' usando a coluna 'produto_id'
  // para resolver a ambiguidade e o erro PGRST200.
  const selectQuery = '*, bancos(nome_instituicao), produtos:produto_id(nome)';
  const { data, error } = await supabase.from('tabelas').select(selectQuery).order('id');
  if (error) console.error("Erro ao buscar tabelas:", error);
  return data || [];
});

const { data: bancos } = await useAsyncData('bancos-form', async () => {
  const { data } = await supabase.from('bancos').select('id, nome_instituicao').order('nome_instituicao');
  return data || [];
});

const { data: produtos } = await useAsyncData('produtos-form', async () => {
  const { data } = await supabase.from('produtos').select('id, nome').order('nome');
  return data || [];
});

// --- LÓGICA COMPUTADA PARA FILTRAGEM ---
const filteredTabelas = computed(() => {
  if (!tabelas.value) return [];
  if (!selectedProduct.value) {
    return tabelas.value; // Retorna todas as tabelas se nenhum produto for selecionado
  }
  return tabelas.value.filter(tabela => tabela.produto_id === selectedProduct.value);
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
  // Converte o texto dos prazos de volta para um array de texto, removendo espaços e itens vazios
  // CORREÇÃO: Converte para um array de NÚMEROS
  formData.prazos = prazosInput.value.split(',')
    .map(p => parseInt(p.trim(), 10))
    .filter(p => !isNaN(p) && p > 0);

  try {
    const { bancos, produtos, ...dataToSave } = formData; // Remove dados de relação antes de salvar

    if (dataToSave.id) {
      const { error } = await supabase.from('tabelas').update(dataToSave).eq('id', dataToSave.id);
      if (error) throw error;
      success({ title: 'Sucesso!', description: 'Tabela atualizada.' });
    } else {
      delete dataToSave.id;
      const { error } = await supabase.from('tabelas').insert(dataToSave);
      if (error) throw error;
      success({ title: 'Sucesso!', description: 'Nova tabela criada.' });
    }
    isModalOpen.value = false;
    await refresh();
  } catch (error) {
    showError({ title: 'Erro!', description: error.message });
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (tabela) => {
  if (confirm(`Tem a certeza que quer excluir a tabela "${tabela.nome_tabela}"?`)) {
    try {
      const { error } = await supabase.from('tabelas').delete().eq('id', tabela.id);
      if (error) throw error;
      success({ title: 'Sucesso!', description: 'Tabela excluída.' });
      await refresh();
    } catch (error) {
      showError({ title: 'Erro!', description: error.message });
    }
  }
};

// --- LÓGICA DE IMPORTAÇÃO ---
import * as XLSX from 'xlsx';

const handleFileSelect = async (event) => {
  // CORREÇÃO: O UInput emite a FileList diretamente, não o objeto Event completo.
  // Portanto, acedemos ao primeiro ficheiro através de event[0].
  const file = event[0];

  // O evento original do input não é mais diretamente acessível aqui.
  // A lógica para limpar o input foi movida para o final do processamento.

  if (!file) {
    resetImport();
    return;
  }
  // CORREÇÃO: Atribui o arquivo imediatamente para habilitar o botão.
  // A leitura e processamento continuarão de forma assíncrona.
  fileToImport.value = file;

  // Limpa erros de validação anteriores
  importValidationErrors.value = [];

  readingFile.value = true; // ATIVA a barra de progresso
  try {
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(new Uint8Array(e.target.result));
      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer(file);
    });

    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: (h) => h.toLowerCase().trim() });

    const grouped = jsonData.reduce((acc, row) => {
      if (!row.banco || !row.tabela || !row.produto) return acc;
      const key = `${row.banco.trim()}-${row.produto.trim()}-${row.tabela.trim()}`;
      if (!acc[key]) {
        acc[key] = { banco: row.banco.trim(), nome_tabela: row.tabela.trim(), produto: row.produto.trim(), prazos: new Set() };
      }
      if (row.prazo) acc[key].prazos.add(String(row.prazo).trim());
      return acc;
    }, {});

    parsedData.value = Object.values(grouped).map(item => ({ ...item, prazos: Array.from(item.prazos).sort((a, b) => a - b) }));

    // --- NOVA LÓGICA DE VALIDAÇÃO ---
    const bankMap = new Map(bancos.value.map(b => [b.nome_instituicao.trim().toUpperCase(), b.id]));
    const productMap = new Map(produtos.value.map(p => [p.nome.trim().toUpperCase(), p.id]));
    const errors = [];

    parsedData.value.forEach((item, index) => {
      if (!bankMap.has(item.banco.toUpperCase())) {
        errors.push(`Linha ${index + 2}: Banco "${item.banco}" não encontrado no sistema.`);
      }
      if (!productMap.has(item.produto.toUpperCase())) {
        errors.push(`Linha ${index + 2}: Produto "${item.produto}" não encontrado no sistema.`);
      }
    });
    importValidationErrors.value = errors;
    // --- FIM DA VALIDAÇÃO ---

    importSummary.total = parsedData.value.length;
    const existingTableKeys = tabelas.value.map(t => `${t.bancos.nome_instituicao}-${t.produtos?.nome}-${t.nome_tabela}`);
    importSummary.new = parsedData.value.filter(p => !existingTableKeys.includes(`${p.banco}-${p.produto}-${p.nome_tabela}`)).length;
    importSummary.updated = importSummary.total - importSummary.new;
  } catch (error) {
    showError({ title: 'Erro ao ler arquivo', description: error.message });
    resetImport();
  } finally {
    readingFile.value = false; // DESATIVA a barra de progresso
    // Limpa o valor do input de ficheiro para permitir que o mesmo ficheiro
    // seja selecionado novamente e dispare o evento @change.
    const inputElement = document.querySelector('input[type="file"]');
    if (inputElement) inputElement.value = '';
  }
};

const processImport = async () => {
  if (parsedData.value.length === 0 || importValidationErrors.value.length > 0) {
    warning({ title: 'Atenção', description: 'Nenhum dado válido para importar.' });
    return;
  }
  importing.value = true;

  try {
    // Mapeia nome do banco para ID
    const bankMap = new Map(bancos.value.map(b => [b.nome_instituicao.trim().toUpperCase(), b.id]));
    const productMap = new Map(produtos.value.map(p => [p.nome.trim().toUpperCase(), p.id]));

    const dataToUpsert = parsedData.value
      .map(item => ({
        banco_id: bankMap.get(item.banco.trim().toUpperCase()),
        produto_id: productMap.get(item.produto.trim().toUpperCase()),
        nome_tabela: item.nome_tabela,
        prazos: item.prazos
      }))
      .filter(item => item.banco_id && item.produto_id); // Filtra apenas itens com banco e produto correspondentes

    const { error } = await supabase.from('tabelas').upsert(dataToUpsert, {
      // CORREÇÃO: A chave de conflito não deve conter espaços.
      onConflict: 'banco_id,produto_id,nome_tabela'
    });

    if (error) throw error;

    success({ title: 'Sucesso!', description: `${dataToUpsert.length} tabelas foram importadas/atualizadas.` });
    await refresh();
    isImportModalOpen.value = false;
    resetImport();
  } catch (error) {
    showError({ title: 'Erro na importação', description: error.message });
  } finally {
    importing.value = false;
  }
};

const resetImport = () => {
  fileToImport.value = null;
  parsedData.value = [];
  Object.assign(importSummary, { total: 0, new: 0, updated: 0 });
  importValidationErrors.value = []; // Limpa os erros
};
</script>