<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()
const id = Number(route.params.id)
const form = ref<any>({})
const loading = ref(false)
const error = ref<string | null>(null)

async function fetchItem() {
  loading.value = true
  try {
    const res: any = await $fetch('/api/plano-contas')
    if (res && res.success) {
      const found = (res.data || []).find((x: any) => x.id === id)
      if (found) form.value = { ...found }
      else error.value = 'Conta não encontrada'
    } else error.value = res?.error || 'Erro ao carregar'
  } catch (err: any) { error.value = err?.message || String(err) }
  finally { loading.value = false }
}

onMounted(fetchItem)

async function submit() {
  loading.value = true
  try {
    const res: any = await $fetch(`/api/plano-contas/${id}`, { method: 'PUT', body: form.value })
    if (res && res.success) router.push('/financeiro/plano-contas')
    else error.value = res?.error || 'Erro ao salvar'
  } catch (err: any) { error.value = err?.message || String(err) }
  finally { loading.value = false }
}

function goBack() {
  router.push('/financeiro/plano-contas')
}
</script>

<template>
  <div>
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Editar Plano de Conta</h3>
        </div>
      </template>

      <div class="p-4">
        <div v-if="error" class="text-red-500 mb-2">{{ error }}</div>
        <div v-if="!error">
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
            <UButton color="gray" variant="ghost" @click="goBack">Voltar</UButton>
            <UButton :loading="loading" color="primary" @click="submit">Salvar</UButton>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
