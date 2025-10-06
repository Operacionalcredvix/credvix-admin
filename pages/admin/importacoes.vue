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
          <UFormGroup label="Ficheiro Excel (.xlsx)" name="file">
            <UInput type="file" @change="onFileChange" accept=".xlsx, .xls" />
          </UFormGroup>

          <div v-if="fileName" class="text-sm text-gray-500">
            Ficheiro selecionado: <span class="font-medium">{{ fileName }}</span>
          </div>

          <!-- Barra de Progresso -->
          <div v-if="importing" class="space-y-2 pt-4">
            <p class="text-sm text-gray-500">{{ progressStatus }}</p>
            <UProgress :value="progress" />
          </div>

          <!-- Relatório de Erros -->
          <div v-if="importResult && importResult.errors.length > 0" class="pt-4">
            <UAlert icon="i-heroicons-exclamation-triangle" color="red" variant="soft" title="Erros na Importação">
              <template #description>
                <ul class="list-disc list-inside text-sm max-h-40 overflow-y-auto">
                  <li v-for="(err, i) in importResult.errors" :key="i">{{ err }}</li>
                </ul>
              </template>
            </UAlert>
          </div>

          <div class="border-t pt-4">
            <h4 class="font-semibold mb-2">Instruções e Formato Esperado:</h4>
            <ul class="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>O ficheiro deve estar no formato .xlsx ou .xls.</li>
              <li>A primeira linha do ficheiro deve conter os cabeçalhos das colunas.</li>
              <li>As colunas esperadas são: <strong>Franquia</strong>, <strong>Consultor</strong>, <strong>Supervisor</strong>, <strong>Coordenador</strong>, <strong>Adesão</strong>, <strong>data Contrato</strong>, <strong>Qtd Seguros Bmg Med</strong> (ou Qtd Seguro Familiar).</li>
              <li>Os nomes devem corresponder exatamente aos registados no sistema.</li>
            </ul>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton @click="handleImport" :disabled="!file" :loading="importing">
              Iniciar Importação
            </UButton>
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const supabase = useSupabaseClient();
const toast = useToast();

const importType = ref(null);
const file = ref(null);
const fileName = ref('');
const importing = ref(false);
const progress = ref(0);
const progressStatus = ref('');

const importOptions = [
  { label: 'Metas de BMG MED', value: 'bmg_med' },
  { label: 'Metas de Seguro Familiar', value: 'seguro_familiar' }
];

definePageMeta({
  middleware: 'auth',
  profiles: ['Backoffice', 'Master']
});

const onFileChange = (event) => {
  const files = event.target.files;
  if (files && files.length > 0) {
    file.value = files[0];
    fileName.value = file.value.name;
  } else {
    file.value = null;
    fileName.value = '';
  }
};

const handleImport = async () => {
  importing.value = true;
  progress.value = 0;
  progressStatus.value = '';
  importResult.value = null;

  try {
    if (!file.value) {
      throw new Error('Nenhum ficheiro selecionado.');
    }

    progressStatus.value = 'A enviar o ficheiro para o servidor...';
    progress.value = 30;

    const formData = new FormData();
    formData.append('file', file.value);
    formData.append('importType', importType.value);

    progressStatus.value = 'A processar no servidor... Isto pode demorar alguns minutos.';
    progress.value = 70;

    const { data: result, error } = await supabase.functions.invoke('import-vendas-externas', {
      body: formData,
    })

    if (error) {
      throw error;
    }

    importResult.value = result;
    progress.value = 100;
    toast.add({
      title: 'Importação Concluída!',
      description: result.message,
      color: result.errors.length > 0 ? 'amber' : 'green',
      timeout: 10000
    });

    // Limpar estado após sucesso
    resetForm();

  } catch (err) {
    console.error('Erro na importação:', err);
    toast.add({
      title: 'Erro na Importação',
      description: err.message,
      color: 'red',
    });
  } finally {
    importing.value = false;
    progress.value = 0;
    progressStatus.value = '';
  }
};

const resetForm = () => {
  file.value = null;
  fileName.value = '';
  importType.value = null;
  importResult.value = null;
};
</script>