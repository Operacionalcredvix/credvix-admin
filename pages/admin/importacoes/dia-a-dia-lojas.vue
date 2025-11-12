<template>
  <div>
    <header class="mb-6 flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-bold text-primary-600">Importação — Dia a Dia Lojas BI</h1>
        <p class="text-sm text-gray-500">Faça upload do arquivo exportado pelo BI do Banco BMG para importar o Dia a Dia das lojas.</p>
      </div>
      <div class="ml-4">
        <UPopover :popper="{ placement: 'bottom-end' }" mode="click">
          <template #default>
            <button class="text-gray-500 hover:text-gray-700 flex items-center gap-2 px-2 py-1 rounded" aria-label="Informações sobre origem do arquivo">
              <UIcon name="i-heroicons-information-circle" class="w-5 h-5" />
              <span class="text-sm hidden sm:inline">Origem do arquivo</span>
            </button>
          </template>

          <template #panel="{ close }">
            <div class="max-w-xs p-3 bg-white dark:bg-gray-800 rounded shadow-md text-gray-800 dark:text-gray-200 text-sm">
              <div class="font-semibold">Importação via BI — Banco BMG</div>
              <p class="text-xs text-gray-500 mt-1">Este upload espera um ficheiro exportado a partir do painel BI do Banco BMG. Antes de importar, confirme que o ficheiro segue o layout padrão utilizado pelo BI (colunas para franquia/loja, consultor, data, quantidade, etc.).</p>
              <div class="mt-3 flex justify-end">
                <UButton size="xs" color="gray" variant="ghost" @click="close">Fechar</UButton>
              </div>
            </div>
          </template>
        </UPopover>
      </div>
    </header>

    <div class="space-y-4">
      <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" class="hidden" @change="onFile" />
      <div class="flex items-center gap-3">
        <UButton @click="trigger" icon="i-heroicons-arrow-up-tray">Selecionar arquivo</UButton>
        <span v-if="fileName" class="text-sm text-gray-600">{{ fileName }}</span>
      </div>
    </div>

    <UModal v-model="isPreviewOpen" size="lg">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h2 class="text-lg font-bold">Pré-visualização — Dia a Dia Lojas</h2>
        </div>
      </template>

      <div class="p-4">
        <div v-if="previewErrors.length" class="mb-4 p-2 bg-amber-50 rounded">
          <p class="font-medium text-sm">Erros encontrados no ficheiro:</p>
          <ul class="text-xs list-disc pl-5">
            <li v-for="err in previewErrors" :key="err.row">Linha {{ err.row }}: {{ (err.reasons || err.reasons || []).join(', ') }}</li>
          </ul>
        </div>

        <div class="mb-4">
          <p class="text-sm text-gray-600">Linhas para importar: {{ previewRows.length }}</p>
        </div>

        <div style="max-height: 50vh; overflow:auto;">
          <table class="w-full text-sm table-auto">
            <thead>
              <tr class="text-left text-xs text-gray-500">
                <th class="p-2">#</th>
                <th class="p-2">Loja</th>
                <th class="p-2">Consultor</th>
                <th class="p-2">Erros</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in previewRows" :key="r.rowNumber" class="border-t">
                <td class="p-2">{{ r.rowNumber }}</td>
                <td class="p-2">{{ r.lojaName || r.franquia || '—' }}</td>
                <td class="p-2">{{ r.consultorRaw || '—' }}</td>
                <td class="p-2 text-xs text-red-600">{{ (r.errors || []).join('; ') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-4">
          <UButton color="gray" variant="ghost" @click="isPreviewOpen = false">Fechar</UButton>
          <UButton color="primary" :loading="saving" @click="confirmImport">Confirmar e Importar</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSupabaseClient } from '#imports'
const supabase = useSupabaseClient()
const fileInput = ref(null)
const fileName = ref('')
const trigger = () => fileInput.value?.click()
const toast = useToast()

const isPreviewOpen = ref(false)
const previewRows = ref([])
const previewErrors = ref([])
const saving = ref(false)

const onFile = async (e) => {
  const f = e.target.files && e.target.files[0]
  if (!f) return
  fileName.value = f.name
  // parse xlsx
  let XLSX
  try {
    XLSX = (await import('xlsx')).default || (await import('xlsx'))
  } catch (err) {
    toast.add({ title: 'Erro', description: 'Biblioteca xlsx não encontrada. Execute `npm install xlsx` e reinicie o dev.', color: 'red' })
    return
  }

  try {
    const arrayBuffer = await f.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const json = XLSX.utils.sheet_to_json(sheet, { defval: '' })
    if (!Array.isArray(json) || json.length === 0) {
      toast.add({ title: 'Aviso', description: 'Arquivo vazio ou formato inválido.', color: 'orange' })
      return
    }

    // normalize keys to lower-case no-spacing keys
    const rows = json.map((r) => {
      const normalized = {}
      for (const k of Object.keys(r)) {
        const key = String(k).trim()
        const low = key.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()
        normalized[low] = r[k]
      }
      return normalized
    })

    const session = await supabase.auth.getSession()
    const token = session?.data?.session?.access_token || null
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    const res = await $fetch('/api/importacoes/dia-a-dia-lojas/import-preview', { method: 'POST', headers, body: { rows } })
    if (!res || res.success === false) {
      toast.add({ title: 'Erro', description: res?.error || 'Falha ao gerar preview', color: 'red' })
      return
    }

    previewRows.value = res.data?.previewRows || []
    previewErrors.value = res.data?.errors || []
    isPreviewOpen.value = true
  } catch (err) {
    console.error('Erro ao importar arquivo:', err)
    toast.add({ title: 'Erro', description: err?.message || String(err), color: 'red' })
  } finally {
    try { e.target.value = null } catch (e) {}
  }
}

definePageMeta({ middleware: 'auth' })

const confirmImport = async () => {
  if (!previewRows.value || previewRows.value.length === 0) {
    toast.add({ title: 'Erro', description: 'Nenhuma linha para importar', color: 'red' })
    return
  }
  saving.value = true
  try {
    const session = await supabase.auth.getSession()
    const token = session?.data?.session?.access_token || null
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    // For import we will send the raw normalized rows (caller may adapt server-side)
    const rowsToSend = previewRows.value.map((r) => r.raw || r)

    const res = await $fetch('/api/importacoes/dia-a-dia-lojas/import', { method: 'POST', headers, body: { rows: rowsToSend } })
    if (!res || res.success === false) {
      toast.add({ title: 'Erro', description: res?.error || 'Falha ao importar Dia a Dia', color: 'red' })
      return
    }

    const inserted = res.data?.insertedOrUpdated?.length || 0
    toast.add({ title: 'Importação concluída', description: `${inserted} registos importados/atualizados.`, color: 'green' })
    isPreviewOpen.value = false
    fileName.value = ''
  } catch (err) {
    console.error('Erro ao confirmar import:', err)
    toast.add({ title: 'Erro', description: err?.message || String(err), color: 'red' })
  } finally {
    saving.value = false
  }
}
</script>
