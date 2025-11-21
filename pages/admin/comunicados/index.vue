<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">Comunicados Internos</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          Gerencie comunicados para os usuários do sistema
        </p>
      </div>
      <UButton
        icon="i-heroicons-plus"
        size="lg"
        @click="abrirModalCriar"
      >
        Novo Comunicado
      </UButton>
    </div>

    <!-- Filtros -->
    <UCard class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <USelectMenu
          v-model="filtroCategoria"
          :options="categorias"
          placeholder="Filtrar por categoria"
          :ui-menu="{ option: { base: 'cursor-pointer' } }"
        >
          <template #label>
            <span v-if="filtroCategoria">{{ filtroCategoria }}</span>
            <span v-else class="text-gray-500">Todas as categorias</span>
          </template>
        </USelectMenu>

        <USelectMenu
          v-model="filtroStatus"
          :options="statusOptions"
          placeholder="Filtrar por status"
        >
          <template #label>
            <span v-if="filtroStatus !== null">{{ filtroStatus ? 'Ativos' : 'Inativos' }}</span>
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
      <p class="text-gray-500 mt-4">Carregando comunicados...</p>
    </div>

    <div v-else-if="comunicadosFiltrados.length === 0" class="text-center py-12">
      <UIcon name="i-heroicons-inbox" class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
      <p class="text-gray-500 dark:text-gray-400 mt-4">Nenhum comunicado encontrado</p>
    </div>

    <div v-else class="grid gap-4">
      <UCard
        v-for="comunicado in comunicadosFiltrados"
        :key="comunicado.id"
        :ui="{ body: { padding: 'p-6' } }"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <UBadge :color="getCategoriaColor(comunicado.categoria)" variant="subtle">
                {{ comunicado.categoria }}
              </UBadge>
              <UBadge v-if="!comunicado.ativo" color="gray" variant="subtle">
                Inativo
              </UBadge>
              <span class="text-sm text-gray-500">
                {{ formatarData(comunicado.data_envio) }}
              </span>
            </div>

            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {{ comunicado.titulo }}
            </h3>

            <p class="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
              {{ comunicado.conteudo }}
            </p>

            <div class="flex items-center gap-4 text-sm text-gray-500">
              <div v-if="comunicado.criado_por_funcionario" class="flex items-center gap-1">
                <UIcon name="i-heroicons-user" class="w-4 h-4" />
                <span>{{ comunicado.criado_por_funcionario.nome }}</span>
              </div>

              <div v-if="comunicado.perfis_destino" class="flex items-center gap-1">
                <UIcon name="i-heroicons-user-group" class="w-4 h-4" />
                <span>{{ comunicado.perfis_destino.join(', ') }}</span>
              </div>

              <div v-else class="flex items-center gap-1">
                <UIcon name="i-heroicons-globe-alt" class="w-4 h-4" />
                <span>Todos os usuários</span>
              </div>
            </div>
          </div>

          <div class="flex gap-2">
            <UButton
              icon="i-heroicons-pencil"
              color="gray"
              variant="ghost"
              size="sm"
              @click="editarComunicado(comunicado)"
            />
            <UButton
              icon="i-heroicons-trash"
              color="red"
              variant="ghost"
              size="sm"
              @click="confirmarExclusao(comunicado)"
            />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Modal de Criar/Editar -->
    <ComunicadoFormModal
      v-model="mostrarModalForm"
      :comunicado="comunicadoEdicao"
      @salvo="handleSalvo"
    />
  </div>
</template>

<script setup lang="ts">
import type { Comunicado } from '~/types/comunicados'

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

const comunicados = ref<Comunicado[]>([])
const carregando = ref(false)
const mostrarModalForm = ref(false)
const comunicadoEdicao = ref<Comunicado | null>(null)

const filtroCategoria = ref<string | null>(null)
const filtroStatus = ref<boolean | null>(null)

const categorias = [
  'Aviso',
  'Informação',
  'Notificação',
  'Urgente',
  'Atualização'
]

const statusOptions = [
  { label: 'Ativos', value: true },
  { label: 'Inativos', value: false }
]

const comunicadosFiltrados = computed(() => {
  let resultado = comunicados.value

  if (filtroCategoria.value) {
    resultado = resultado.filter(c => c.categoria === filtroCategoria.value)
  }

  if (filtroStatus.value !== null) {
    resultado = resultado.filter(c => c.ativo === filtroStatus.value)
  }

  return resultado
})

const buscarComunicados = async () => {
  carregando.value = true
  try {
    const data = await $fetch<Comunicado[]>('/api/comunicados')
    comunicados.value = data
  } catch (error) {
    console.error('Erro ao buscar comunicados:', error)
  } finally {
    carregando.value = false
  }
}

const abrirModalCriar = () => {
  comunicadoEdicao.value = null
  mostrarModalForm.value = true
}

const editarComunicado = (comunicado: Comunicado) => {
  comunicadoEdicao.value = comunicado
  mostrarModalForm.value = true
}

const confirmarExclusao = async (comunicado: Comunicado) => {
  // Implementar confirmação e exclusão
  console.log('Excluir:', comunicado)
}

const handleSalvo = () => {
  buscarComunicados()
}

const limparFiltros = () => {
  filtroCategoria.value = null
  filtroStatus.value = null
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

onMounted(() => {
  buscarComunicados()
})
</script>
