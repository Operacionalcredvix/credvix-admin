<template>
  <div class="space-y-8">
    <header>
      <h1 class="text-3xl font-bold mb-2">Rate Limit - Tentativas de Login</h1>
      <p class="text-gray-600 dark:text-gray-400">Monitoramento de tentativas de login e bloqueios por força bruta</p>
    </header>

    <!-- Estatísticas -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard>
        <div class="flex items-center gap-3">
          <div class="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
            <UIcon name="i-heroicons-shield-exclamation" class="text-2xl text-red-500" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Tentativas Falhas (24h)</p>
            <p class="text-2xl font-bold">{{ stats.falhas_24h || 0 }}</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-3">
          <div class="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
            <UIcon name="i-heroicons-check-circle" class="text-2xl text-green-500" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Sucessos (24h)</p>
            <p class="text-2xl font-bold">{{ stats.sucessos_24h || 0 }}</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-3">
          <div class="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <UIcon name="i-heroicons-exclamation-triangle" class="text-2xl text-amber-500" />
          </div>
          <div>
            <p class="text-sm text-gray-500">IPs Bloqueados</p>
            <p class="text-2xl font-bold">{{ stats.ips_bloqueados || 0 }}</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-3">
          <div class="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <UIcon name="i-heroicons-user-group" class="text-2xl text-blue-500" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Emails Bloqueados</p>
            <p class="text-2xl font-bold">{{ stats.emails_bloqueados || 0 }}</p>
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
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UFormGroup label="Email" name="email">
          <UInput v-model="filtroEmail" placeholder="Ex: usuario@exemplo.com" />
        </UFormGroup>
        
        <UFormGroup label="IP" name="ip">
          <UInput v-model="filtroIP" placeholder="Ex: 192.168.1.1" />
        </UFormGroup>

        <UFormGroup label="Status" name="status">
          <USelectMenu 
            v-model="filtroStatus" 
            :options="['Todos', 'Sucesso', 'Falha']" 
            placeholder="Todos" 
          />
        </UFormGroup>
      </div>
    </UCard>

    <!-- Seção de IPs/Emails Bloqueados -->
    <UCard v-if="bloqueados.length > 0">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-lock-closed" class="text-red-500" />
            <h3 class="font-semibold">IPs e Emails Atualmente Bloqueados</h3>
          </div>
          <UBadge :label="`${bloqueados.length} bloqueado(s)`" color="red" variant="subtle" />
        </div>
      </template>

      <div class="space-y-3">
        <div 
          v-for="item in bloqueados" 
          :key="item.email + item.ip_address"
          class="flex items-center justify-between p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10"
        >
          <div class="flex items-center gap-4">
            <div class="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
              <UIcon 
                :name="item.tipo === 'email' ? 'i-heroicons-envelope' : 'i-heroicons-globe-alt'" 
                class="text-red-600 dark:text-red-400" 
              />
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-gray-100">
                {{ item.tipo === 'email' ? item.email : item.ip_address }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ item.tentativas }} tentativa(s) falha(s) • Última: {{ formatarData(item.ultima_tentativa) }} às {{ formatarHora(item.ultima_tentativa) }}
              </p>
            </div>
          </div>
          <UButton
            icon="i-heroicons-lock-open"
            color="red"
            variant="outline"
            label="Desbloquear"
            size="sm"
            :loading="desbloqueando === (item.tipo === 'email' ? item.email : item.ip_address)"
            @click="desbloquear(item)"
          />
        </div>
      </div>
    </UCard>

    <!-- Tabela -->
    <UCard>
      <template #header>
        <h3 class="font-semibold">Tentativas Recentes</h3>
      </template>

      <UTable 
        :rows="tentativas" 
        :columns="columns" 
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-magnifying-glass', label: 'Nenhuma tentativa encontrada.' }"
      >
        <template #email-data="{ row }">
          <span class="font-mono text-sm">{{ row.email }}</span>
        </template>

        <template #ip_address-data="{ row }">
          <code class="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            {{ row.ip_address }}
          </code>
        </template>

        <template #sucesso-data="{ row }">
          <UBadge 
            :label="row.sucesso ? 'Sucesso' : 'Falha'" 
            :color="row.sucesso ? 'green' : 'red'" 
            variant="subtle" 
            size="xs" 
          />
        </template>

        <template #tentativa_em-data="{ row }">
          <div class="text-sm">
            <p>{{ formatarData(row.tentativa_em) }}</p>
            <p class="text-xs text-gray-500">{{ formatarHora(row.tentativa_em) }}</p>
          </div>
        </template>
      </UTable>

      <template #footer>
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
const tentativas = ref<any[]>([])
const bloqueados = ref<any[]>([])
const loading = ref(false)
const desbloqueando = ref<string | null>(null)
const totalRecords = ref(0)
const stats = ref<any>({})

// Filtros
const filtroEmail = ref('')
const filtroIP = ref('')
const filtroStatus = ref('Todos')
const pageSize = ref(50)
const currentPage = ref(1)

// Colunas
const columns = [
  { key: 'email', label: 'Email' },
  { key: 'ip_address', label: 'IP' },
  { key: 'sucesso', label: 'Status' },
  { key: 'tentativa_em', label: 'Data/Hora' }
]

// Buscar dados
async function buscarTentativas() {
  loading.value = true
  try {
    let query = supabase
      .from('tentativas_login')
      .select('*', { count: 'exact' })
      .order('tentativa_em', { ascending: false })
      .range((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value - 1)

    if (filtroEmail.value) {
      query = query.ilike('email', `%${filtroEmail.value}%`)
    }
    if (filtroIP.value) {
      query = query.ilike('ip_address', `%${filtroIP.value}%`)
    }
    if (filtroStatus.value !== 'Todos') {
      query = query.eq('sucesso', filtroStatus.value === 'Sucesso')
    }

    const { data, error, count } = await query

    if (error) throw error

    tentativas.value = data || []
    totalRecords.value = count || 0
  } catch (error: any) {
    console.error('Erro ao buscar tentativas:', error)
  } finally {
    loading.value = false
  }
}

// Buscar estatísticas
async function buscarEstatisticas() {
  try {
    // Últimas 24h
    const { data } = await supabase
      .from('tentativas_login')
      .select('sucesso, email, ip_address')
      .gte('tentativa_em', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (data) {
      const falhas = data.filter(t => !t.sucesso)
      const sucessos = data.filter(t => t.sucesso)
      
      stats.value = {
        falhas_24h: falhas.length,
        sucessos_24h: sucessos.length,
        ips_bloqueados: new Set(falhas.map(t => t.ip_address)).size,
        emails_bloqueados: new Set(falhas.map(t => t.email)).size
      }
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
  }
}

// Buscar IPs e emails bloqueados
async function buscarBloqueados() {
  try {
    // Busca tentativas falhas nos últimos 15 minutos
    const { data } = await supabase
      .from('tentativas_login')
      .select('email, ip_address, tentativa_em')
      .eq('sucesso', false)
      .gte('tentativa_em', new Date(Date.now() - 15 * 60 * 1000).toISOString())
      .order('tentativa_em', { ascending: false })

    if (data) {
      // Agrupa por email e IP
      const emailMap = new Map<string, any>()
      const ipMap = new Map<string, any>()

      data.forEach(t => {
        // Agrupa por email
        if (!emailMap.has(t.email)) {
          emailMap.set(t.email, { 
            email: t.email, 
            tentativas: 0, 
            ultima_tentativa: t.tentativa_em,
            tipo: 'email'
          })
        }
        const emailEntry = emailMap.get(t.email)
        emailEntry.tentativas++
        if (new Date(t.tentativa_em) > new Date(emailEntry.ultima_tentativa)) {
          emailEntry.ultima_tentativa = t.tentativa_em
        }

        // Agrupa por IP
        if (!ipMap.has(t.ip_address)) {
          ipMap.set(t.ip_address, { 
            ip_address: t.ip_address, 
            tentativas: 0, 
            ultima_tentativa: t.tentativa_em,
            tipo: 'ip'
          })
        }
        const ipEntry = ipMap.get(t.ip_address)
        ipEntry.tentativas++
        if (new Date(t.tentativa_em) > new Date(ipEntry.ultima_tentativa)) {
          ipEntry.ultima_tentativa = t.tentativa_em
        }
      })

      // Filtra apenas bloqueados (5 ou mais tentativas)
      const emailsBloqueados = Array.from(emailMap.values()).filter(e => e.tentativas >= 5)
      const ipsBloqueados = Array.from(ipMap.values()).filter(i => i.tentativas >= 5)

      bloqueados.value = [...emailsBloqueados, ...ipsBloqueados]
    }
  } catch (error) {
    console.error('Erro ao buscar bloqueados:', error)
  }
}

// Desbloquear IP ou email
async function desbloquear(item: any) {
  try {
    desbloqueando.value = item.tipo === 'email' ? item.email : item.ip_address
    
    const response = await $fetch('/api/unblock-ip-or-email', {
      method: 'POST',
      body: {
        email: item.tipo === 'email' ? item.email : null,
        ip: item.tipo === 'ip' ? item.ip_address : null
      }
    })

    toast.add({
      title: 'Desbloqueado com sucesso',
      description: response.message,
      color: 'green'
    })

    // Atualiza as listas
    await Promise.all([
      buscarBloqueados(),
      buscarTentativas(),
      buscarEstatisticas()
    ])
  } catch (error: any) {
    console.error('Erro ao desbloquear:', error)
    toast.add({
      title: 'Erro ao desbloquear',
      description: error.message || 'Ocorreu um erro',
      color: 'red'
    })
  } finally {
    desbloqueando.value = null
  }
}

// Paginação
const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize.value))

// Funções auxiliares
function limparFiltros() {
  filtroEmail.value = ''
  filtroIP.value = ''
  filtroStatus.value = 'Todos'
  currentPage.value = 1
}

function formatarData(d: string) {
  if (!d) return '-'
  return format(parseISO(d), 'dd/MM/yyyy')
}

function formatarHora(d: string) {
  if (!d) return '-'
  return format(parseISO(d), 'HH:mm:ss')
}

// Watchers
watch([filtroEmail, filtroIP, filtroStatus], () => {
  currentPage.value = 1
  buscarTentativas()
})

watch(currentPage, () => {
  buscarTentativas()
})

// Inicialização
onMounted(() => {
  buscarTentativas()
  buscarEstatisticas()
  buscarBloqueados()
})
</script>
