<template>
  <div class="space-y-8">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold mb-2">Alertas de Segurança</h1>
        <p class="text-gray-600 dark:text-gray-400">Monitoramento em tempo real de atividades suspeitas</p>
      </div>
      <div class="flex gap-3">
        <UButton
          icon="i-heroicons-arrow-path"
          label="Executar Detecção"
          color="primary"
          :loading="executandoDeteccao"
          @click="executarDeteccao"
        />
        <UButton
          icon="i-heroicons-arrow-path"
          label="Atualizar"
          color="gray"
          variant="outline"
          @click="buscarAlertas"
        />
      </div>
    </header>

    <!-- Estatísticas Rápidas -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard>
        <div class="flex items-center gap-3">
          <div class="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
            <UIcon name="i-heroicons-exclamation-triangle" class="text-2xl text-red-500" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Não Lidos</p>
            <p class="text-2xl font-bold">{{ stats.nao_lidos || 0 }}</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-3">
          <div class="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <UIcon name="i-heroicons-clock" class="text-2xl text-amber-500" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Pendentes</p>
            <p class="text-2xl font-bold">{{ stats.pendentes || 0 }}</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-3">
          <div class="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
            <UIcon name="i-heroicons-shield-exclamation" class="text-2xl text-purple-500" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Críticos (24h)</p>
            <p class="text-2xl font-bold">{{ stats.criticos_24h || 0 }}</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-3">
          <div class="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
            <UIcon name="i-heroicons-check-circle" class="text-2xl text-green-500" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Resolvidos (7d)</p>
            <p class="text-2xl font-bold">{{ stats.resolvidos_7d || 0 }}</p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Filtros -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-funnel" class="text-primary-500" />
            <h3 class="font-semibold">Filtros</h3>
          </div>
          <UButton 
            @click="limparFiltros" 
            color="gray" 
            variant="outline" 
            icon="i-heroicons-x-mark"
            label="Limpar"
            size="sm"
          />
        </div>
      </template>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <UFormGroup label="Tipo" name="tipo">
          <USelectMenu 
            v-model="filtroTipo" 
            :options="tiposAlerta" 
            placeholder="Todos" 
            clearable 
          />
        </UFormGroup>
        
        <UFormGroup label="Severidade" name="severidade">
          <USelectMenu 
            v-model="filtroSeveridade" 
            :options="['BAIXA', 'MEDIA', 'ALTA', 'CRITICA']" 
            placeholder="Todas" 
            clearable 
          />
        </UFormGroup>

        <UFormGroup label="Status" name="status">
          <USelectMenu 
            v-model="filtroStatus" 
            :options="['Não Lido', 'Lido', 'Pendente', 'Resolvido']" 
            placeholder="Todos" 
          />
        </UFormGroup>

        <UFormGroup label="Email/IP" name="busca">
          <UInput v-model="filtroBusca" placeholder="Buscar..." />
        </UFormGroup>
      </div>
    </UCard>

    <!-- Lista de Alertas -->
    <UCard>
      <template #header>
        <h3 class="font-semibold">Alertas Recentes</h3>
      </template>

      <div v-if="loading" class="text-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin text-3xl text-gray-400" />
      </div>

      <div v-else-if="alertas.length === 0" class="text-center py-8">
        <UIcon name="i-heroicons-check-circle" class="text-5xl text-green-400 mb-4" />
        <p class="text-gray-500">Nenhum alerta encontrado</p>
      </div>

      <div v-else class="space-y-3">
        <div 
          v-for="alerta in alertas" 
          :key="alerta.id"
          class="relative p-4 rounded-lg border transition-all hover:shadow-md"
          :class="getAlertaClasses(alerta)"
        >
          <!-- Badge de não lido -->
          <div v-if="!alerta.lido" class="absolute top-2 right-2">
            <div class="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          </div>

          <div class="flex items-start gap-4">
            <!-- Ícone -->
            <div class="p-3 rounded-lg" :class="getSeveridadeBgClass(alerta.severidade)">
              <UIcon :name="getTipoIcon(alerta.tipo)" class="text-2xl" :class="getSeveridadeTextClass(alerta.severidade)" />
            </div>

            <!-- Conteúdo -->
            <div class="flex-1">
              <div class="flex items-start justify-between mb-2">
                <div>
                  <h4 class="font-semibold text-lg">{{ alerta.titulo }}</h4>
                  <div class="flex items-center gap-2 mt-1">
                    <UBadge :label="alerta.tipo.replace('_', ' ')" variant="subtle" size="xs" />
                    <UBadge :label="alerta.severidade" :color="getSeveridadeColor(alerta.severidade)" variant="subtle" size="xs" />
                    <span class="text-xs text-gray-500">{{ formatarDataHora(alerta.created_at) }}</span>
                  </div>
                </div>
              </div>

              <p class="text-sm text-gray-700 dark:text-gray-300 mb-3">{{ alerta.descricao }}</p>

              <!-- Detalhes adicionais -->
              <div v-if="alerta.email || alerta.ip_address" class="flex flex-wrap gap-3 mb-3 text-sm">
                <div v-if="alerta.email" class="flex items-center gap-1">
                  <UIcon name="i-heroicons-envelope" class="text-gray-400" />
                  <span class="font-mono">{{ alerta.email }}</span>
                </div>
                <div v-if="alerta.ip_address" class="flex items-center gap-1">
                  <UIcon name="i-heroicons-globe-alt" class="text-gray-400" />
                  <code class="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">{{ alerta.ip_address }}</code>
                </div>
              </div>

              <!-- Observações de resolução -->
              <div v-if="alerta.resolvido && alerta.observacoes" class="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg mb-3">
                <p class="text-sm text-green-800 dark:text-green-200">
                  <strong>Resolução:</strong> {{ alerta.observacoes }}
                </p>
                <p class="text-xs text-green-600 dark:text-green-400 mt-1">
                  Resolvido em {{ formatarDataHora(alerta.resolvido_em) }}
                </p>
              </div>

              <!-- Ações -->
              <div class="flex gap-2">
                <UButton
                  v-if="!alerta.lido"
                  icon="i-heroicons-check"
                  label="Marcar como Lido"
                  size="xs"
                  color="gray"
                  variant="outline"
                  @click="marcarComoLido(alerta.id)"
                />
                <UButton
                  v-if="!alerta.resolvido"
                  icon="i-heroicons-check-circle"
                  label="Resolver"
                  size="xs"
                  color="green"
                  variant="outline"
                  @click="abrirModalResolver(alerta)"
                />
                <UButton
                  v-if="alerta.email"
                  icon="i-heroicons-lock-open"
                  label="Desbloquear Email"
                  size="xs"
                  color="primary"
                  variant="outline"
                  @click="desbloquear({ email: alerta.email, tipo: 'email' })"
                />
                <UButton
                  v-if="alerta.ip_address"
                  icon="i-heroicons-lock-open"
                  label="Desbloquear IP"
                  size="xs"
                  color="primary"
                  variant="outline"
                  @click="desbloquear({ ip_address: alerta.ip_address, tipo: 'ip' })"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Paginação -->
      <template #footer v-if="alertas.length > 0">
        <div class="flex justify-between items-center">
          <p class="text-sm text-gray-500">
            Mostrando {{ (currentPage - 1) * pageSize + 1 }} a {{ Math.min(currentPage * pageSize, totalRecords) }} de {{ totalRecords }}
          </p>
          <div class="flex gap-2">
            <UButton 
              icon="i-heroicons-chevron-left" 
              size="sm" 
              color="gray" 
              :disabled="currentPage === 1"
              @click="currentPage--"
            />
            <UButton 
              icon="i-heroicons-chevron-right" 
              size="sm" 
              color="gray" 
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            />
          </div>
        </div>
      </template>
    </UCard>

    <!-- Modal de Resolução -->
    <UModal v-model="modalResolverAberto">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Resolver Alerta</h3>
        </template>

        <div class="space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Adicione observações sobre como este alerta foi resolvido:
          </p>

          <UFormGroup label="Observações" name="observacoes">
            <UTextarea
              v-model="observacoesResolucao"
              placeholder="Ex: Verificado com o usuário. Login era legítimo."
              :rows="4"
            />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              label="Cancelar"
              color="gray"
              variant="outline"
              @click="modalResolverAberto = false"
            />
            <UButton
              label="Resolver"
              color="green"
              icon="i-heroicons-check-circle"
              :loading="resolvendo"
              @click="resolverAlerta"
            />
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, watch, onMounted } from 'vue'
import { format, parseISO } from 'date-fns'

definePageMeta({
  middleware: 'auth-master'
})

const supabase = useSupabaseClient()
const toast = useToast()

// Estado
const alertas = ref<any[]>([])
const loading = ref(false)
const executandoDeteccao = ref(false)
const resolvendo = ref(false)
const totalRecords = ref(0)
const stats = ref<any>({})

// Filtros
const tiposAlerta = ['BLOQUEIO_MULTIPLO', 'IP_SUSPEITO', 'LOGIN_HORARIO_INCOMUM', 'TENTATIVA_FORCA_BRUTA', 'MULTIPLOS_IPS']
const filtroTipo = ref<string | null>(null)
const filtroSeveridade = ref<string | null>(null)
const filtroStatus = ref('Não Lido')
const filtroBusca = ref('')
const pageSize = ref(20)
const currentPage = ref(1)

// Modal de resolução
const modalResolverAberto = ref(false)
const alertaSelecionado = ref<any>(null)
const observacoesResolucao = ref('')

// Buscar alertas
async function buscarAlertas() {
  loading.value = true
  try {
    let query = supabase
      .from('alertas_seguranca')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value - 1)

    if (filtroTipo.value) {
      query = query.eq('tipo', filtroTipo.value)
    }
    if (filtroSeveridade.value) {
      query = query.eq('severidade', filtroSeveridade.value)
    }
    if (filtroStatus.value === 'Não Lido') {
      query = query.eq('lido', false)
    } else if (filtroStatus.value === 'Lido') {
      query = query.eq('lido', true).eq('resolvido', false)
    } else if (filtroStatus.value === 'Pendente') {
      query = query.eq('resolvido', false)
    } else if (filtroStatus.value === 'Resolvido') {
      query = query.eq('resolvido', true)
    }
    if (filtroBusca.value) {
      query = query.or(`email.ilike.%${filtroBusca.value}%,ip_address.ilike.%${filtroBusca.value}%`)
    }

    const { data, error, count } = await query

    if (error) throw error

    alertas.value = data || []
    totalRecords.value = count || 0
  } catch (error: any) {
    console.error('Erro ao buscar alertas:', error)
    toast.add({ title: 'Erro', description: error.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

// Buscar estatísticas
async function buscarEstatisticas() {
  try {
    const { data } = await supabase
      .from('alertas_seguranca')
      .select('lido, resolvido, severidade, created_at, resolvido_em')

    if (data) {
      const naoLidos = data.filter(a => !a.lido).length
      const pendentes = data.filter(a => !a.resolvido).length
      const criticos24h = data.filter(a => 
        a.severidade === 'CRITICA' && 
        new Date(a.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length
      const resolvidos7d = data.filter(a => 
        a.resolvido && 
        a.resolvido_em &&
        new Date(a.resolvido_em) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length

      stats.value = {
        nao_lidos: naoLidos,
        pendentes: pendentes,
        criticos_24h: criticos24h,
        resolvidos_7d: resolvidos7d
      }
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
  }
}

// Executar detecção de alertas
async function executarDeteccao() {
  executandoDeteccao.value = true
  try {
    const { data, error } = await supabase.rpc('executar_deteccao_alertas')

    if (error) throw error

    const result = data[0]
    const total = result.multiplos_bloqueios + result.ips_suspeitos + result.logins_incomuns

    toast.add({
      title: 'Detecção executada',
      description: `${total} novo(s) alerta(s) criado(s)`,
      color: 'green'
    })

    await Promise.all([buscarAlertas(), buscarEstatisticas()])
  } catch (error: any) {
    console.error('Erro ao executar detecção:', error)
    toast.add({ title: 'Erro', description: error.message, color: 'red' })
  } finally {
    executandoDeteccao.value = false
  }
}

// Marcar como lido
async function marcarComoLido(alertaId: number) {
  try {
    const { error } = await supabase.rpc('marcar_alerta_lido', { p_alerta_id: alertaId })

    if (error) throw error

    toast.add({ title: 'Marcado como lido', color: 'green' })
    await Promise.all([buscarAlertas(), buscarEstatisticas()])
  } catch (error: any) {
    console.error('Erro ao marcar como lido:', error)
    toast.add({ title: 'Erro', description: error.message, color: 'red' })
  }
}

// Abrir modal de resolver
function abrirModalResolver(alerta: any) {
  alertaSelecionado.value = alerta
  observacoesResolucao.value = ''
  modalResolverAberto.value = true
}

// Resolver alerta
async function resolverAlerta() {
  if (!alertaSelecionado.value) return

  resolvendo.value = true
  try {
    const { error } = await supabase.rpc('resolver_alerta', {
      p_alerta_id: alertaSelecionado.value.id,
      p_observacoes: observacoesResolucao.value || null
    })

    if (error) throw error

    toast.add({ title: 'Alerta resolvido', color: 'green' })
    modalResolverAberto.value = false
    await Promise.all([buscarAlertas(), buscarEstatisticas()])
  } catch (error: any) {
    console.error('Erro ao resolver alerta:', error)
    toast.add({ title: 'Erro', description: error.message, color: 'red' })
  } finally {
    resolvendo.value = false
  }
}

// Desbloquear (reutiliza função da página rate-limit)
async function desbloquear(item: any) {
  try {
    const response = await $fetch('/api/unblock-ip-or-email', {
      method: 'POST',
      body: {
        email: item.tipo === 'email' ? item.email : null,
        ip: item.tipo === 'ip' ? item.ip_address : null
      }
    })

    toast.add({
      title: 'Desbloqueado',
      description: response.message,
      color: 'green'
    })
  } catch (error: any) {
    console.error('Erro ao desbloquear:', error)
    toast.add({ title: 'Erro', description: error.message, color: 'red' })
  }
}

// Funções auxiliares de estilo
function getAlertaClasses(alerta: any) {
  if (alerta.resolvido) return 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/5'
  if (!alerta.lido) return 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/5'
  return 'border-gray-200 dark:border-gray-700'
}

function getSeveridadeColor(severidade: string) {
  const colors: Record<string, string> = {
    'BAIXA': 'gray',
    'MEDIA': 'amber',
    'ALTA': 'orange',
    'CRITICA': 'red'
  }
  return colors[severidade] || 'gray'
}

function getSeveridadeBgClass(severidade: string) {
  const classes: Record<string, string> = {
    'BAIXA': 'bg-gray-100 dark:bg-gray-800',
    'MEDIA': 'bg-amber-100 dark:bg-amber-900/20',
    'ALTA': 'bg-orange-100 dark:bg-orange-900/20',
    'CRITICA': 'bg-red-100 dark:bg-red-900/20'
  }
  return classes[severidade] || 'bg-gray-100'
}

function getSeveridadeTextClass(severidade: string) {
  const classes: Record<string, string> = {
    'BAIXA': 'text-gray-600 dark:text-gray-400',
    'MEDIA': 'text-amber-600 dark:text-amber-400',
    'ALTA': 'text-orange-600 dark:text-orange-400',
    'CRITICA': 'text-red-600 dark:text-red-400'
  }
  return classes[severidade] || 'text-gray-600'
}

function getTipoIcon(tipo: string) {
  const icons: Record<string, string> = {
    'BLOQUEIO_MULTIPLO': 'i-heroicons-lock-closed',
    'IP_SUSPEITO': 'i-heroicons-shield-exclamation',
    'LOGIN_HORARIO_INCOMUM': 'i-heroicons-clock',
    'TENTATIVA_FORCA_BRUTA': 'i-heroicons-bolt',
    'MULTIPLOS_IPS': 'i-heroicons-globe-alt'
  }
  return icons[tipo] || 'i-heroicons-exclamation-triangle'
}

function limparFiltros() {
  filtroTipo.value = null
  filtroSeveridade.value = null
  filtroStatus.value = 'Não Lido'
  filtroBusca.value = ''
  currentPage.value = 1
}

function formatarDataHora(d: string) {
  if (!d) return '-'
  return format(parseISO(d), 'dd/MM/yyyy HH:mm:ss')
}

// Paginação
const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize.value))

// Watchers
watch([filtroTipo, filtroSeveridade, filtroStatus, filtroBusca], () => {
  currentPage.value = 1
  buscarAlertas()
})

watch(currentPage, () => {
  buscarAlertas()
})

// Inicialização
onMounted(() => {
  buscarAlertas()
  buscarEstatisticas()
})
</script>
