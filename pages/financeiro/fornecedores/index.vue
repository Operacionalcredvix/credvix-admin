<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

declare const useToast: any
const toast = useToast()

const router = useRouter()
const fornecedores = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const deletingIds = ref<Record<number, boolean>>({})

async function fetchList() {
  loading.value = true
  try {
    const res: any = await $fetch('/api/fornecedores')
    if (res?.success) fornecedores.value = res.data || []
    else error.value = res?.error || 'Erro ao carregar'
  } catch (err: any) { error.value = err?.message || String(err) }
  finally { loading.value = false }
}

onMounted(fetchList)

function edit(id: number) {
  router.push(`/financeiro/fornecedores/${id}/edit`)
}

function novoFornecedor() {
  router.push('/financeiro/fornecedores/create')
}

async function removeItem(id: number) {
  if (!confirm('Deseja desativar este fornecedor?')) return
  try {
    deletingIds.value[id] = true
    const res: any = await $fetch(`/api/fornecedores/${id}`, { method: 'DELETE' })
    if (res?.success) {
      toast.add({ title: 'Sucesso', description: 'Fornecedor desativado.' })
      await fetchList()
    } else {
      toast.add({ title: 'Erro', description: res?.error || 'Erro ao remover', color: 'red' })
    }
  } catch (err: any) {
    toast.add({ title: 'Erro', description: err?.message || String(err), color: 'red' })
  } finally {
    deletingIds.value[id] = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto p-4">
    <header class="mb-4 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-semibold">Fornecedores</h2>
        <p class="text-sm text-gray-500">Gerencie os fornecedores utilizados nas contas a pagar.</p>
      </div>
      <div>
        <UButton color="primary" @click="novoFornecedor">Novo fornecedor</UButton>
      </div>
    </header>

    <UCard>
      <div v-if="error" class="text-red-600 mb-2">{{ error }}</div>

      <table class="w-full text-sm" style="border-collapse:collapse">
        <thead>
          <tr class="text-left border-b"><th style="padding:8px">ID</th><th style="padding:8px">Nome / Razão</th><th style="padding:8px">Documento</th><th style="padding:8px">Ativo</th><th style="padding:8px">Ações</th></tr>
        </thead>
        <tbody>
          <tr v-for="f in fornecedores" :key="f.id" class="border-b">
            <td style="padding:8px">{{ f.id }}</td>
            <td style="padding:8px">{{ f.nome_razao }}</td>
            <td style="padding:8px">{{ f.documento }}</td>
            <td style="padding:8px">{{ f.ativo ? 'Sim' : 'Não' }}</td>
            <td style="padding:8px">
              <UButton color="gray" variant="ghost" @click="edit(f.id)">Editar</UButton>
              <UButton :loading="deletingIds[f.id]" :disabled="deletingIds[f.id]" color="red" variant="ghost" @click="removeItem(f.id)">Desativar</UButton>
            </td>
          </tr>
          <tr v-if="fornecedores.length === 0">
            <td colspan="5" class="text-center py-6 text-gray-500">Nenhum fornecedor encontrado.</td>
          </tr>
        </tbody>
      </table>
    </UCard>
  </div>
</template>
