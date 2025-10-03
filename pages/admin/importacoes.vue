<template>
  <div>
    <header class="mb-8">
      <h1 class="text-primary-500 text-3xl font-bold">Importação de Dados</h1>
      <p class="text-gray-500 mt-1">Importe dados de produtos a partir de ficheiros Excel.</p>
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
import { ref, computed } from 'vue';
import * as XLSX from 'xlsx';

const supabase = useSupabaseClient();
const toast = useToast();

const importType = ref(null);
const fileName = ref('');
const importing = ref(false);
const progress = ref(0);
const progressStatus = ref('');

const importOptions = [
  { label: 'Metas de BMG MED', value: 'bmg_med' },
  { label: 'Metas de Seguro Familiar', value: 'seguro_familiar' },
];

// CORREÇÃO: `file` agora é uma propriedade computada para garantir reatividade.
const selectedFiles = ref(null);
const file = computed(() => selectedFiles.value?.[0]);

const onFileChange = (files) => {
  selectedFiles.value = files;
  // Atualiza o nome do ficheiro para exibição
  fileName.value = files[0]?.name || '';
};

const handleImport = async () => {
  importing.value = true;
  progress.value = 0;
  progressStatus.value = '';

  try {
    if (!file.value) {
      throw new Error('Nenhum ficheiro selecionado.');
    }

    // 1. Ler o ficheiro Excel
    progressStatus.value = 'A ler o ficheiro...';
    progress.value = 20;
    const data = await file.value.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      throw new Error('O ficheiro Excel está vazio ou em formato incorreto.');
    }

    // 2. Buscar dados de referência (lojas e funcionários) para mapear nomes para IDs
    progressStatus.value = 'A buscar referências no sistema...';
    progress.value = 40;
    const [lojasRes, funcsRes] = await Promise.all([
      supabase.from('lojas').select('id, franquia'),
      supabase.from('funcionarios').select('id, nome_completo')
    ]);
    // CORREÇÃO: Filtra lojas que não têm um nome de franquia definido para evitar o erro .trim() em valores nulos.
    const lojasMap = new Map(
      lojasRes.data.filter(l => l.franquia).map(l => [l.franquia.trim().toLowerCase(), l.id])
    );
    // Garante que funcionários com nome nulo (improvável, mas seguro) não quebrem a aplicação.
    const funcsMap = new Map(funcsRes.data.filter(f => f.nome_completo).map(f => [f.nome_completo.trim().toLowerCase(), f.id]));

    // 3. Mapear os dados do Excel para o formato do banco de dados
    progressStatus.value = `A processar ${jsonData.length} registos...`;
    progress.value = 70;
    const dataToInsert = jsonData.map((row, index) => {
      // CORREÇÃO: Normaliza as chaves do objeto para evitar erros com espaços ou maiúsculas/minúsculas nos cabeçalhos
      const normalizedRow = Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim().toLowerCase(), value]));

      const franquia = normalizedRow['franquia'];
      const consultor = normalizedRow['consultor'];
      const supervisor = normalizedRow['supervisor'];
      const coordenador = normalizedRow['coordenador'];
      const adesao = normalizedRow['adesão'] || normalizedRow['adesao']; // CORREÇÃO: Aceita 'Adesão' ou 'Adesao'
      const dataContrato = normalizedRow['data contrato'];
      const quantidade = normalizedRow['qtd seguros bmg med'] || normalizedRow['qtd seguro familiar'] || 1;

      // CORREÇÃO: Pula a linha se os dados essenciais (adesao, dataContrato) estiverem em falta, em vez de parar tudo.
      if (!adesao || !dataContrato) {
        return null;
      }

      // Converte a data do Excel (número de série) para o formato 'YYYY-MM-DD'
      const jsDate = XLSX.SSF.parse_date_code(dataContrato);
      if (!jsDate) return null; // Pula se a data for inválida
      const formattedDate = `${jsDate.y}-${String(jsDate.m).padStart(2, '0')}-${String(jsDate.d).padStart(2, '0')}`;

      return {
        adesao: String(adesao),
        tipo_produto: importType.value,
        data_venda: formattedDate,
        quantidade: parseInt(String(quantidade || '1'), 10),
        loja_id: franquia ? lojasMap.get(franquia.trim().toLowerCase()) : null,
        consultor_id: consultor ? funcsMap.get(consultor.trim().toLowerCase()) : null,
        supervisor_id: supervisor ? funcsMap.get(supervisor.trim().toLowerCase()) : null,
        coordenador_id: coordenador ? funcsMap.get(coordenador.trim().toLowerCase()) : null,
      };
    }).filter(Boolean); // Filtra quaisquer linhas que retornaram 'null'

    const skippedRows = jsonData.length - dataToInsert.length;

    // 4. Inserir os dados no Supabase
    progressStatus.value = 'A salvar os dados no banco de dados...';
    progress.value = 90;
    // Usamos 'upsert' para atualizar registos existentes com a mesma 'adesao' ou criar novos.
    const { error } = await supabase.from('vendas_externas').upsert(dataToInsert, {
      onConflict: 'adesao',
    });

    if (error) {
      throw error;
    }

    progress.value = 100;
    toast.add({
      title: 'Importação Concluída!',
      description: `${dataToInsert.length} registos processados. ${skippedRows > 0 ? `${skippedRows} linhas ignoradas por falta de dados.` : ''}`,
    });

    // Limpar estado após sucesso
    file.value = null;
    fileName.value = '';
    importType.value = null;

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
</script>