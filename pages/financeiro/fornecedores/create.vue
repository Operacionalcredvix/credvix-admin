<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

declare const useToast: any
const router = useRouter()
const toast = useToast()

const saving = ref(false)
const form = reactive({ nome_razao: '', documento: '', email: '', telefone1: '', telefone2: '', dados_contato: '', ativo: true })
const formError = ref<string | null>(null)

const validate = () => {
  formError.value = null
  if (!form.nome_razao || !String(form.nome_razao).trim()) {
    formError.value = 'Nome / Razão Social é obrigatório.'
    return false
  }
  return true
}

const submit = async () => {
  if (!validate()) return
  saving.value = true
  try {
    const payload = { ...form }
    const res = await $fetch('/api/fornecedores', { method: 'POST', body: payload })
    const ok = (res as any)?.success === true
    if (!ok) {
      formError.value = (res as any)?.error || 'Falha ao criar fornecedor.'
      toast.add({ title: 'Erro', description: formError.value, color: 'red' })
      return
    }
    toast.add({ title: 'Sucesso', description: 'Fornecedor criado.' })
    // redirect to index
    await router.push('/financeiro/fornecedores')
  } catch (err: any) {
    formError.value = err?.message || String(err)
    toast.add({ title: 'Erro', description: formError.value, color: 'red' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto p-4">
    <header class="mb-4">
      <h1 class="text-2xl font-bold">Novo Fornecedor</h1>
      <p class="text-sm text-gray-500">Cadastre um novo fornecedor para usar em contas a pagar.</p>
    </header>

    <UCard>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <label class="block text-sm text-gray-600"> Observações</label>
          <UInput v-model="form.dados_contato" placeholder="Observações" />
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-4">
        <UButton color="gray" variant="ghost" @click="router.push('/financeiro/fornecedores')">Cancelar</UButton>
        <UButton :loading="saving" color="primary" @click="submit">Salvar Fornecedor</UButton>
      </div>

      <p v-if="formError" class="text-red-500 text-sm mt-3">{{ formError }}</p>
    </UCard>
  </div>
</template>
