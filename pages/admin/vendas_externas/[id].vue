<template>
  <div>
    <header class="mb-6">
      <h1 class="text-2xl font-bold text-primary-500">Detalhe - Venda Externa</h1>
    </header>

    <div v-if="pending" class="text-center py-10">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-gray-500" />
      <p class="text-gray-500 mt-2">A carregar...</p>
    </div>

    <div v-else-if="!venda">
      <UAlert color="red" variant="soft">Registo não encontrado.</UAlert>
    </div>

    <UCard v-else>
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-semibold text-lg">Adesão: {{ venda.adesao }}</h2>
            <p class="text-sm text-gray-500">ID: {{ venda.id }}</p>
          </div>
          <div class="text-right">
            <UBadge :label="venda.tipo_produto" color="primary" />
          </div>
        </div>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p class="text-xs text-gray-500">Data Venda</p>
          <p class="font-medium">{{ venda.data_venda }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Quantidade</p>
          <p class="font-medium">{{ venda.quantidade }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Consultor</p>
          <p class="font-medium">{{ consultor?.nome || venda.consultor_id || 'N/A' }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Loja</p>
          <p class="font-medium">{{ loja?.nome || venda.loja_id || 'N/A' }}</p>
        </div>
      </div>

      <div class="mt-4 text-right">
        <UButton variant="ghost" @click="$router.back()">Voltar</UButton>
      </div>
    </UCard>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const id = route.params.id

definePageMeta({ middleware: 'auth', profiles: ['Backoffice', 'Master'] })

const supabase = useSupabaseClient()

const { data: venda, pending } = await useAsyncData(`venda-${id}`, async () => {
  const { data, error } = await supabase.from('vendas_externas').select('*').eq('id', id).single()
  if (error) return null
  return data
})

const { data: consultor } = await useAsyncData(`venda-consultor-${id}`, async () => {
  if (!venda.value?.consultor_id) return null
  const { data } = await supabase.from('funcionarios').select('id, nome').eq('id', venda.value.consultor_id).single()
  return data || null
}, { watch: [venda] })

const { data: loja } = await useAsyncData(`venda-loja-${id}`, async () => {
  if (!venda.value?.loja_id) return null
  const { data } = await supabase.from('lojas').select('id, nome').eq('id', venda.value.loja_id).single()
  return data || null
}, { watch: [venda] })
</script>
