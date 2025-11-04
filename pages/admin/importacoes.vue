<template>
  <div>
    <header class="mb-8">
      <h1 class="text-primary-500 text-3xl font-bold">Importação de Seguros</h1>
      <p class="text-gray-500 mt-1">Importe dados de BMG MED e Seguro Familiar a partir de ficheiros Excel.</p>
    </header>

    <div class="max-w-2xl mx-auto">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Passo 1: Selecione o Tipo de Importação</h3>
        </template>

        <UFormGroup label="Tipo de Dados a Importar" name="importType">
          <USelectMenu 
            v-model="importType" 
            :options="importOptions" 
            placeholder="Selecione o tipo" 
            value-attribute="value"
            option-attribute="label"
          />
        </UFormGroup>
      </UCard>

      <UCard class="mt-8" v-if="importType">
        <template #header>
          <h3 class="text-lg font-semibold">Passo 2: Envie o Ficheiro</h3>
        </template>

        <div class="space-y-4">
          <UFormGroup label="Ficheiro Excel (.xlsx)" name="file" :help="`Colunas esperadas: ${expectedColumns}`">
            <UInput type="file" @change="handleFileSelect" accept=".xlsx, .xls" />
          </UFormGroup>

          <!-- Resumo da Importação -->
          <div v-if="importSummary.total > 0" class="text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <p><strong>Resumo do Ficheiro:</strong></p>
            <p>Total de linhas a serem importadas: {{ importSummary.total }}</p>
          </div>

          <!-- Barra de Progresso da Leitura -->
          <div v-if="readingFile" class="space-y-2 pt-4">
            <p class="text-sm text-gray-500">A ler e validar o ficheiro...</p>
            <UProgress animation="carousel" />
          </div>

          <!-- Relatório de Erros de Validação -->
          <div v-if="validationErrors.length > 0" class="pt-4">
            <UAlert icon="i-heroicons-exclamation-triangle" color="red" variant="soft" title="Erros de Validação Encontrados">
              <template #description>
                <ul class="list-disc list-inside text-sm max-h-40 overflow-y-auto">
                  <li v-for="(err, i) in validationErrors" :key="i">{{ err }}</li>
                </ul>
              </template>
            </UAlert>
          </div>

        </div>
      </UCard>

      <!-- Modal de Preview -->
      <UModal v-model="showPreview" :ui="{ width: 'max-w-6xl' }">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Preview da Importação</h3>
              <UBadge :label="`${previewData.length} registos`" color="primary" />
            </div>
          </template>

          <div class="space-y-4">
            <UAlert color="primary" variant="soft" icon="i-heroicons-information-circle">
              <template #title>Confira os dados antes de confirmar</template>
              <template #description>
                Verifique se todos os vínculos estão corretos (✓ verde = vinculado com sucesso).
              </template>
            </UAlert>

            <div class="max-h-96 overflow-y-auto">
              <UTable :rows="previewData" :columns="previewColumns">
                <template #rowNumber-data="{ row }">
                  <span class="text-xs text-gray-500">Linha {{ row.rowNumber }}</span>
                </template>

                <template #consultor-data="{ row }">
                  <div class="flex items-center gap-1">
                    <UIcon v-if="row.vinculado.consultor" name="i-heroicons-check-circle" class="text-green-500" />
                    <UIcon v-else name="i-heroicons-x-circle" class="text-red-500" />
                    <span>{{ row.consultor }}</span>
                  </div>
                </template>

                <template #supervisor-data="{ row }">
                  <div class="flex items-center gap-1">
                    <UIcon v-if="row.vinculado.supervisor" name="i-heroicons-check-circle" class="text-green-500" />
                    <UIcon v-else name="i-heroicons-x-circle" class="text-red-500" />
                    <span>{{ row.supervisor }}</span>
                  </div>
                </template>

                <template #coordenador-data="{ row }">
                  <div class="flex items-center gap-1">
                    <UIcon v-if="row.vinculado.coordenador" name="i-heroicons-check-circle" class="text-green-500" />
                    <UIcon v-else name="i-heroicons-x-circle" class="text-red-500" />
                    <span>{{ row.coordenador }}</span>
                  </div>
                </template>

                <template #franquia-data="{ row }">
                  <div class="flex items-center gap-1">
                    <UIcon v-if="row.vinculado.loja" name="i-heroicons-check-circle" class="text-green-500" />
                    <UIcon v-else name="i-heroicons-x-circle" class="text-red-500" />
                    <span>{{ row.franquia }}</span>
                  </div>
                </template>

                <template #dataContrato-data="{ row }">
                  <span class="text-sm">{{ new Date(row.dataContrato).toLocaleDateString('pt-BR') }}</span>
                </template>
              </UTable>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton color="gray" variant="ghost" @click="cancelImport" :disabled="importing">
                Cancelar
              </UButton>
              <UButton color="primary" @click="confirmImport" :loading="importing">
                Confirmar Importação
              </UButton>
            </div>
          </template>
        </UCard>
      </UModal>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import * as XLSX from 'xlsx';

const supabase = useSupabaseClient();
const toast = useToast();

// --- ESTADO ---
const importType = ref(null);
const file = ref(null);
const importing = ref(false);
const readingFile = ref(false);
const parsedData = ref([]);
const validationErrors = ref([]);
const importSummary = reactive({ total: 0 });
const showPreview = ref(false);
const previewData = ref([]);

const importOptions = [
  { label: 'BMG MED', value: 'bmg_med' },
  { label: 'Seguro Familiar', value: 'seguro_familiar' }
];

definePageMeta({
  middleware: 'auth',
  profiles: ['Backoffice', 'Master']
});

const expectedColumns = computed(() => {
  const base = 'Franquia, Consultor, Supervisor, Coordenador, Adesão, Data Contrato';
  if (importType.value === 'bmg_med') return `${base}, Qtd Seguros Bmg Med`;
  if (importType.value === 'seguro_familiar') return `${base}, Qtd Seguro Familiar`;
  return base;
});

// --- CARREGAMENTO DE DADOS PARA VALIDAÇÃO ---
const { data: validationData } = await useAsyncData('validation-data', async () => {
  // CORREÇÃO: Carrega todos os funcionários via endpoint server (contorna RLS) e lojas via cliente público.
  const [perfisRes, lojasRes] = await Promise.all([
    supabase.from('perfis').select('id, nome'),
    supabase.from('lojas').select('id, nome, franquia').eq('is_active', true)
  ]);

  // Busca funcionários ativos via endpoint server
  try {
    const tokenResp = await supabase.auth.getSession();
    const token = tokenResp?.data?.session?.access_token || null;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const resp = await $fetch('/api/funcionarios/search', { method: 'POST', headers, body: { is_active: true, limit: 5000 } });
    const funcionarios = resp?.data || [];

    const perfilMap = new Map((perfisRes.data || []).map(p => [p.id, p.nome]));

    return {
      consultores: (funcionarios || []).filter(f => perfilMap.get(f.perfil_id) === 'Consultor') || [],
      supervisores: (funcionarios || []).filter(f => perfilMap.get(f.perfil_id) === 'Supervisor') || [],
      coordenadores: (funcionarios || []).filter(f => perfilMap.get(f.perfil_id) === 'Coordenador') || [],
      lojas: lojasRes.data || [],
      perfis: perfisRes.data || []
    };
  } catch (err) {
    console.error('Erro ao carregar validationData via endpoint:', err);
    return {
      consultores: [],
      supervisores: [],
      coordenadores: [],
      lojas: lojasRes.data || [],
      perfis: perfisRes.data || []
    };
  }
}, { server: false });

const handleFileSelect = async (event) => {
  resetForm();
  const selectedFile = event[0];
  if (!selectedFile) return;

  file.value = selectedFile;
  readingFile.value = true;

  try {
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(new Uint8Array(e.target.result));
      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer(selectedFile);
    });

    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Lê o JSON com os cabeçalhos originais.
    const rawJsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const header = rawJsonData[0];
    // Normaliza: lowercase, remove espaços e acentos
    const headerNormalized = header.map(h => 
      String(h)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    );
    
    // Converte para o formato de objeto com chaves normalizadas.
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: headerNormalized,
      range: 1 // Começa a ler os dados da segunda linha (índice 1)
    });

    // --- VALIDAÇÃO ---
    // CORREÇÃO: Cria mapas para todos os perfis e usa a coluna 'franquia' para o mapa de lojas.
    const consultorMap = new Map(validationData.value.consultores.map(c => [c.nome_completo.trim().toUpperCase(), c.id]));
    const supervisorMap = new Map(validationData.value.supervisores.map(s => [s.nome_completo.trim().toUpperCase(), s.id]));
    const coordenadorMap = new Map(validationData.value.coordenadores.map(c => [c.nome_completo.trim().toUpperCase(), c.id]));
    const lojaMap = new Map(validationData.value.lojas.map(l => [l.franquia.trim().toUpperCase(), l.id]));
    const errors = [];
    const dataToImport = [];

    // CORREÇÃO: Usa os nomes de coluna normalizados.
    const qtyColumn = importType.value === 'bmg_med' ? 'qtdsegurosbmgmed' : 'qtdsegurofamiliar';

    jsonData.forEach((row, index) => {
      // CORREÇÃO: Busca os IDs de todos os funcionários e da loja corretamente.
      const consultorId = consultorMap.get(row.consultor?.trim().toUpperCase());
      const supervisorId = supervisorMap.get(row.supervisor?.trim().toUpperCase());
      const coordenadorId = coordenadorMap.get(row.coordenador?.trim().toUpperCase());
      const lojaId = lojaMap.get(row.franquia?.trim().toUpperCase());

      if (!consultorId) errors.push(`Linha ${index + 2}: Consultor "${row.consultor}" não encontrado ou inativo.`);
      if (!supervisorId) errors.push(`Linha ${index + 2}: Supervisor "${row.supervisor}" não encontrado ou inativo.`);
      if (!coordenadorId) errors.push(`Linha ${index + 2}: Coordenador "${row.coordenador}" não encontrado ou inativo.`);
      if (!lojaId) errors.push(`Linha ${index + 2}: Loja "${row.franquia}" não encontrada ou inativa.`);
      if (!row[qtyColumn] || isNaN(parseInt(row[qtyColumn]))) errors.push(`Linha ${index + 2}: Quantidade inválida ou ausente.`);
      if (!row.datacontrato || !(row.datacontrato instanceof Date)) errors.push(`Linha ${index + 2}: Data do contrato inválida ou ausente.`);

      if (consultorId && supervisorId && coordenadorId && lojaId) {
        dataToImport.push({
          consultor_id: consultorId,
          supervisor_id: supervisorId,
          coordenador_id: coordenadorId,
          loja_id: lojaId,
          tipo_produto: importType.value,
          data_venda: row.datacontrato,
          quantidade: parseInt(row[qtyColumn]),
          adesao: row.adesao, // Agora sem acento após normalização
          // Dados para preview
          _preview: {
            consultor: row.consultor,
            supervisor: row.supervisor,
            coordenador: row.coordenador,
            franquia: row.franquia,
            dataContrato: row.datacontrato,
            quantidade: parseInt(row[qtyColumn])
          }
        });
      }
    });

    validationErrors.value = errors;
    parsedData.value = dataToImport;
    importSummary.total = dataToImport.length;

    // Se não houver erros, mostra o preview
    if (errors.length === 0 && dataToImport.length > 0) {
      previewData.value = dataToImport.map((item, idx) => ({
        ...item._preview,
        rowNumber: idx + 2,
        vinculado: {
          consultor: !!item.consultor_id,
          supervisor: !!item.supervisor_id,
          coordenador: !!item.coordenador_id,
          loja: !!item.loja_id
        }
      }));
      showPreview.value = true;
    }

  } catch (error) {
    toast.add({ title: 'Erro ao ler arquivo', description: error.message, color: 'red' });
    resetForm();
  } finally {
    readingFile.value = false;
    const inputElement = document.querySelector('input[type="file"]');
    if (inputElement) inputElement.value = '';
  }
};

const confirmImport = async () => {
  importing.value = true;

  try {
    // Remove o campo _preview antes de inserir
    const dataToInsert = parsedData.value.map(({ _preview, ...rest }) => rest);
    
    const { error } = await supabase.from('vendas_externas').upsert(dataToInsert, {
      onConflict: 'adesao, tipo_produto' // Chave única para evitar duplicados
    });

    if (error) throw error;

    toast.add({ 
      title: 'Sucesso!', 
      description: `${dataToInsert.length} registos de seguros foram importados/atualizados.`,
      color: 'green'
    });
    resetForm();
  } catch (error) {
    console.error('Erro na importação:', error);
    toast.add({ title: 'Erro na Importação', description: error.message, color: 'red' });
  } finally {
    importing.value = false;
  }
};

const cancelImport = () => {
  showPreview.value = false;
  resetForm();
};

const resetForm = () => {
  file.value = null;
  parsedData.value = [];
  validationErrors.value = [];
  previewData.value = [];
  showPreview.value = false;
  Object.assign(importSummary, { total: 0 });
};

const previewColumns = [
  { key: 'rowNumber', label: '#' },
  { key: 'franquia', label: 'Franquia' },
  { key: 'consultor', label: 'Consultor' },
  { key: 'supervisor', label: 'Supervisor' },
  { key: 'coordenador', label: 'Coordenador' },
  { key: 'dataContrato', label: 'Data' },
  { key: 'quantidade', label: 'Qtd' }
];
</script>