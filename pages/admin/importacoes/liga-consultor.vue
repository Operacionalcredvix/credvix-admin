<template>
  <div>
    <header class="mb-6">
      <h1 class="text-2xl font-bold text-primary-600">Importação — Liga Consultor</h1>
      <p class="text-sm text-gray-500">Upload do arquivo de ligações para consultores.</p>
    </header>

    <div class="space-y-4">
      <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" class="hidden" @change="onFile" />
      <div class="flex items-center gap-3">
        <UButton @click="trigger" icon="i-heroicons-arrow-up-tray">Selecionar arquivo</UButton>
        <span v-if="fileName" class="text-sm text-gray-600">{{ fileName }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const fileInput = ref(null)
const fileName = ref('')
const trigger = () => fileInput.value?.click()
const toast = useToast()

const onFile = (e) => {
  const f = e.target.files && e.target.files[0]
  if (!f) return
  fileName.value = f.name
  toast.add({ title: 'Arquivo selecionado', description: f.name, color: 'green' })
}

definePageMeta({ middleware: 'auth' })
</script>
