<template>
  <div>
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold mb-2">Versão do Sistema</h1>
            <p class="text-gray-600 dark:text-gray-400">Gerencie o versionamento da aplicação</p>
          </div>
          <UBadge v-if="versaoAtual" size="lg" color="primary" variant="subtle">
            v{{ versaoAtual.version }}
          </UBadge>
        </div>
      </template>

      <!-- Informações da Versão Atual -->
      <div v-if="versaoAtual" class="mb-8">
        <h2 class="text-lg font-semibold mb-4">Versão Atual</h2>
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Versão</p>
              <p class="text-xl font-bold text-primary-600">{{ versaoAtual.version }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Major.Minor.Patch</p>
              <p class="text-lg font-semibold">{{ versaoAtual.major }}.{{ versaoAtual.minor }}.{{ versaoAtual.patch }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Data de Criação</p>
              <p class="text-sm">{{ formatarData(versaoAtual.created_at) }}</p>
            </div>
          </div>
          <div v-if="versaoAtual.description">
            <p class="text-sm text-gray-500 dark:text-gray-400">Descrição</p>
            <p class="text-sm">{{ versaoAtual.description }}</p>
          </div>
          <div v-if="versaoAtual.build_metadata">
            <p class="text-sm text-gray-500 dark:text-gray-400">Build Metadata</p>
            <p class="text-sm font-mono text-gray-600">{{ versaoAtual.build_metadata }}</p>
          </div>
        </div>
      </div>

      <!-- Formulário de Nova Versão - Apenas para Master -->
      <UCard v-if="isMaster">
        <template #header>
          <h2 class="text-lg font-semibold">Atualizar Versão</h2>
        </template>

        <form @submit.prevent="atualizarVersao" class="space-y-4">
          <UFormGroup label="Nova Versão" required help="Formato: MAJOR.MINOR.PATCH (ex: 1.0.0)">
            <UInput 
              v-model="novaVersao" 
              placeholder="1.0.0" 
              :disabled="salvando"
              size="lg"
            />
          </UFormGroup>

          <UFormGroup label="Build Metadata (Opcional)" help="Informações adicionais após '+' (ex: build.2025.11.17)">
            <UInput 
              v-model="buildMetadata" 
              placeholder="build.2025.11.17" 
              :disabled="salvando"
            />
          </UFormGroup>

          <UFormGroup label="Descrição" required help="O que mudou nesta versão">
            <UTextarea 
              v-model="descricao" 
              placeholder="- Adicionado sistema de notificações por email&#10;- Corrigido bug na importação de metas&#10;- Melhorias de performance"
              :rows="4"
              :disabled="salvando"
            />
          </UFormGroup>

          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div class="text-sm text-blue-900 dark:text-blue-100">
                <p class="font-medium mb-1">Semantic Versioning (Semver)</p>
                <ul class="list-disc list-inside space-y-1 text-xs">
                  <li><strong>MAJOR</strong>: Mudanças incompatíveis/grandes (ex: 1.0.0 → 2.0.0)</li>
                  <li><strong>MINOR</strong>: Novas funcionalidades compatíveis (ex: 1.0.0 → 1.1.0)</li>
                  <li><strong>PATCH</strong>: Correções de bugs (ex: 1.0.0 → 1.0.1)</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <UButton 
              type="button" 
              color="gray" 
              variant="ghost" 
              @click="limparFormulario"
              :disabled="salvando"
            >
              Limpar
            </UButton>
            <UButton 
              type="submit" 
              icon="i-heroicons-check-circle"
              :loading="salvando"
              :disabled="!novaVersao || !descricao"
            >
              Atualizar Versão
            </UButton>
          </div>
        </form>
      </UCard>
    </UCard>

    <!-- Histórico de Versões -->
    <UCard class="mt-6">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">Histórico de Versões</h2>
          <UButton 
            icon="i-heroicons-arrow-path" 
            size="xs" 
            color="gray" 
            variant="ghost"
            @click="carregarHistorico"
            :loading="carregandoHistorico"
          >
            Atualizar
          </UButton>
        </div>
      </template>

      <div v-if="carregandoHistorico" class="text-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
        <p class="text-sm text-gray-500">Carregando histórico...</p>
      </div>

      <div v-else-if="historico.length === 0" class="text-center py-8">
        <UIcon name="i-heroicons-document-text" class="w-12 h-12 text-gray-300 mx-auto mb-2" />
        <p class="text-sm text-gray-500">Nenhum histórico encontrado</p>
      </div>

      <div v-else class="space-y-4">
        <div 
          v-for="(versao, index) in historico" 
          :key="versao.id"
          class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <UBadge 
                  :color="index === 0 ? 'primary' : 'gray'" 
                  :variant="index === 0 ? 'solid' : 'subtle'"
                >
                  v{{ versao.version }}
                </UBadge>
                <span v-if="index === 0" class="text-xs text-green-600 dark:text-green-400 font-medium">
                  ✓ Atual
                </span>
                <span class="text-xs text-gray-500">
                  {{ formatarData(versao.created_at) }}
                </span>
              </div>
              
              <p v-if="versao.description" class="text-sm text-gray-700 dark:text-gray-300 mb-2 whitespace-pre-line">
                {{ versao.description }}
              </p>

              <div class="flex items-center gap-4 text-xs text-gray-500">
                <span>Major: {{ versao.major }}</span>
                <span>Minor: {{ versao.minor }}</span>
                <span>Patch: {{ versao.patch }}</span>
                <span v-if="versao.build_metadata" class="font-mono">{{ versao.build_metadata }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

const supabase = useSupabaseClient()
const toast = useToast()
const { profile } = useProfile()

// Verifica se é Master
const isMaster = computed(() => profile.value?.perfis?.nome === 'Master')

// Estado
const versaoAtual = ref(null)
const historico = ref([])
const carregandoHistorico = ref(false)
const salvando = ref(false)

// Formulário
const novaVersao = ref('')
const buildMetadata = ref('')
const descricao = ref('')

// Carrega versão atual
async function carregarVersaoAtual() {
  try {
    const { data, error } = await supabase.rpc('get_system_version')
    
    if (error) throw error
    
    if (data && data.length > 0) {
      versaoAtual.value = data[0]
    }
  } catch (error) {
    console.error('Erro ao carregar versão atual:', error)
    toast.add({
      title: 'Erro',
      description: 'Não foi possível carregar a versão atual',
      color: 'red'
    })
  }
}

// Carrega histórico completo
async function carregarHistorico() {
  try {
    carregandoHistorico.value = true
    
    const { data, error } = await supabase
      .from('system_version')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (error) throw error
    
    historico.value = data || []
  } catch (error) {
    console.error('Erro ao carregar histórico:', error)
    toast.add({
      title: 'Erro',
      description: 'Não foi possível carregar o histórico',
      color: 'red'
    })
  } finally {
    carregandoHistorico.value = false
  }
}

// Atualiza versão
async function atualizarVersao() {
  if (!novaVersao.value || !descricao.value) {
    toast.add({
      title: 'Atenção',
      description: 'Preencha todos os campos obrigatórios',
      color: 'orange'
    })
    return
  }

  // Valida formato semver básico
  const semverRegex = /^\d+\.\d+\.\d+$/
  if (!semverRegex.test(novaVersao.value)) {
    toast.add({
      title: 'Formato Inválido',
      description: 'Use o formato MAJOR.MINOR.PATCH (ex: 1.0.0)',
      color: 'red'
    })
    return
  }

  try {
    salvando.value = true

    // Monta versão completa com metadata se fornecido
    const versaoCompleta = buildMetadata.value 
      ? `${novaVersao.value}+${buildMetadata.value}`
      : novaVersao.value

    const { error } = await supabase.rpc('set_system_version', {
      p_version: versaoCompleta,
      p_description: descricao.value
    })

    if (error) throw error

    toast.add({
      title: 'Versão Atualizada!',
      description: `Sistema atualizado para v${versaoCompleta}`,
      color: 'green'
    })

    // Recarrega dados
    await carregarVersaoAtual()
    await carregarHistorico()

    // Limpa formulário
    limparFormulario()

    // Força reload do layout para atualizar a versão na sidebar
    setTimeout(() => {
      window.location.reload()
    }, 1500)

  } catch (error) {
    console.error('Erro ao atualizar versão:', error)
    
    let mensagem = 'Não foi possível atualizar a versão'
    
    if (error.message?.includes('Permission denied')) {
      mensagem = 'Você não tem permissão para atualizar a versão (apenas Master/Gerência/Diretoria)'
    }

    toast.add({
      title: 'Erro',
      description: mensagem,
      color: 'red'
    })
  } finally {
    salvando.value = false
  }
}

// Limpa formulário
function limparFormulario() {
  novaVersao.value = ''
  buildMetadata.value = ''
  descricao.value = ''
}

// Formata data
function formatarData(data) {
  if (!data) return '-'
  return format(new Date(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

// Lifecycle
onMounted(() => {
  carregarVersaoAtual()
  carregarHistorico()
})
</script>
