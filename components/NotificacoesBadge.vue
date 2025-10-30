<template>
  <div class="relative">
    <!-- Badge/Botão -->
    <UButton
      icon="i-heroicons-bell"
      color="gray"
      variant="ghost"
      size="lg"
      @click="toggleDropdown"
      :class="{ 'animate-pulse': naoLidas > 0 }"
    >
      <!-- Contador vermelho -->
      <template #trailing v-if="naoLidas > 0">
        <span class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
          {{ naoLidas > 9 ? '9+' : naoLidas }}
        </span>
      </template>
    </UButton>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-96 origin-top-right rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 z-50"
      >
        <!-- Header do dropdown -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
            Notificações
            <span v-if="naoLidas > 0" class="ml-1 text-xs text-gray-500 dark:text-gray-400">
              ({{ naoLidas }} {{ naoLidas === 1 ? 'nova' : 'novas' }})
            </span>
          </h3>
          
          <UButton
            v-if="naoLidas > 0"
            color="primary"
            variant="link"
            size="xs"
            @click="marcarTodasComoLidas"
            :loading="marcandoTodas"
          >
            Marcar todas como lidas
          </UButton>
        </div>

        <!-- Lista de notificações -->
        <div class="max-h-96 overflow-y-auto">
          <div v-if="loading" class="flex items-center justify-center py-8">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-gray-400" />
          </div>

          <div v-else-if="notificacoes.length === 0" class="flex flex-col items-center justify-center py-8 px-4">
            <UIcon name="i-heroicons-bell-slash" class="text-4xl text-gray-300 dark:text-gray-600 mb-2" />
            <p class="text-sm text-gray-500 dark:text-gray-400 text-center">
              Nenhuma notificação no momento
            </p>
          </div>

          <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
            <button
              v-for="notif in notificacoes"
              :key="notif.id"
              @click="handleClick(notif)"
              class="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors relative"
              :class="{ 'bg-blue-50 dark:bg-blue-900/20': !notif.lida }"
            >
              <!-- Indicador de não lida -->
              <span
                v-if="!notif.lida"
                class="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"
              />

              <div class="flex items-start gap-3" :class="{ 'pl-3': !notif.lida }">
                <!-- Ícone -->
                <div
                  class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                  :class="getTipoConfig(notif.tipo).bgClass"
                >
                  <UIcon :name="getTipoConfig(notif.tipo).icon" class="text-sm" :class="getTipoConfig(notif.tipo).iconClass" />
                </div>

                <!-- Conteúdo -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                    {{ notif.titulo }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                    {{ notif.mensagem }}
                  </p>
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {{ formatarDataRelativa(notif.data_criacao) }}
                  </p>
                </div>

                <!-- Botão deletar -->
                <button
                  @click.stop="deletar(notif.id)"
                  class="flex-shrink-0 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 rounded p-1 transition-all"
                  :class="{ 'opacity-100': !notif.lida }"
                >
                  <UIcon name="i-heroicons-x-mark" class="text-xs text-gray-400 hover:text-red-500" />
                </button>
              </div>
            </button>
          </div>
        </div>

        <!-- Footer com link para ver todas -->
        <div v-if="notificacoes.length > 0" class="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <NuxtLink
            to="/notificacoes"
            @click="isOpen = false"
            class="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
          >
            Ver todas as notificações →
          </NuxtLink>
        </div>
      </div>
    </Transition>

    <!-- Overlay para fechar dropdown ao clicar fora -->
    <div
      v-if="isOpen"
      @click="isOpen = false"
      class="fixed inset-0 z-40"
    />
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, onUnmounted } from 'vue'
import { TIPOS_NOTIFICACAO, type Notificacao } from '~/types/requisicoes'

const router = useRouter()
const { 
  todas: notificacoes, 
  naoLidas, 
  buscarNotificacoes, 
  marcarComoLida, 
  marcarTodasLidas, 
  deletarNotificacao,
  subscribe,
  unsubscribe
} = useNotificacoes()

const isOpen = ref(false)
const loading = ref(false)
const marcandoTodas = ref(false)

// Buscar notificações ao montar
onMounted(async () => {
  loading.value = true
  try {
    await buscarNotificacoes(10) // Últimas 10 no dropdown
    subscribe() // Inicia subscription realtime
  } finally {
    loading.value = false
  }
})

// Limpar subscription ao desmontar
onUnmounted(() => {
  unsubscribe()
})

// Toggle dropdown
const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

// Configuração visual por tipo de notificação
const getTipoConfig = (tipo: string) => {
  const config = TIPOS_NOTIFICACAO[tipo] || TIPOS_NOTIFICACAO.nova_requisicao
  
  const bgClasses: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-900/30',
    green: 'bg-green-100 dark:bg-green-900/30',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30',
    purple: 'bg-purple-100 dark:bg-purple-900/30',
    orange: 'bg-orange-100 dark:bg-orange-900/30',
    red: 'bg-red-100 dark:bg-red-900/30',
  }
  
  const iconClasses: Record<string, string> = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    purple: 'text-purple-600 dark:text-purple-400',
    orange: 'text-orange-600 dark:text-orange-400',
    red: 'text-red-600 dark:text-red-400',
  }
  
  return {
    icon: config.icon,
    bgClass: bgClasses[config.color] || bgClasses.blue,
    iconClass: iconClasses[config.color] || iconClasses.blue,
  }
}

// Formatar data relativa (ex: "há 2 horas")
const formatarDataRelativa = (data: string) => {
  const agora = new Date()
  const dataNotif = new Date(data)
  const diffMs = agora.getTime() - dataNotif.getTime()
  const diffMinutos = Math.floor(diffMs / 60000)
  const diffHoras = Math.floor(diffMs / 3600000)
  const diffDias = Math.floor(diffMs / 86400000)
  
  if (diffMinutos < 1) return 'Agora mesmo'
  if (diffMinutos < 60) return `Há ${diffMinutos} ${diffMinutos === 1 ? 'minuto' : 'minutos'}`
  if (diffHoras < 24) return `Há ${diffHoras} ${diffHoras === 1 ? 'hora' : 'horas'}`
  if (diffDias < 7) return `Há ${diffDias} ${diffDias === 1 ? 'dia' : 'dias'}`
  
  return dataNotif.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

// Marcar todas como lidas
const marcarTodasComoLidas = async () => {
  marcandoTodas.value = true
  try {
    await marcarTodasLidas()
  } finally {
    marcandoTodas.value = false
  }
}

// Clique em uma notificação
const handleClick = async (notif: Notificacao) => {
  // Marca como lida se ainda não foi
  if (!notif.lida) {
    await marcarComoLida(notif.id)
  }
  
  // Fecha o dropdown
  isOpen.value = false
  
  // Navega para a requisição
  if (notif.requisicao_id) {
    router.push(`/requisicoes/${notif.requisicao_id}`)
  }
}

// Deletar notificação
const deletar = async (id: number) => {
  await deletarNotificacao(id)
}
</script>

<style scoped>
/* Animação de pulse customizada para o botão */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .7;
  }
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Scroll suave para o dropdown */
.max-h-96 {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.max-h-96::-webkit-scrollbar {
  width: 6px;
}

.max-h-96::-webkit-scrollbar-track {
  background: transparent;
}

.max-h-96::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.max-h-96::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}
</style>
