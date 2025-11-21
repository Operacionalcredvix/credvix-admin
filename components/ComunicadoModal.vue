<template>
  <UModal 
    v-model="isOpen" 
    :prevent-close="true"
    :ui="{
      width: 'sm:max-w-2xl',
      height: 'h-auto max-h-[90vh]'
    }"
  >
    <UCard
      :ui="{
        ring: '',
        divide: 'divide-y divide-gray-100 dark:divide-gray-800',
        body: { padding: 'p-0 sm:p-0' }
      }"
    >
      <template #header>
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <UBadge 
                :color="getCategoriaColor(comunicado.categoria)" 
                variant="subtle"
                size="sm"
              >
                {{ comunicado.categoria }}
              </UBadge>
              <span class="text-xs text-gray-500">
                {{ formatarData(comunicado.data_envio) }}
              </span>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white">
              {{ comunicado.titulo }}
            </h3>
            <p v-if="comunicado.criado_por_nome" class="text-sm text-gray-500 mt-1">
              Por {{ comunicado.criado_por_nome }}
            </p>
          </div>
          
          <UIcon 
            name="i-heroicons-envelope-open"
            class="w-8 h-8 text-primary-500"
          />
        </div>
      </template>

      <div class="p-6 sm:p-8 max-h-[60vh] overflow-y-auto">
        <!-- Imagem (se houver) -->
        <div v-if="comunicado.imagem_url" class="mb-6">
          <img 
            :src="comunicado.imagem_url" 
            :alt="comunicado.titulo"
            class="w-full h-auto rounded-lg shadow-md object-contain max-h-96"
            @error="onImagemErro"
          />
        </div>
        
        <!-- Conteúdo -->
        <div 
          class="prose dark:prose-invert max-w-none"
          v-html="formatarConteudo(comunicado.conteudo)"
        />
      </div>

      <template #footer>
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-500">
            <template v-if="total > 1">
              {{ indiceAtual + 1 }} de {{ total }} comunicados
            </template>
          </div>
          
          <div class="flex gap-3">
            <UButton
              color="primary"
              size="lg"
              :loading="carregando"
              @click="confirmar"
            >
              <UIcon name="i-heroicons-check" class="w-5 h-5 mr-2" />
              Confirmar Leitura
            </UButton>
          </div>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import type { ComunicadoNaoVisualizado } from '~/types/comunicados'

const props = defineProps<{
  comunicado: ComunicadoNaoVisualizado
  total: number
  indiceAtual: number
}>()

const emit = defineEmits<{
  confirmar: []
}>()

const isOpen = defineModel<boolean>('modelValue', { required: true })
const carregando = ref(false)

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

const formatarConteudo = (conteudo: string) => {
  // Converte quebras de linha em <br>
  return conteudo.replace(/\n/g, '<br>')
}

const onImagemErro = (event: Event) => {
  // Remove imagem se não carregar
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

const confirmar = async () => {
  carregando.value = true
  try {
    emit('confirmar')
  } finally {
    carregando.value = false
  }
}
</script>
