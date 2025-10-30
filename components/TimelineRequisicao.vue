<template>
  <div class="space-y-4">
    <div v-if="!items || items.length === 0" class="text-sm text-gray-500">
      Nenhum evento registrado ainda.
    </div>

    <div v-for="h in items" :key="h.id" class="flex items-start gap-3">
      <UIcon :name="getStatusIcon(h.status_novo)" class="w-5 h-5 mt-0.5 text-gray-400" />
      <div class="flex-1">
        <div class="text-sm">
          <span class="font-medium">{{ h.status_novo }}</span>
          <span v-if="h.status_anterior" class="text-gray-500"> (de {{ h.status_anterior }})</span>
        </div>
        <div v-if="h.comentario" class="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {{ h.comentario }}
        </div>
        <div class="text-xs text-gray-400 mt-1">
          {{ formatarData(h.created_at) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const props = defineProps({
  items: { type: Array, default: () => [] }
})

function getStatusIcon(status) {
  switch (status) {
    case 'Nova': return 'i-heroicons-sparkles'
    case 'Em Análise': return 'i-heroicons-eye'
    case 'Aceita': return 'i-heroicons-check-circle'
    case 'Necessita Informação': return 'i-heroicons-question-mark-circle'
    case 'Devolvida': return 'i-heroicons-arrow-uturn-left'
    case 'Concluída': return 'i-heroicons-check'
    case 'Cancelada': return 'i-heroicons-x-mark'
    default: return 'i-heroicons-information-circle'
  }
}

function formatarData(data) {
  if (!data) return '-'
  return format(new Date(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}
</script>
