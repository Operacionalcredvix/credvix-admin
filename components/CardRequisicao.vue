<template>
  <UCard :ui="{ body: 'p-4' }" class="cursor-pointer hover:ring-1 hover:ring-primary-200" @click="$emit('click')">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <span class="font-mono text-sm text-primary-600 dark:text-primary-400">{{ req.numero_requisicao }}</span>
          <RequisicaoStatusBadge :status="req.status" size="xs" />
          <RequisicaoPrioridadeBadge :prioridade="req.prioridade_final || req.prioridade_sugerida" size="xs" />
        </div>
        <div class="mt-1 font-medium truncate">{{ req.titulo }}</div>
        <div class="mt-1 text-xs text-gray-500 truncate">{{ req.loja_nome }} • {{ req.solicitante_nome }}</div>
      </div>
      <div class="flex flex-col items-end gap-1">
        <div class="flex items-center gap-1 text-sm">
          <UIcon :name="getSetorIcon(req.setor_destino)" class="w-4 h-4" />
          <span>{{ req.setor_destino }}</span>
        </div>
        <div class="text-xs" :class="req.em_atraso ? 'text-red-600 font-semibold' : 'text-gray-500'">
          <span v-if="req.status === 'Aceita' && req.prazo_final">SLA: {{ formatarPrazo(req.prazo_final) }}</span>
          <span v-else>-</span>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup>
import { SETOR_ICONS } from '~/types/requisicoes'

const props = defineProps({
  req: { type: Object, required: true }
})

function getSetorIcon(setor) {
  return SETOR_ICONS[setor] || 'i-heroicons-building-office'
}

function formatarPrazo(data) {
  if (!data) return '-'
  const d = new Date(data)
  return d.toLocaleString('pt-BR')
}
</script>
