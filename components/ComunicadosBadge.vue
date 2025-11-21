<template>
  <UPopover :popper="{ placement: 'bottom-end' }">
    <UButton
      color="gray"
      variant="ghost"
      class="relative"
      :aria-label="`${totalNaoLidos} comunicados não lidos`"
    >
      <UIcon name="i-heroicons-envelope" class="w-5 h-5" />
      <UBadge
        v-if="totalNaoLidos > 0"
        color="red"
        variant="solid"
        size="xs"
        class="absolute -top-1 -right-1"
      >
        {{ totalNaoLidos }}
      </UBadge>
    </UButton>

    <template #panel>
      <UCard
        :ui="{
          ring: '',
          divide: 'divide-y divide-gray-100 dark:divide-gray-800',
          body: { padding: 'p-0' }
        }"
        class="w-80"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold">Comunicados</h3>
            <UBadge v-if="totalNaoLidos > 0" color="red" variant="subtle">
              {{ totalNaoLidos }} novos
            </UBadge>
          </div>
        </template>

        <div class="divide-y divide-gray-100 dark:divide-gray-800 max-h-96 overflow-y-auto">
          <div v-if="carregando" class="p-6 text-center">
            <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin mx-auto text-gray-400" />
            <p class="text-sm text-gray-500 mt-2">Carregando...</p>
          </div>

          <div v-else-if="comunicadosNaoVistos.length === 0" class="p-6 text-center">
            <UIcon name="i-heroicons-envelope-open" class="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Nenhum comunicado novo
            </p>
          </div>

          <button
            v-for="comunicado in comunicadosNaoVistos.slice(0, 5)"
            :key="comunicado.id"
            class="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors"
            @click="abrirComunicado(comunicado)"
          >
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0">
                <UIcon
                  :name="getCategoriaIcon(comunicado.categoria)"
                  :class="getCategoriaColorClass(comunicado.categoria)"
                  class="w-5 h-5"
                />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ comunicado.titulo }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {{ comunicado.conteudo.substring(0, 80) }}...
                </p>
                <div class="flex items-center gap-2 mt-2">
                  <UBadge :color="getCategoriaColor(comunicado.categoria)" variant="subtle" size="xs">
                    {{ comunicado.categoria }}
                  </UBadge>
                  <span class="text-xs text-gray-500">
                    {{ formatarDataRelativa(comunicado.data_envio) }}
                  </span>
                </div>
              </div>
            </div>
          </button>
        </div>

        <template #footer>
          <NuxtLink
            to="/admin/comunicados/historico"
            class="block text-center py-3 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline"
          >
            Ver todos os comunicados →
          </NuxtLink>
        </template>
      </UCard>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import type { ComunicadoNaoVisualizado } from '~/types/comunicados'

const { comunicadosNaoVistos, carregando, buscarNaoVisualizados } = useComunicados()

const totalNaoLidos = computed(() => comunicadosNaoVistos.value.length)

// Busca comunicados ao montar
onMounted(() => {
  buscarNaoVisualizados()
})

const getCategoriaIcon = (categoria: string) => {
  const icones: Record<string, string> = {
    'Aviso': 'i-heroicons-exclamation-triangle',
    'Informação': 'i-heroicons-information-circle',
    'Notificação': 'i-heroicons-bell',
    'Urgente': 'i-heroicons-exclamation-circle',
    'Atualização': 'i-heroicons-arrow-path'
  }
  return icones[categoria] || 'i-heroicons-envelope'
}

const getCategoriaColor = (categoria: string) => {
  const cores: Record<string, string> = {
    'Aviso': 'yellow',
    'Informação': 'blue',
    'Notificação': 'gray',
    'Urgente': 'red',
    'Atualização': 'green'
  }
  return cores[categoria] || 'gray'
}

const getCategoriaColorClass = (categoria: string) => {
  const classes: Record<string, string> = {
    'Aviso': 'text-yellow-500',
    'Informação': 'text-blue-500',
    'Notificação': 'text-gray-500',
    'Urgente': 'text-red-500',
    'Atualização': 'text-green-500'
  }
  return classes[categoria] || 'text-gray-500'
}

const formatarDataRelativa = (data: string) => {
  const agora = new Date()
  const dataEnvio = new Date(data)
  const diffMs = agora.getTime() - dataEnvio.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHoras = Math.floor(diffMs / 3600000)
  const diffDias = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'agora'
  if (diffMins < 60) return `${diffMins}min atrás`
  if (diffHoras < 24) return `${diffHoras}h atrás`
  if (diffDias < 7) return `${diffDias}d atrás`
  
  return dataEnvio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

const abrirComunicado = (comunicado: ComunicadoNaoVisualizado) => {
  // O modal será aberto automaticamente pelo composable
  window.location.reload() // Força reload para mostrar o modal
}
</script>
