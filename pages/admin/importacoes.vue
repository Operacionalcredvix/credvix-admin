<template>
  <div>
    <header class="mb-8">
      <h1 class="text-primary-500 text-3xl font-bold">Importação de Vendas Externas</h1>
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

        <template #footer>
          <div class="flex justify-end">
            <UButton @click="processImport" :disabled="!file || readingFile || validationErrors.length > 0" :loading="importing">
              Iniciar Importação
            </UButton>
          </div>
        </template>
      </UCard>
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

const importOptions = [
  { label: 'Metas de BMG MED', value: 'bmg_med' },
  { label: 'Metas de Seguro Familiar', value: 'seguro_familiar' }
];

definePageMeta({
  middleware: 'auth',
  profiles: ['Backoffice', 'Master']
});

const expectedColumns = computed(() => {
  const base = 'Franquia, Consultor, Adesão, data Contrato';
  if (importType.value === 'bmg_med') return `${base}, Qtd Seguros Bmg Med`;
  if (importType.value === 'seguro_familiar') return `${base}, Qtd Seguro Familiar`;
  return base;
});

// --- CARREGAMENTO DE DADOS PARA VALIDAÇÃO ---
const { data: validationData } = await useAsyncData('validation-data', async () => {
  // CORREÇÃO: Carrega todos os tipos de funcionários e a coluna 'franquia' da loja.
  const [funcionariosRes, lojasRes] = await Promise.all([
    supabase.from('funcionarios').select('id, nome_completo, perfil_id, perfis(nome)').eq('is_active', true),
    supabase.from('lojas').select('id, nome, franquia').eq('is_active', true)
  ]);
  return {
    // Separa os funcionários por perfil para facilitar a busca
    consultores: funcionariosRes.data?.filter(f => f.perfis.nome === 'Consultor') || [],
    supervisores: funcionariosRes.data?.filter(f => f.perfis.nome === 'Supervisor') || [],
    coordenadores: funcionariosRes.data?.filter(f => f.perfis.nome === 'Coordenador') || [],
    lojas: lojasRes.data || [],
    // Adiciona os perfis para referência
    perfis: (await supabase.from('perfis').select('id, nome')).data || []
  };
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
    const headerNormalized = header.map(h => String(h).toLowerCase().trim().replace(/\s+/g, ''));
    
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
          adesao: row.adesão // CORREÇÃO: Acessa a propriedade com o nome normalizado correto.
        });
      }
    });

    validationErrors.value = errors;
    parsedData.value = dataToImport;
    importSummary.total = dataToImport.length;

  } catch (error) {
    toast.add({ title: 'Erro ao ler arquivo', description: error.message, color: 'red' });
    resetForm();
  } finally {
    readingFile.value = false;
    const inputElement = document.querySelector('input[type="file"]');
    if (inputElement) inputElement.value = '';
  }
};

const processImport = async () => {
  if (parsedData.value.length === 0 || validationErrors.value.length > 0) {
    toast.add({ title: 'Atenção', description: 'Nenhum dado válido para importar.', color: 'amber' });
    return;
  }
  importing.value = true;

  try {
    const { error } = await supabase.from('vendas_externas').upsert(parsedData.value, {
      onConflict: 'adesao, tipo_produto' // Chave única para evitar duplicados
    });

    if (error) throw error;

    toast.add({ title: 'Sucesso!', description: `${parsedData.value.length} registos foram importados/atualizados.` });
    resetForm();
  } catch (error) {
    console.error('Erro na importação:', error);
    toast.add({ title: 'Erro na Importação', description: error.message, color: 'red' });
  } finally {
    importing.value = false;
  }
};

const resetForm = () => {
  file.value = null;
  parsedData.value = [];
  validationErrors.value = [];
  Object.assign(importSummary, { total: 0 });
};
</script>