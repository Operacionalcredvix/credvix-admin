<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const form = ref({ nome: '', descricao: '', tipo: 'despesa', ativo: true })
const loading = ref(false)
const error = ref<string | null>(null)

async function submit() {
  error.value = null
  loading.value = true
  try {
    const res: any = await $fetch('/api/plano-contas', { method: 'POST', body: form.value })
    if (res && res.success) router.push('/financeiro/plano-contas')
    else error.value = res?.error || 'Erro ao criar'
  } catch (err: any) { error.value = err?.message || String(err) }
  finally { loading.value = false }
}
</script>

<template>
  <div>
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Novo Plano de Contas</h3>
        </div>
      </template>

      <div class="p-4">
        <div v-if="error" class="text-red-500 mb-2">{{ error }}</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm text-gray-600">Nome</label>
            <UInput v-model="form.nome" />
          </div>
          <div>
            <label class="block text-sm text-gray-600">Tipo</label>
            <USelect v-model="form.tipo" :options="[{ label: 'Despesa', value: 'despesa' }, { label: 'Receita', value: 'receita' }]" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm text-gray-600">Descrição</label>
            <UInput v-model="form.descricao" />
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-4">
          <UButton color="gray" variant="ghost" @click="router.push('/financeiro/plano-contas')">Voltar</UButton>
          <UButton :loading="loading" color="primary" @click="submit">Salvar</UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>
