<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const planos = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const columns = [
  { key: 'nome', label: 'Nome' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'ativo', label: 'Ativo' },
  { key: 'acoes', label: 'Ações' }
]

async function fetch() {
  loading.value = true
  try {
    const res: any = await $fetch('/api/plano-contas')
    if (res && res.success) planos.value = res.data || []
    else error.value = res?.error || 'Erro ao carregar'
  } catch (err: any) { error.value = err?.message || String(err) }
  finally { loading.value = false }
}

onMounted(fetch)

function edit(id: number) { router.push(`/financeiro/plano-contas/${id}/edit`) }

function novoPlano() {
  router.push('/financeiro/plano-contas/create')
}

async function remove(id: number) {
  if (!confirm('Deseja desativar esta conta?')) return
  try {
    const res: any = await $fetch(`/api/plano-contas/${id}`, { method: 'DELETE' })
    if (res && res.success) fetch()
    else alert(res?.error || 'Erro ao remover')
  } catch (err: any) { alert(err?.message || String(err)) }
}
</script>

<template>
  <div>
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Plano de Contas</h3>
          <div>
            <UButton color="primary" @click="novoPlano">Novo Plano</UButton>
          </div>
        </div>
      </template>

      <div class="p-2">
        <div v-if="error" class="text-red-500">{{ error }}</div>

        <UTable :rows="planos" :columns="columns" :loading="loading" :empty-state="{ label: 'Nenhum plano encontrado.' }">
          <template #nome-data="{ row }">
            <div class="text-sm text-gray-800 dark:text-gray-100">{{ row.nome }}</div>
          </template>
          <template #tipo-data="{ row }">
            <div class="text-sm text-gray-800 dark:text-gray-100">{{ row.tipo }}</div>
          </template>
          <template #ativo-data="{ row }">
            <div>
              <UBadge :label="row.ativo ? 'Sim' : 'Não'" :color="row.ativo ? 'green' : 'gray'" />
            </div>
          </template>
          <template #acoes-data="{ row }">
            <div class="flex items-center gap-2">
              <UButton size="sm" color="gray" variant="ghost" @click="edit(row.id)">Editar</UButton>
              <UButton size="sm" color="red" variant="ghost" @click="remove(row.id)">Desativar</UButton>
            </div>
          </template>
        </UTable>
      </div>
    </UCard>
  </div>
</template>
