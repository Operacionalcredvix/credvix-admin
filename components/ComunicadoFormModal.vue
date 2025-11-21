<template>
  <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-4xl' }">
    <UCard>
      <template #header>
        <h3 class="text-xl font-bold">
          {{ comunicado ? 'Editar Comunicado' : 'Novo Comunicado' }}
        </h3>
      </template>

      <form @submit.prevent="salvar" class="space-y-6">
        <!-- Título -->
        <UFormGroup label="Título" required>
          <UInput
            v-model="form.titulo"
            placeholder="Digite o título do comunicado"
            size="lg"
            :maxlength="200"
          />
        </UFormGroup>

        <!-- Categoria -->
        <UFormGroup label="Categoria" required>
          <USelectMenu
            v-model="form.categoria"
            :options="categorias"
            placeholder="Selecione a categoria"
          />
        </UFormGroup>

        <!-- Conteúdo -->
        <UFormGroup label="Mensagem">
          <UTextarea
            v-model="form.conteudo"
            placeholder="Digite a mensagem do comunicado (obrigatório se não houver imagem)"
            :rows="10"
            :maxlength="5000"
          />
          <template #hint>
            <span class="text-xs text-gray-500">
              {{ form.conteudo.length }}/5000 caracteres
            </span>
          </template>
        </UFormGroup>

        <!-- Imagem -->
        <UFormGroup label="Imagem">
          <div class="space-y-3">
            <!-- Upload de arquivo -->
            <div class="flex items-center gap-3">
              <label 
                for="file-upload" 
                class="flex-1 cursor-pointer"
              >
                <div 
                  class="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-primary-500 transition-colors"
                  @dragover.prevent="isDragging = true"
                  @dragleave.prevent="isDragging = false"
                  @drop.prevent="handleDrop"
                  :class="{ 'border-primary-500 bg-primary-50 dark:bg-primary-950': isDragging }"
                >
                  <UIcon 
                    name="i-heroicons-cloud-arrow-up" 
                    class="w-12 h-12 mx-auto mb-2 text-gray-400"
                  />
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Clique para selecionar ou arraste uma imagem
                  </p>
                  <p class="text-xs text-gray-500 mt-1">
                    JPG, PNG, GIF ou WEBP (máx. 5MB)
                  </p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  class="hidden"
                  @change="handleFileSelect"
                />
              </label>
            </div>
            
            <!-- Preview da imagem -->
            <div v-if="form.imagem_url" class="relative">
              <img 
                :src="form.imagem_url" 
                alt="Preview"
                class="w-full h-64 object-contain rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
              />
              <UButton
                icon="i-heroicons-x-mark"
                color="red"
                variant="soft"
                size="sm"
                class="absolute top-2 right-2"
                @click="removerImagem"
                :loading="fazendoUpload"
              >
                Remover
              </UButton>
            </div>
            
            <!-- Loading do upload -->
            <div v-if="fazendoUpload" class="flex items-center gap-2 text-sm text-gray-600">
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              Enviando imagem...
            </div>

            <!-- Mensagem de erro -->
            <UAlert
              v-if="erroUpload"
              color="red"
              variant="soft"
              :title="erroUpload"
              :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'red', variant: 'link' }"
              @close="erroUpload = null"
            />
          </div>
          <template #hint>
            <span class="text-xs text-gray-500">
              Envie uma imagem (obrigatório se não houver mensagem de texto)
            </span>
          </template>
        </UFormGroup>

        <!-- Destinatários -->
        <UCard :ui="{ body: { padding: 'p-4' } }">
          <template #header>
            <h4 class="font-semibold">Destinatários</h4>
          </template>

          <div class="space-y-4">
            <!-- Perfis -->
            <UFormGroup label="Perfis">
              <USelectMenu
                v-model="form.perfis_destino"
                :options="perfisDisponiveis"
                multiple
                placeholder="Todos os perfis"
              >
                <template #label>
                  <span v-if="!form.perfis_destino || form.perfis_destino.length === 0" class="text-gray-500">
                    Todos os perfis
                  </span>
                  <span v-else>
                    {{ form.perfis_destino.length }} perfil(is) selecionado(s)
                  </span>
                </template>
              </USelectMenu>
              <template #hint>
                <span class="text-xs text-gray-500">
                  Deixe vazio para enviar para todos os perfis
                </span>
              </template>
            </UFormGroup>

            <!-- Regionais -->
            <UFormGroup label="Regionais Específicas (Opcional)">
              <USelectMenu
                v-model="form.regionais_destino"
                :options="regionais"
                option-attribute="nome_regional"
                value-attribute="id"
                multiple
                placeholder="Todas as regionais"
                :loading="carregandoRegionais"
              >
                <template #label>
                  <span v-if="!form.regionais_destino || form.regionais_destino.length === 0" class="text-gray-500">
                    Todas as regionais
                  </span>
                  <span v-else>
                    {{ form.regionais_destino.length }} regional(is) selecionada(s)
                  </span>
                </template>
              </USelectMenu>
            </UFormGroup>

            <!-- Lojas -->
            <UFormGroup label="Lojas Específicas (Opcional)">
              <USelectMenu
                v-model="form.lojas_destino"
                :options="lojas"
                option-attribute="nome"
                value-attribute="id"
                multiple
                placeholder="Todas as lojas"
                :loading="carregandoLojas"
                searchable
                searchable-placeholder="Buscar loja..."
              >
                <template #label>
                  <span v-if="!form.lojas_destino || form.lojas_destino.length === 0" class="text-gray-500">
                    Todas as lojas
                  </span>
                  <span v-else>
                    {{ form.lojas_destino.length }} loja(s) selecionada(s)
                  </span>
                </template>
              </USelectMenu>
            </UFormGroup>
          </div>
        </UCard>

        <!-- Data de Envio -->
        <UFormGroup label="Data de Envio" hint="Deixe vazio para enviar imediatamente">
          <UInput
            v-model="form.data_envio"
            type="datetime-local"
          />
        </UFormGroup>
      </form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            color="gray"
            variant="ghost"
            @click="isOpen = false"
          >
            Cancelar
          </UButton>
          <UButton
            color="primary"
            :loading="salvando"
            @click="salvar"
          >
            {{ comunicado ? 'Salvar Alterações' : 'Criar Comunicado' }}
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import type { Comunicado, CreateComunicadoInput } from '~/types/comunicados'

const props = defineProps<{
  comunicado?: Comunicado | null
}>()

const emit = defineEmits<{
  salvo: []
}>()

const isOpen = defineModel<boolean>('modelValue', { required: true })

const form = reactive<CreateComunicadoInput>({
  titulo: '',
  conteudo: '',
  categoria: 'Informação',
  imagem_url: null,
  perfis_destino: null,
  regionais_destino: null,
  lojas_destino: null,
  data_envio: undefined
})

const salvando = ref(false)
const carregandoRegionais = ref(false)
const carregandoLojas = ref(false)
const fazendoUpload = ref(false)
const erroUpload = ref<string | null>(null)
const isDragging = ref(false)

const regionais = ref<Array<{ id: number, nome: string }>>([])
const lojas = ref<Array<{ id: number, nome: string }>>([])

const categorias = [
  'Aviso',
  'Informação',
  'Notificação',
  'Urgente',
  'Atualização'
]

const perfisDisponiveis = [
  'Master',
  'Diretoria',
  'Gerência',
  'Coordenador',
  'Supervisor',
  'Consultor',
  'RH',
  'Financeiro',
  'Administrativo',
  'Backoffice',
  'TI'
]

// Carrega dados quando o modal abre
watch(isOpen, async (newValue) => {
  if (newValue) {
    erroUpload.value = null
    if (props.comunicado) {
      // Modo edição
      Object.assign(form, {
        titulo: props.comunicado.titulo,
        conteudo: props.comunicado.conteudo,
        categoria: props.comunicado.categoria,
        imagem_url: props.comunicado.imagem_url,
        perfis_destino: props.comunicado.perfis_destino,
        regionais_destino: props.comunicado.regionais_destino,
        lojas_destino: props.comunicado.lojas_destino,
        data_envio: props.comunicado.data_envio ? new Date(props.comunicado.data_envio).toISOString().slice(0, 16) : undefined
      })
    } else {
      // Modo criação - limpa form
      Object.assign(form, {
        titulo: '',
        conteudo: '',
        categoria: 'Informação',
        imagem_url: null,
        perfis_destino: null,
        regionais_destino: null,
        lojas_destino: null,
        data_envio: undefined
      })
    }

    await Promise.all([
      carregarRegionais(),
      carregarLojas()
    ])
  }
})

const carregarRegionais = async () => {
  carregandoRegionais.value = true
  try {
    const data = await $fetch<Array<{ id: number, nome: string }>>('/api/regionais')
    regionais.value = data
  } catch (error) {
    console.error('Erro ao carregar regionais:', error)
    regionais.value = []
  } finally {
    carregandoRegionais.value = false
  }
}

const carregarLojas = async () => {
  carregandoLojas.value = true
  try {
    const response = await $fetch<{ success: boolean, data: Array<{ id: number, nome: string }> }>('/api/lojas')
    if (response.success) {
      lojas.value = response.data
    } else {
      lojas.value = []
    }
  } catch (error) {
    console.error('Erro ao carregar lojas:', error)
    lojas.value = []
  } finally {
    carregandoLojas.value = false
  }
}

const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    await uploadImagem(file)
  }
}

const handleDrop = async (event: DragEvent) => {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    await uploadImagem(file)
  }
}

const uploadImagem = async (file: File) => {
  // Valida tipo
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    erroUpload.value = 'Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WEBP'
    return
  }

  // Valida tamanho (5MB)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    erroUpload.value = 'Arquivo muito grande. Tamanho máximo: 5MB'
    return
  }

  fazendoUpload.value = true
  erroUpload.value = null

  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await $fetch<{ success: boolean, url: string }>('/api/comunicados/upload-imagem', {
      method: 'POST',
      body: formData
    })

    if (response.success) {
      form.imagem_url = response.url
    } else {
      erroUpload.value = 'Erro ao fazer upload da imagem'
    }
  } catch (error: any) {
    console.error('Erro ao fazer upload:', error)
    erroUpload.value = error.data?.message || 'Erro ao fazer upload da imagem'
  } finally {
    fazendoUpload.value = false
  }
}

const removerImagem = () => {
  form.imagem_url = null
  erroUpload.value = null
}

const salvar = async () => {
  // Validações - precisa ter texto OU imagem
  if (!form.titulo || form.titulo.length < 3) {
    erroUpload.value = 'Título deve ter no mínimo 3 caracteres'
    return
  }

  const temTexto = form.conteudo && form.conteudo.trim().length >= 10
  const temImagem = form.imagem_url && form.imagem_url.trim().length > 0

  if (!temTexto && !temImagem) {
    erroUpload.value = 'Você precisa preencher a mensagem de texto OU enviar uma imagem'
    return
  }

  salvando.value = true
  try {
    // Prepara dados - se vazio, "Todos" ou null, envia null para todos os usuários ativos
    const perfisParaEnviar = !form.perfis_destino || 
                            form.perfis_destino.length === 0 || 
                            form.perfis_destino.includes('Todos')
      ? null 
      : form.perfis_destino.filter(p => p !== 'Todos')

    await $fetch('/api/comunicados', {
      method: 'POST',
      body: {
        ...form,
        perfis_destino: perfisParaEnviar
      }
    })

    emit('salvo')
    isOpen.value = false
  } catch (error) {
    console.error('Erro ao salvar comunicado:', error)
    alert('Erro ao salvar comunicado')
  } finally {
    salvando.value = false
  }
}
</script>
