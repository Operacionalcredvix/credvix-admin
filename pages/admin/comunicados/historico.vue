<template>
  <div>
    <div class="mb-6">
      <h1 class="text-3xl font-bold">Histórico de Comunicados</h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">
        Consulte todos os comunicados enviados
      </p>
    </div>

    <!-- Filtros -->
    <UCard class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <USelectMenu
          v-model="filtroCategoria"
          :options="categorias"
          placeholder="Filtrar por categoria"
        >
          <template #label>
            <span v-if="filtroCategoria">{{ filtroCategoria }}</span>
            <span v-else class="text-gray-500">Todas as categorias</span>
          </template>
        </USelectMenu>

        <USelectMenu
          v-model="filtroVisualizado"
          :options="visualizadoOptions"
          placeholder="Filtrar por status"
        >
          <template #label>
            <span v-if="filtroVisualizado !== null">
              {{ filtroVisualizado ? 'Visualizados' : 'Não visualizados' }}
            </span>
            <span v-else class="text-gray-500">Todos</span>
          </template>
        </USelectMenu>

        <UButton
          variant="outline"
          color="gray"
          @click="limparFiltros"
        >
          <UIcon name="i-heroicons-x-mark" class="mr-2" />
          Limpar Filtros
        </UButton>
      </div>
    </UCard>

    <!-- Lista de Comunicados -->
    <div v-if="carregando" class="text-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-12 h-12 animate-spin mx-auto text-gray-400" />
      <p class="text-gray-500 mt-4">Carregando histórico...</p>
    </div>

    <div v-else-if="comunicadosFiltrados.length === 0" class="text-center py-12">
      <UIcon name="i-heroicons-inbox" class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
      <p class="text-gray-500 dark:text-gray-400 mt-4">Nenhum comunicado encontrado</p>
    </div>

    <div v-else class="grid gap-4">
      <UCard
        v-for="comunicado in comunicadosFiltrados"
        :key="comunicado.id"
        :ui="{
          body: { padding: 'p-6' },
          ring: comunicado.visualizado ? '' : 'ring-2 ring-primary-500'
        }"
      >
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 pt-1">
            <UIcon
              :name="comunicado.visualizado ? 'i-heroicons-envelope-open' : 'i-heroicons-envelope'"
              :class="comunicado.visualizado ? 'text-gray-400' : 'text-primary-500'"
              class="w-6 h-6"
            />
          </div>

          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <UBadge :color="getCategoriaColor(comunicado.categoria)" variant="subtle">
                {{ comunicado.categoria }}
              </UBadge>
              <UBadge v-if="!comunicado.visualizado" color="primary" variant="solid">
                Novo
              </UBadge>
              <span class="text-sm text-gray-500">
                {{ formatarData(comunicado.data_envio) }}
              </span>
            </div>

            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {{ comunicado.titulo }}
            </h3>

            <p class="text-gray-600 dark:text-gray-300 mb-4 whitespace-pre-line line-clamp-3">
              {{ comunicado.conteudo }}
            </p>

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4 text-sm text-gray-500">
                <div v-if="comunicado.criado_por_nome" class="flex items-center gap-1">
                  <UIcon name="i-heroicons-user" class="w-4 h-4" />
                  <span>Por {{ comunicado.criado_por_nome }}</span>
                </div>

                <div v-if="comunicado.visualizado_em" class="flex items-center gap-1">
                  <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-green-500" />
                  <span>Visualizado em {{ formatarData(comunicado.visualizado_em) }}</span>
                </div>
              </div>

              <UButton
                color="primary"
                variant="soft"
                size="sm"
                @click="abrirComunicado(comunicado)"
              >
                <UIcon name="i-heroicons-eye" class="mr-2" />
                Ver Comunicado
              </UButton>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Modal para visualizar comunicado -->
    <UModal v-model="mostrarModal" :ui="{ width: 'sm:max-w-2xl' }">
      <UCard v-if="comunicadoSelecionado">
        <template #header>
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <UBadge 
                  :color="getCategoriaColor(comunicadoSelecionado.categoria)" 
                  variant="subtle"
                  size="sm"
                >
                  {{ comunicadoSelecionado.categoria }}
                </UBadge>
                <span class="text-xs text-gray-500">
                  {{ formatarData(comunicadoSelecionado.data_envio) }}
                </span>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white">
                {{ comunicadoSelecionado.titulo }}
              </h3>
              <p v-if="comunicadoSelecionado.criado_por_nome" class="text-sm text-gray-500 mt-1">
                Por {{ comunicadoSelecionado.criado_por_nome }}
              </p>
            </div>
            
            <UIcon 
              :name="comunicadoSelecionado.visualizado ? 'i-heroicons-envelope-open' : 'i-heroicons-envelope'"
              class="w-8 h-8"
              :class="comunicadoSelecionado.visualizado ? 'text-gray-400' : 'text-primary-500'"
            />
          </div>
        </template>

        <div class="p-6 sm:p-8 max-h-[60vh] overflow-y-auto">
          <!-- Imagem (se houver) -->
          <div v-if="comunicadoSelecionado.imagem_url" class="mb-6">
            <img 
              :src="comunicadoSelecionado.imagem_url" 
              :alt="comunicadoSelecionado.titulo"
              class="w-full h-auto rounded-lg shadow-md object-contain max-h-96"
            />
          </div>
          
          <!-- Conteúdo -->
          <div 
            class="prose dark:prose-invert max-w-none"
            v-html="formatarConteudo(comunicadoSelecionado.conteudo)"
          />
        </div>

        <template #footer>
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-500">
              <span v-if="comunicadoSelecionado.visualizado_em" class="flex items-center gap-1">
                <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-green-500" />
                Visualizado em {{ formatarData(comunicadoSelecionado.visualizado_em) }}
              </span>
              <span v-else class="flex items-center gap-1 text-primary-600">
                <UIcon name="i-heroicons-exclamation-circle" class="w-4 h-4" />
                Não visualizado
              </span>
            </div>
            
            <UButton
              color="gray"
              variant="soft"
              @click="mostrarModal = false"
            >
              Fechar
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { ComunicadoVisualizado } from '~/types/comunicados'

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

const comunicados = ref<ComunicadoVisualizado[]>([])
const carregando = ref(false)
const mostrarModal = ref(false)
const comunicadoSelecionado = ref<ComunicadoVisualizado | null>(null)

const filtroCategoria = ref<string | null>(null)
const filtroVisualizado = ref<boolean | null>(null)

const categorias = [
  'Aviso',
  'Informação',
  'Notificação',
  'Urgente',
  'Atualização'
]

const visualizadoOptions = [
  { label: 'Visualizados', value: true },
  { label: 'Não visualizados', value: false }
]

const comunicadosFiltrados = computed(() => {
  let resultado = comunicados.value

  if (filtroCategoria.value) {
    resultado = resultado.filter(c => c.categoria === filtroCategoria.value)
  }

  if (filtroVisualizado.value !== null) {
    resultado = resultado.filter(c => c.visualizado === filtroVisualizado.value)
  }

  return resultado
})

const buscarHistorico = async () => {
  carregando.value = true
  try {
    const data = await $fetch<ComunicadoVisualizado[]>('/api/comunicados/historico')
    comunicados.value = data
  } catch (error) {
    console.error('Erro ao buscar histórico:', error)
  } finally {
    carregando.value = false
  }
}

const limparFiltros = () => {
  filtroCategoria.value = null
  filtroVisualizado.value = null
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

const formatarData = (data: string) => {
  return new Date(data).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatarConteudo = (conteudo: string | null) => {
  if (!conteudo) return ''
  return conteudo.replace(/\n/g, '<br>')
}

const abrirComunicado = (comunicado: ComunicadoVisualizado) => {
  comunicadoSelecionado.value = comunicado
  mostrarModal.value = true
}

onMounted(() => {
  buscarHistorico()
})
</script>
