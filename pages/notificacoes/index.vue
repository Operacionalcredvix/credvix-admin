<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Notificações</h1>
        <p class="text-sm text-gray-500">Todas as notificações recebidas (ordenadas por mais recentes)</p>
      </div>

      <div class="flex items-center gap-3">
        <UButton size="sm" color="primary" @click="marcarTodasComoLidas" :loading="marcandoTodas">Marcar todas como lidas</UButton>
        <UButton size="sm" color="gray" variant="outline" @click="carregar">Atualizar</UButton>
        <div class="flex items-center gap-2 ml-2">
          <label class="text-sm text-gray-600">Apenas não-lidas</label>
          <input type="checkbox" v-model="showOnlyUnread" />
        </div>
      </div>
    </div>

    <UCard>
      <div v-if="loading" class="flex items-center justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-gray-400" />
      </div>

      <div v-else-if="notificacoes.length === 0" class="text-center py-12">
        <UIcon name="i-heroicons-bell-slash" class="text-4xl text-gray-300 dark:text-gray-600 mb-4" />
        <p class="text-sm text-gray-500">Nenhuma notificação encontrada</p>
      </div>

      <div v-else class="space-y-4">
        <div v-for="group in grouped" :key="group.label" class="space-y-2">
          <h4 class="text-sm font-semibold text-gray-600">{{ group.label }}</h4>
          <div class="space-y-2">
            <template v-for="n in group.items" :key="n.id">
              <div class="flex items-start gap-3 p-4 rounded border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition">
                <div class="w-10 h-10 flex items-center justify-center rounded-full" :class="getTipoConfig(n.tipo).bgClass">
                  <UIcon :name="getTipoConfig(n.tipo).icon" :class="getTipoConfig(n.tipo).iconClass" />
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-3">
                    <div class="min-w-0">
                      <p class="text-sm font-medium truncate">{{ n.titulo }}</p>
                      <p class="text-xs text-gray-500 truncate mt-0.5">{{ n.mensagem }}</p>
                    </div>

                    <div class="text-xs text-gray-400">{{ formatarDataRelativa(n.data_criacao) }}</div>
                  </div>

                  <div class="mt-2 flex items-center gap-2">
                    <UButton size="xs" variant="ghost" color="primary" @click="abrir(n)">Abrir</UButton>
                    <UButton size="xs" variant="outline" color="gray" @click="marcarComoLida(n.id)" :disabled="n.lida">Marcar como lida</UButton>
                    <UButton size="xs" variant="ghost" color="danger" @click="deletar(n.id)">Remover</UButton>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { TIPOS_NOTIFICACAO } from '~/types/requisicoes'

definePageMeta({ middleware: 'auth' })

const router = useRouter()
const { todas: notificacoesRef, buscarNotificacoes, marcarComoLida, marcarTodasLidas, deletarNotificacao } = useNotificacoes()

const loading = ref(false)
const marcandoTodas = ref(false)
const showOnlyUnread = ref(false)

import { computed } from 'vue'

const filtered = computed(() => {
  const list = notificacoes.value || []
  return showOnlyUnread.value ? list.filter(n => !n.lida) : list
})

function groupByDay(list) {
  const groups = {}
  const today = new Date()
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1)

  list.forEach(n => {
    const d = new Date(n.data_criacao)
    let label = ''
    if (d.toDateString() === today.toDateString()) label = 'Hoje'
    else if (d.toDateString() === yesterday.toDateString()) label = 'Ontem'
    else label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

    if (!groups[label]) groups[label] = []
    groups[label].push(n)
  })

  // order labels: Hoje, Ontem, then others by date desc
  const ordered = []
  if (groups['Hoje']) ordered.push({ label: 'Hoje', items: groups['Hoje'] })
  if (groups['Ontem']) ordered.push({ label: 'Ontem', items: groups['Ontem'] })
  const others = Object.keys(groups).filter(l => l !== 'Hoje' && l !== 'Ontem')
  others.sort((a,b) => {
    // parse dd/mm/yyyy
    const pa = a.split('/').reverse().join('-')
    const pb = b.split('/').reverse().join('-')
    return new Date(pb) - new Date(pa)
  })
  others.forEach(l => ordered.push({ label: l, items: groups[l] }))
  return ordered
}

const grouped = computed(() => groupByDay(filtered.value))

async function carregar() {
  loading.value = true
  try {
    await buscarNotificacoes(100)
  } finally {
    loading.value = false
  }
}

onMounted(() => carregar())

function getTipoConfig(tipo) {
  const config = TIPOS_NOTIFICACAO[tipo] || TIPOS_NOTIFICACAO.nova_requisicao
  const bgClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30',
    green: 'bg-green-100 dark:bg-green-900/30',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30',
    purple: 'bg-purple-100 dark:bg-purple-900/30',
    orange: 'bg-orange-100 dark:bg-orange-900/30',
    red: 'bg-red-100 dark:bg-red-900/30'
  }
  const iconClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    purple: 'text-purple-600 dark:text-purple-400',
    orange: 'text-orange-600 dark:text-orange-400',
    red: 'text-red-600 dark:text-red-400'
  }
  return {
    icon: config.icon,
    bgClass: bgClasses[config.color] || bgClasses.blue,
    iconClass: iconClasses[config.color] || iconClasses.blue
  }
}

function formatarDataRelativa(data) {
  if (!data) return '-'
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

async function marcarTodasComoLidas() {
  marcandoTodas.value = true
  try {
    await marcarTodasLidas()
  } finally {
    marcandoTodas.value = false
  }
}

async function abrir(n) {
  if (!n.lida) await marcarComoLida(n.id)
  if (n.requisicao_id) {
    router.push(`/requisicoes/${n.requisicao_id}`)
  } else {
    // rota fallback: apenas abrir detalhes locais
    // por enquanto não há detalhe universal, apenas recarrega
    await carregar()
  }
}

async function deletar(id) {
  await deletarNotificacao(id)
}

const notificacoes = notificacoesRef
</script>

<style scoped>
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
</style>
