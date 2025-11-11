<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const id = Number(route.params.id)
const form = ref<any>({})
const error = ref<string | null>(null)

async function fetchItem() {
  try {
    const res: any = await $fetch(`/api/fornecedores/${id}`)
    if (res && res.success) {
      form.value = { ...res.data }
    } else {
      error.value = res?.error || 'Erro ao carregar'
    }
  } catch (err: any) { error.value = err?.message || String(err) }
}

onMounted(fetchItem)

async function submit() {
  try {
    const res: any = await $fetch(`/api/fornecedores/${id}`, { method: 'PUT', body: form.value })
    if (res && res.success) router.push('/financeiro/fornecedores')
    else error.value = res?.error || 'Erro ao salvar'
  } catch (err: any) { error.value = err?.message || String(err) }
}
</script>

<template>
  <div class="max-w-3xl mx-auto p-4">
    <header class="mb-4">
      <h2 class="text-2xl font-semibold">Editar Fornecedor</h2>
    </header>

    <UCard>
      <div v-if="error" class="text-red-600 mb-2">{{ error }}</div>

      <div v-if="!error" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-gray-600">Nome / Razão Social</label>
          <UInput v-model="form.nome_razao" placeholder="Nome ou razão social" />
        </div>
        <div>
          <label class="block text-sm text-gray-600">CNPJ / CPF</label>
          <UInput v-model="form.documento" placeholder="CNPJ ou CPF" />
        </div>
        <div>
          <label class="block text-sm text-gray-600">E-mail</label>
          <UInput v-model="form.email" placeholder="email@exemplo.com" />
        </div>
        <div>
          <label class="block text-sm text-gray-600">Telefone 1</label>
          <UInput v-model="form.telefone1" placeholder="(00) 91234-5678" />
        </div>
        <div>
          <label class="block text-sm text-gray-600">Telefone 2</label>
          <UInput v-model="form.telefone2" placeholder="(00) 92345-6789" />
        </div>
        <div>
          <label class="block text-sm text-gray-600">Ativo</label>
          <div class="pt-2"><USwitch v-model="form.ativo" /></div>
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm text-gray-600">Observações</label>
          <UInput v-model="form.dados_contato" placeholder="Observações" />
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-4">
        <UButton color="gray" variant="ghost" @click="router.push('/financeiro/fornecedores')">Cancelar</UButton>
        <UButton color="primary" @click="submit">Salvar</UButton>
      </div>
    </UCard>
  </div>
</template>
