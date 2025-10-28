<template>
  <div class="space-y-8">
    <header>
      <h1 class="text-3xl font-bold mb-2">Sessões Ativas</h1>
      <p class="text-gray-600 dark:text-gray-400">Gerencie sessões de usuários conectados ao sistema</p>
    </header>

    <!-- Estatísticas -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard>
        <div class="flex items-center gap-3">
          <div class="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
            <UIcon name="i-heroicons-user-circle" class="text-2xl text-green-500" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Sessões Ativas</p>
            <p class="text-2xl font-bold">{{ stats.total_ativas || 0 }}</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-3">
          <div class="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <UIcon name="i-heroicons-clock" class="text-2xl text-blue-500" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Sessões Longas (>8h)</p>
            <p class="text-2xl font-bold">{{ stats.longas || 0 }}</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-3">
          <div class="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <UIcon name="i-heroicons-exclamation-triangle" class="text-2xl text-amber-500" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Logout Pendente</p>
            <p class="text-2xl font-bold">{{ stats.logout_pendente || 0 }}</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-3">
          <div class="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
            <UIcon name="i-heroicons-device-phone-mobile" class="text-2xl text-purple-500" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Sessões Mobile</p>
            <p class="text-2xl font-bold">{{ stats.mobile || 0 }}</p>
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
          <div class="flex gap-2">
            <UButton 
              @click="limparFiltros" 
              color="gray" 
              variant="outline" 
              icon="i-heroicons-x-mark"
              label="Limpar"
              size="sm"
            />
            <UButton 
              @click="buscarSessoes" 
              color="primary" 
              variant="outline" 
              icon="i-heroicons-arrow-path"
              label="Atualizar"
              size="sm"
            />
          </div>
        </div>
      </template>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <UFormGroup label="Funcionário" name="funcionario">
          <UInput v-model="filtroNome" placeholder="Nome do funcionário" />
        </UFormGroup>
        
        <UFormGroup label="Perfil" name="perfil">
          <USelectMenu 
            v-model="filtroPerfil" 
            :options="perfisList" 
            value-attribute="nome"
            option-attribute="nome" 
            placeholder="Todos" 
            clearable 
          />
        </UFormGroup>

        <UFormGroup label="Dispositivo" name="dispositivo">
          <USelectMenu 
            v-model="filtroDispositivo" 
            :options="['Desktop', 'Mobile', 'Tablet']" 
            placeholder="Todos" 
            clearable 
          />
        </UFormGroup>

        <UFormGroup label="Status" name="status">
          <USelectMenu 
            v-model="filtroStatus" 
            :options="['Todas', 'Ativas', 'Logout Pendente']" 
          />
        </UFormGroup>
      </div>
    </UCard>

    <!-- Tabela de Sessões -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">Sessões Conectadas</h3>
          <div class="flex items-center gap-2">
            <UBadge 
              v-if="sessoesSelecionadas.length > 0"
              :label="`${sessoesSelecionadas.length} selecionada(s)`" 
              color="primary" 
              variant="subtle" 
            />
            <UButton
              v-if="sessoesSelecionadas.length > 0"
              icon="i-heroicons-arrow-right-on-rectangle"
              label="Forçar Logout em Lote"
              color="red"
              variant="outline"
              size="sm"
              @click="abrirModalLogoutLote"
            />
          </div>
        </div>
      </template>

      <UTable 
        v-model="sessoesSelecionadas"
        :rows="sessoes" 
        :columns="columns" 
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-user-group', label: 'Nenhuma sessão ativa' }"
      >
        <template #nome_completo-data="{ row }">
          <div>
            <p class="font-medium">{{ row.nome_completo }}</p>
            <p class="text-xs text-gray-500">{{ row.email }}</p>
          </div>
        </template>

        <template #perfil_nome-data="{ row }">
          <UBadge :label="row.perfil_nome || 'N/A'" variant="subtle" />
        </template>

        <template #data_login-data="{ row }">
          <div class="text-sm">
            <p>{{ formatarData(row.data_login) }}</p>
            <p class="text-xs text-gray-500">{{ formatarHora(row.data_login) }}</p>
          </div>
        </template>

        <template #tempo_sessao-data="{ row }">
          <span class="text-sm" :class="getTempoCor(row.tempo_sessao)">
            {{ formatarDuracao(row.tempo_sessao) }}
          </span>
        </template>

        <template #dispositivo-data="{ row }">
          <div class="flex items-center gap-2">
            <UIcon 
              :name="getDispositivoIcon(row.dispositivo)" 
              class="text-gray-500" 
            />
            <div class="text-sm">
              <p>{{ row.dispositivo || 'N/A' }}</p>
              <p class="text-xs text-gray-500">{{ row.navegador || '' }}</p>
            </div>
          </div>
        </template>

        <template #ip_address-data="{ row }">
          <code class="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            {{ row.ip_address || 'N/A' }}
          </code>
        </template>

        <template #logout_pendente-data="{ row }">
          <UBadge 
            v-if="row.logout_pendente" 
            label="Pendente" 
            color="amber" 
            variant="subtle" 
            size="xs" 
          />
        </template>

        <template #actions-data="{ row }">
          <UButton
            icon="i-heroicons-arrow-right-on-rectangle"
            color="red"
            variant="ghost"
            size="xs"
            :loading="forcandoLogout === row.user_id"
            :disabled="row.logout_pendente"
            @click="abrirModalLogout(row)"
          />
        </template>
      </UTable>
    </UCard>

    <!-- Modal de Logout Individual -->
    <UModal v-model="modalLogoutAberto">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Forçar Logout</h3>
        </template>

        <div class="space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Você está prestes a encerrar a sessão de:
          </p>

          <div v-if="sessaoSelecionada" class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p class="font-semibold">{{ sessaoSelecionada.nome_completo }}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ sessaoSelecionada.email }}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
              IP: {{ sessaoSelecionada.ip_address }} | {{ sessaoSelecionada.dispositivo }}
            </p>
          </div>

          <UFormGroup label="Motivo (opcional)" name="motivo">
            <UTextarea
              v-model="motivoLogout"
              placeholder="Ex: Sessão suspeita, manutenção de segurança..."
              :rows="3"
            />
          </UFormGroup>

          <div class="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <p class="text-sm text-amber-800 dark:text-amber-200">
              ⚠️ O usuário será desconectado imediatamente e precisará fazer login novamente.
            </p>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              label="Cancelar"
              color="gray"
              variant="outline"
              @click="modalLogoutAberto = false"
            />
            <UButton
              label="Forçar Logout"
              color="red"
              icon="i-heroicons-arrow-right-on-rectangle"
              :loading="forcandoLogout !== null"
              @click="forcarLogout"
            />
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal de Logout em Lote -->
    <UModal v-model="modalLogoutLoteAberto">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Forçar Logout em Lote</h3>
        </template>

        <div class="space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Você está prestes a encerrar <strong>{{ sessoesSelecionadas.length }}</strong> sessão(ões):
          </p>

          <div class="max-h-48 overflow-y-auto space-y-2">
            <div 
              v-for="sessao in sessoesSelecionadas" 
              :key="sessao.user_id"
              class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm"
            >
              <p class="font-semibold">{{ sessao.nome_completo }}</p>
              <p class="text-gray-600 dark:text-gray-400">{{ sessao.email }}</p>
            </div>
          </div>

          <UFormGroup label="Motivo (opcional)" name="motivo">
            <UTextarea
              v-model="motivoLogout"
              placeholder="Ex: Manutenção programada, atualização de segurança..."
              :rows="3"
            />
          </UFormGroup>

          <div class="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <p class="text-sm text-amber-800 dark:text-amber-200">
              ⚠️ Todos os usuários serão desconectados imediatamente.
            </p>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              label="Cancelar"
              color="gray"
              variant="outline"
              @click="modalLogoutLoteAberto = false"
            />
            <UButton
              label="Forçar Logout"
              color="red"
              icon="i-heroicons-arrow-right-on-rectangle"
              :loading="forcandoLogout !== null"
              @click="forcarLogoutLote"
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
const sessoes = ref<any[]>([])
const sessoesSelecionadas = ref<any[]>([])
const loading = ref(false)
const forcandoLogout = ref<string | null>(null)
const stats = ref<any>({})

// Filtros
const perfisList = ref<any[]>([])
const filtroNome = ref('')
const filtroPerfil = ref<string | null>(null)
const filtroDispositivo = ref<string | null>(null)
const filtroStatus = ref('Ativas')

// Modal de logout
const modalLogoutAberto = ref(false)
const modalLogoutLoteAberto = ref(false)
const sessaoSelecionada = ref<any>(null)
const motivoLogout = ref('')

// Colunas
const columns = [
  { key: 'nome_completo', label: 'Funcionário' },
  { key: 'perfil_nome', label: 'Perfil' },
  { key: 'loja_nome', label: 'Loja' },
  { key: 'data_login', label: 'Login' },
  { key: 'tempo_sessao', label: 'Duração' },
  { key: 'dispositivo', label: 'Dispositivo' },
  { key: 'ip_address', label: 'IP' },
  { key: 'logout_pendente', label: 'Status' },
  { key: 'actions', label: '' }
]

// Buscar sessões
async function buscarSessoes() {
  loading.value = true
  try {
    let query = supabase
      .from('vw_sessoes_ativas')
      .select('*')
      .order('data_login', { ascending: false })

    if (filtroNome.value) {
      query = query.ilike('nome_completo', `%${filtroNome.value}%`)
    }
    if (filtroPerfil.value) {
      query = query.eq('perfil_nome', filtroPerfil.value)
    }
    if (filtroDispositivo.value) {
      query = query.eq('dispositivo', filtroDispositivo.value)
    }
    if (filtroStatus.value === 'Logout Pendente') {
      query = query.eq('logout_pendente', true)
    }

    const { data, error } = await query

    if (error) throw error

    sessoes.value = data || []
    calcularEstatisticas()
  } catch (error: any) {
    console.error('Erro ao buscar sessões:', error)
    toast.add({ title: 'Erro', description: error.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

// Calcular estatísticas
function calcularEstatisticas() {
  const total = sessoes.value.length
  const longas = sessoes.value.filter(s => {
    const match = s.tempo_sessao?.match(/(\d+):(\d+):(\d+)/)
    if (match) {
      const horas = parseInt(match[1])
      return horas >= 8
    }
    return false
  }).length
  const logoutPendente = sessoes.value.filter(s => s.logout_pendente).length
  const mobile = sessoes.value.filter(s => s.dispositivo === 'Mobile').length

  stats.value = {
    total_ativas: total,
    longas: longas,
    logout_pendente: logoutPendente,
    mobile: mobile
  }
}

// Abrir modal de logout
function abrirModalLogout(sessao: any) {
  sessaoSelecionada.value = sessao
  motivoLogout.value = ''
  modalLogoutAberto.value = true
}

// Abrir modal de logout em lote
function abrirModalLogoutLote() {
  motivoLogout.value = ''
  modalLogoutLoteAberto.value = true
}

// Forçar logout individual
async function forcarLogout() {
  if (!sessaoSelecionada.value) return

  forcandoLogout.value = sessaoSelecionada.value.user_id
  try {
    const { error } = await supabase.rpc('forcar_logout_usuario', {
      p_user_id: sessaoSelecionada.value.user_id,
      p_motivo: motivoLogout.value || null
    })

    if (error) throw error

    toast.add({
      title: 'Logout forçado',
      description: `Sessão de ${sessaoSelecionada.value.nome_completo} será encerrada`,
      color: 'green'
    })

    modalLogoutAberto.value = false
    sessaoSelecionada.value = null
    await buscarSessoes()
  } catch (error: any) {
    console.error('Erro ao forçar logout:', error)
    toast.add({ title: 'Erro', description: error.message, color: 'red' })
  } finally {
    forcandoLogout.value = null
  }
}

// Forçar logout em lote
async function forcarLogoutLote() {
  if (sessoesSelecionadas.value.length === 0) return

  forcandoLogout.value = 'batch'
  try {
    const userIds = sessoesSelecionadas.value.map(s => s.user_id)
    
    const { error } = await supabase.rpc('forcar_logout_multiplos', {
      p_user_ids: userIds,
      p_motivo: motivoLogout.value || null
    })

    if (error) throw error

    toast.add({
      title: 'Logout forçado',
      description: `${sessoesSelecionadas.value.length} sessão(ões) serão encerradas`,
      color: 'green'
    })

    modalLogoutLoteAberto.value = false
    sessoesSelecionadas.value = []
    await buscarSessoes()
  } catch (error: any) {
    console.error('Erro ao forçar logout em lote:', error)
    toast.add({ title: 'Erro', description: error.message, color: 'red' })
  } finally {
    forcandoLogout.value = null
  }
}

// Funções auxiliares
function limparFiltros() {
  filtroNome.value = ''
  filtroPerfil.value = null
  filtroDispositivo.value = null
  filtroStatus.value = 'Ativas'
}

function formatarData(d: string) {
  if (!d) return '-'
  return format(parseISO(d), 'dd/MM/yyyy')
}

function formatarHora(d: string) {
  if (!d) return '-'
  return format(parseISO(d), 'HH:mm:ss')
}

function formatarDuracao(duracao: string) {
  if (!duracao) return '-'
  const match = duracao.match(/(\d+):(\d+):(\d+)/)
  if (match) {
    const horas = parseInt(match[1])
    const minutos = parseInt(match[2])
    if (horas > 0) return `${horas}h ${minutos}m`
    return `${minutos}m`
  }
  return duracao
}

function getTempoCor(duracao: string) {
  const match = duracao?.match(/(\d+):(\d+):(\d+)/)
  if (match) {
    const horas = parseInt(match[1])
    if (horas >= 12) return 'text-red-600 dark:text-red-400 font-semibold'
    if (horas >= 8) return 'text-amber-600 dark:text-amber-400'
  }
  return 'text-gray-700 dark:text-gray-300'
}

function getDispositivoIcon(dispositivo: string) {
  if (dispositivo === 'Mobile') return 'i-heroicons-device-phone-mobile'
  if (dispositivo === 'Tablet') return 'i-heroicons-device-tablet'
  return 'i-heroicons-computer-desktop'
}

// Watchers
watch([filtroNome, filtroPerfil, filtroDispositivo, filtroStatus], () => {
  buscarSessoes()
})

// Inicialização
onMounted(async () => {
  // Busca perfis para filtro
  const { data: perfis } = await supabase
    .from('perfis')
    .select('id, nome')
    .order('nome')
  perfisList.value = perfis || []

  // Busca sessões
  await buscarSessoes()

  // Auto-refresh a cada 30 segundos
  setInterval(buscarSessoes, 30000)
})
</script>
