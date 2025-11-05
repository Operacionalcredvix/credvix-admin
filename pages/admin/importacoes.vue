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
          <ClientOnly placeholder="Carregando...">
            <USelectMenu 
              v-model="importType" 
              :options="importOptions" 
              placeholder="Selecione o tipo" 
              value-attribute="value"
              option-attribute="label"
            />
          </ClientOnly>
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
      <UModal v-model="showPreview" size="full">
        <div ref="resizeWrapper" :style="wrapperStyle" class="p-4">
          <UCard :class="['h-full relative', isFullscreen ? 'overflow-auto' : 'overflow-hidden']" style="width:100%; height:100%; min-width:600px;">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold">Preview da Importação</h3>
                <div class="flex items-center gap-2">
                  <UBadge :label="`${previewData.length} registos`" color="primary" />
                  <UButton size="sm" variant="outline" :icon="isFullscreen ? 'i-heroicons-arrows-pointing-in' : 'i-heroicons-arrows-pointing-out'" @click="toggleFullscreen">
                    {{ isFullscreen ? 'Fechar' : 'Expandir' }}
                  </UButton>
                  <UButton size="sm" variant="ghost" icon="i-heroicons-x-mark" title="Fechar preview" @click="closePreview" />
                </div>
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

                <template #franquia-data="{ row }">
                  <div class="flex items-center gap-2">
                    <UIcon v-if="row.vinculado?.loja" name="i-heroicons-check-circle" class="text-green-500" />
                    <UIcon v-else name="i-heroicons-x-circle" class="text-red-500" />
                    <div class="flex-1">
                      <USelectMenu
                        v-model="row.selectedLojaId"
                        :options="(row.possibleLojas || []).map(l => ({ label: l.name, value: l.id }))"
                        placeholder="Selecionar loja"
                        value-attribute="value"
                        option-attribute="label"
                      />
                    </div>
                  </div>
                </template>

                <template #adesao-data="{ row }">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium">{{ row.adesao }}</span>
                    <span v-if="row.existingQuantidade" class="text-xs text-gray-500">(já registado: {{ row.existingQuantidade }})</span>
                  </div>
                </template>

                <template #registered-data="{ row }">
                  <div class="text-sm text-gray-600">
                    <span v-if="row.existing">Registrado</span>
                    <span v-else>—</span>
                  </div>
                </template>

                <template #consultor-data="{ row }">
                  <div class="flex items-center gap-2">
                    <UIcon v-if="row.vinculado?.consultor" name="i-heroicons-check-circle" class="text-green-500" />
                    <UIcon v-else name="i-heroicons-x-circle" class="text-red-500" />
                    <div class="flex-1">
                      <USelectMenu
                        v-model="row.selectedConsultor"
                        :options="buildPersonOptions(row.possibleConsultores, row.consultorRaw, row.selectedConsultor)"
                        placeholder="Selecionar consultor"
                        value-attribute="value"
                        option-attribute="label"
                      />
                    </div>
                  </div>
                </template>

                <template #supervisor-data="{ row }">
                  <div class="flex items-center gap-2">
                    <UIcon v-if="row.vinculado?.supervisor" name="i-heroicons-check-circle" class="text-green-500" />
                    <UIcon v-else name="i-heroicons-x-circle" class="text-red-500" />
                    <div class="flex-1">
                      <USelectMenu
                        v-model="row.selectedSupervisor"
                        :options="buildPersonOptions(row.possibleSupervisores, row.supervisorRaw, row.selectedSupervisor)"
                        placeholder="Selecionar supervisor"
                        value-attribute="value"
                        option-attribute="label"
                      />
                    </div>
                  </div>
                </template>

                <template #coordenador-data="{ row }">
                  <div class="flex items-center gap-2">
                    <UIcon v-if="row.vinculado?.coordenador" name="i-heroicons-check-circle" class="text-green-500" />
                    <UIcon v-else name="i-heroicons-x-circle" class="text-red-500" />
                    <div class="flex-1">
                      <USelectMenu
                        v-model="row.selectedCoordenador"
                        :options="buildPersonOptions(row.possibleCoordenadores, row.coordenadorRaw, row.selectedCoordenador)"
                        placeholder="Selecionar coordenador"
                        value-attribute="value"
                        option-attribute="label"
                      />
                    </div>
                  </div>
                </template>

                <template #dataContrato-data="{ row }">
                  <UInput type="date" v-model="row.dataContrato" />
                </template>

                <template #quantidade-data="{ row }">
                  <UInput type="number" v-model.number="row.quantidade" class="w-32" />
                </template>

                <template #acoes-data="{ row }">
                  <div class="flex gap-2 items-center">
                    <UButton size="sm" color="primary" @click="saveSingleRow(row)" :loading="row.saving">Gravar</UButton>
                    <span v-if="row.saved" class="text-sm text-green-600">Salvo</span>
                  </div>
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
        </div>
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
// fullscreen modal state (uses same approach as metas preview)
const resizeWrapper = ref(null)
const isFullscreen = ref(false)
const modalWidth = ref('1200px')
const modalHeight = ref('70vh')

const wrapperStyle = computed(() => {
  if (isFullscreen.value) {
    return { width: '100vw', height: '100vh', position: 'fixed', left: '0', top: '0', transform: 'none', zIndex: 9999 }
  }
  return { width: modalWidth.value, height: modalHeight.value, position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999 }
})

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  try { document.body.style.overflow = isFullscreen.value ? 'hidden' : '' } catch (e) {}
}

const closePreview = () => {
  // if in fullscreen, exit first to restore body scroll
  if (isFullscreen.value) toggleFullscreen()
  showPreview.value = false
}
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

// helper to build select options showing name first (server returns {id,name} candidates)
const buildPersonOptions = (persons, rawLabel, selectedId) => {
  const opts = (persons || []).map(p => ({ label: p.name || p.nome || p.email || p.id, value: p.id }))
  // ensure selectedId is present so select shows label instead of raw id
  if (selectedId && !opts.find(o => String(o.value) === String(selectedId))) {
    opts.unshift({ label: rawLabel || String(selectedId), value: selectedId })
  }
  return opts
}

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

    // Map header keys to canonical keys so server recognizes qty/date/adesao regardless of header wording
    const mapHeader = (k) => {
      const key = String(k || '').toLowerCase()
      if (/franquia/.test(key)) return 'franquia'
      if (/consultor/.test(key)) return 'consultor'
      if (/supervisor/.test(key)) return 'supervisor'
      if (/coordenador/.test(key)) return 'coordenador'
      if (/adesa|adesao|adesã/.test(key)) return 'adesao'
      if (/data.*contr|datacontrato|contrato/.test(key)) return 'datacontrato'
      // quantity columns: look for qtd, quant, seguro, vida, familiar, bmg
      if (/(qtd|quant).*bmg|bmg/.test(key)) return 'qtdsegurosbmgmed'
      if (/(qtd|quant).*(segur|vida|familiar)|seguro.*vida|seguro.*familiar/.test(key)) return 'qtdsegurofamiliar'
      if (/qtd|quant/.test(key) && /bmg/.test(key)) return 'qtdsegurosbmgmed'
      if (/qtd|quant/.test(key) && /(segur|vida|familiar)/.test(key)) return 'qtdsegurofamiliar'
      // fallback: return original normalized key
      return key
    }

    const mappedRows = jsonData.map(r => {
      const out = {}
      for (const rawKey of Object.keys(r || {})) {
        const target = mapHeader(rawKey)
        out[target] = r[rawKey]
      }
      return out
    })

    // Preview step: call server preview endpoint and show modal for confirmation
    const sessionToken = (await supabase.auth.getSession())?.data?.session?.access_token || null
    const headers = sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}
    const previewRes = await $fetch('/api/seguros/import-preview', { method: 'POST', headers, body: { tipo: importType.value, rows: mappedRows } })
    if (!previewRes || previewRes.success === false) {
      toast.add({ title: 'Erro', description: previewRes?.error || 'Falha ao gerar preview', color: 'red' })
      readingFile.value = false
      return
    }

    const { previewRows, errors } = previewRes.data || {}
    validationErrors.value = (errors || []).map(e => `Linha ${e.row}: ${ (e.reasons || []).join('; ') }`)

    // Build editable preview state: include selected IDs and editable fields
    previewData.value = (previewRows || []).map(r => ({
      rowNumber: r.rowNumber,
      franquia: r.franquia,
      lojaId: r.lojaId,
      lojaName: r.lojaName,
      consultorRaw: r.consultorRaw,
      supervisorRaw: r.supervisorRaw,
      coordenadorRaw: r.coordenadorRaw,
      consultorId: r.consultorId,
      supervisorId: r.supervisorId,
      coordenadorId: r.coordenadorId,
      possibleConsultores: r.possibleConsultores || [],
      possibleSupervisores: r.possibleSupervisores || [],
      possibleCoordenadores: r.possibleCoordenadores || [],
      adesao: r.adesao,
      // normalize date to yyyy-mm-dd for input[type=date]
      dataContrato: r.dataContrato ? (new Date(r.dataContrato).toISOString().slice(0,10)) : null,
      quantidade: r.quantidade,
      existing: r.existing || null,
      existingQuantidade: r.existing?.quantidade || null,
      vinculado: r.vinculado,
      // ui state
      selectedConsultor: r.consultorId || (r.possibleConsultores && r.possibleConsultores[0]?.id) || null,
      selectedSupervisor: r.supervisorId || (r.possibleSupervisores && r.possibleSupervisores[0]?.id) || null,
      selectedCoordenador: r.coordenadorId || (r.possibleCoordenadores && r.possibleCoordenadores[0]?.id) || null,
      selectedLojaId: r.lojaId || null,
      possibleLojas: r.lojaName ? [{ id: r.lojaId, name: r.lojaName }] : []
    }))

    // prepare parsedData for import (will be refreshed on user edits)
    parsedData.value = previewData.value.map(r => ({
      consultor_id: r.selectedConsultor,
      supervisor_id: r.selectedSupervisor,
      coordenador_id: r.selectedCoordenador,
      loja_id: r.selectedLojaId,
      tipo_produto: importType.value,
      data_venda: r.dataContrato,
      quantidade: Number(r.quantidade || 0),
      adesao: r.adesao
    }))

    importSummary.total = parsedData.value.length
    if ((errors || []).length === 0 && parsedData.value.length > 0) showPreview.value = true

  } catch (error) {
    toast.add({ title: 'Erro ao ler arquivo', description: error.message, color: 'red' });
    resetForm();
  } finally {
    readingFile.value = false;
    const inputElement = document.querySelector('input[type="file"]');
    if (inputElement) inputElement.value = '';
  }
};

const saveSingleRow = async (row) => {
  row.saving = true
  try {
    const sessionToken = (await supabase.auth.getSession())?.data?.session?.access_token || null
    const headers = sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}

    const payload = [{
      consultor_id: row.selectedConsultor,
      supervisor_id: row.selectedSupervisor,
      coordenador_id: row.selectedCoordenador,
      loja_id: row.selectedLojaId,
      tipo_produto: importType.value,
      data_venda: row.dataContrato,
      quantidade: Number(row.quantidade || 0),
      adesao: row.adesao
    }]

    const res = await $fetch('/api/seguros/import', { method: 'POST', headers, body: { rows: payload } })
    if (!res || res.success === false) throw new Error(res?.error || 'Falha ao gravar linha')

    row.saved = true
    toast.add({ title: 'Linha gravada', description: `Linha ${row.rowNumber} gravada com sucesso`, color: 'green' })
  } catch (err) {
    console.error('Erro ao gravar linha:', err)
    toast.add({ title: 'Erro', description: err.message || String(err), color: 'red' })
  } finally {
    row.saving = false
  }
}

const confirmImport = async () => {
  importing.value = true;
  try {
    const sessionToken = (await supabase.auth.getSession())?.data?.session?.access_token || null
    const headers = sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}

    // Build payload from current previewData (take user's selections/edits)
    const payload = previewData.value.map(r => ({
      consultor_id: r.selectedConsultor,
      supervisor_id: r.selectedSupervisor,
      coordenador_id: r.selectedCoordenador,
      loja_id: r.selectedLojaId,
      tipo_produto: importType.value,
      data_venda: r.dataContrato,
      quantidade: Number(r.quantidade || 0),
      adesao: r.adesao
    }))

    const res = await $fetch('/api/seguros/import', { method: 'POST', headers, body: { rows: payload } })
    if (!res || res.success === false) throw new Error(res?.error || 'Falha ao importar')

    toast.add({ title: 'Sucesso!', description: `${payload.length} registos foram importados/atualizados.`, color: 'green' })
    resetForm()
  } catch (error) {
    console.error('Erro na importação:', error);
    toast.add({ title: 'Erro na Importação', description: error.message || String(error), color: 'red' });
  } finally {
    importing.value = false;
  }
}

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
  { key: 'quantidade', label: 'Qtd' },
  { key: 'adesao', label: 'Adesão' },
  { key: 'registered', label: 'Registrado' },
  { key: 'acoes', label: 'Ações' }
];
</script>