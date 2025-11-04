<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold">Auditoria de Requisições</h1>
        <p class="text-gray-600 dark:text-gray-400">Log completo de todas as ações realizadas no sistema</p>
      </div>
    </div>

    <!-- Filtros -->
    <UCard>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <UFormGroup label="Requisição (Número)">
          <UInput v-model="filtros.numero_requisicao" placeholder="REQ-2025-0001" icon="i-heroicons-magnifying-glass" />
        </UFormGroup>

        <UFormGroup label="Usuário">
          <USelectMenu
            v-model="filtros.usuario_id"
            :options="usuariosOpcoes"
            value-attribute="value"
            option-attribute="label"
            placeholder="Todos"
            searchable
          >
            <template #label="{ selected }">
              <span>{{ selected?.label || 'Todos os usuários' }}</span>
            </template>
          </USelectMenu>
        </UFormGroup>

        <UFormGroup label="Ação">
          <USelectMenu
            v-model="filtros.acao"
            :options="acoesOpcoes"
            value-attribute="value"
            option-attribute="label"
            placeholder="Todas"
          >
            <template #label="{ selected }">
              <span>{{ selected?.label || 'Todas as ações' }}</span>
            </template>
          </USelectMenu>
        </UFormGroup>

        <UFormGroup label="Período">
          <USelectMenu
            v-model="filtros.periodo"
            :options="periodosOpcoes"
            value-attribute="value"
            option-attribute="label"
          >
            <template #label="{ selected }">
              <span>{{ selected?.label || 'Últimos 7 dias' }}</span>
            </template>
          </USelectMenu>
        </UFormGroup>
      </div>

      <div class="flex items-center justify-between mt-4">
        <div class="text-sm text-gray-500">
          {{ totalRegistros }} registro(s) encontrado(s)
        </div>
        <div class="flex gap-2">
          <UButton icon="i-heroicons-arrow-path" size="sm" @click="buscarLogs" :loading="carregando">
            Buscar
          </UButton>
          <UButton icon="i-heroicons-x-mark" size="sm" color="gray" variant="ghost" @click="limparFiltros">
            Limpar
          </UButton>
          <UButton icon="i-heroicons-arrow-down-tray" size="sm" color="green" variant="outline" @click="exportarCSV">
            Exportar CSV
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Tabela -->
    <UCard>
      <UTable
        :rows="logs"
        :columns="colunas"
        :loading="carregando"
        :empty-state="{ icon: 'i-heroicons-document-text', label: 'Nenhum log encontrado' }"
      >
        <template #data_acao-data="{ row }">
          <div class="text-sm">{{ formatarData(row.data_acao) }}</div>
        </template>

        <template #usuario-data="{ row }">
          <div>
            <div class="font-medium">{{ row.usuario?.nome_completo || 'N/A' }}</div>
            <div class="text-xs text-gray-500">{{ row.usuario?.perfil || '-' }}</div>
          </div>
        </template>

        <template #requisicao-data="{ row }">
          <div>
            <div class="font-mono text-sm text-primary-600 dark:text-primary-400">
              {{ row.requisicao?.numero_requisicao || 'N/A' }}
            </div>
            <div class="text-xs text-gray-500 truncate max-w-xs">
              {{ row.requisicao?.titulo || '-' }}
            </div>
          </div>
        </template>

        <template #acao-data="{ row }">
          <UBadge :color="getAcaoInfo(row.acao).color" size="xs">
            <UIcon :name="getAcaoInfo(row.acao).icon" class="w-3 h-3 mr-1" />
            {{ getAcaoInfo(row.acao).label }}
          </UBadge>
        </template>

        <template #ip_address-data="{ row }">
          <div class="text-xs font-mono text-gray-600 dark:text-gray-400">
            {{ row.ip_address || '-' }}
          </div>
        </template>

        <template #actions-data="{ row }">
          <UButton
            icon="i-heroicons-eye"
            size="xs"
            color="gray"
            variant="ghost"
            @click="abrirDetalhes(row)"
          />
        </template>
      </UTable>

      <!-- Paginação -->
      <div class="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div class="text-sm text-gray-500">
          Página {{ paginaAtual }} de {{ totalPaginas }}
        </div>
        <div class="flex gap-2">
          <UButton
            icon="i-heroicons-chevron-left"
            size="sm"
            color="gray"
            :disabled="paginaAtual === 1"
            @click="paginaAtual--; buscarLogs()"
          />
          <UButton
            icon="i-heroicons-chevron-right"
            size="sm"
            color="gray"
            :disabled="paginaAtual === totalPaginas"
            @click="paginaAtual++; buscarLogs()"
          />
        </div>
      </div>
    </UCard>

    <!-- Modal de Detalhes -->
    <UModal v-model="modalDetalhesAberto">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-information-circle" class="w-5 h-5" />
            <span class="font-semibold">Detalhes do Log</span>
          </div>
        </template>

        <div v-if="logSelecionado" class="space-y-4">
          <div>
            <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Usuário</label>
            <p class="font-medium">{{ logSelecionado.usuario?.nome_completo || 'N/A' }}</p>
            <p class="text-xs text-gray-500">{{ logSelecionado.usuario?.email || '-' }}</p>
          </div>

          <div>
            <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Ação</label>
            <div class="mt-1">
              <UBadge :color="getAcaoInfo(logSelecionado.acao).color">
                {{ getAcaoInfo(logSelecionado.acao).label }}
              </UBadge>
            </div>
          </div>

          <div>
            <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Data/Hora</label>
            <p>{{ formatarData(logSelecionado.created_at) }}</p>
          </div>

          <div>
            <label class="text-sm font-medium text-gray-600 dark:text-gray-400">IP</label>
            <p class="font-mono text-sm">{{ logSelecionado.ip_address || '-' }}</p>
          </div>

          <div>
            <label class="text-sm font-medium text-gray-600 dark:text-gray-400">User Agent</label>
            <p class="text-xs text-gray-600 dark:text-gray-400 break-all">
              {{ logSelecionado.user_agent || '-' }}
            </p>
          </div>

          <div v-if="logSelecionado.detalhes && Object.keys(logSelecionado.detalhes).length > 0">
            <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Detalhes (JSON)</label>
            <div class="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs font-mono overflow-auto max-h-96">
              <pre class="whitespace-pre-wrap">{{ JSON.stringify(logSelecionado.detalhes, null, 2) }}</pre>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton color="gray" @click="modalDetalhesAberto = false">Fechar</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ACOES_AUDITORIA } from '~/types/requisicoes'

definePageMeta({ 
  middleware: 'auth',
  // TODO: adicionar check se é Master
})

const supabase = useSupabaseClient()
const toast = useToast()
const { profile } = useProfile()

const carregando = ref(false)
const logs = ref([])
const totalRegistros = ref(0)
const paginaAtual = ref(1)
const itensPorPagina = 50

const usuariosOpcoes = ref([])
const logSelecionado = ref(null)
const modalDetalhesAberto = ref(false)

const filtros = ref({
  numero_requisicao: '',
  usuario_id: null,
  acao: null,
  periodo: '7'
})

const colunas = [
  { key: 'created_at', label: 'Data/Hora', sortable: true },
  { key: 'usuario', label: 'Usuário' },
  { key: 'requisicao', label: 'Requisição' },
  { key: 'acao', label: 'Ação' },
  { key: 'ip_address', label: 'IP' },
  { key: 'actions', label: '' }
]

const acoesOpcoes = Object.entries(ACOES_AUDITORIA).map(([value, info]) => ({
  value,
  label: info.label,
  icon: info.icon
}))

const periodosOpcoes = [
  { value: '1', label: 'Último dia' },
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
  { value: 'all', label: 'Todos os registros' }
]

const totalPaginas = computed(() => Math.ceil(totalRegistros.value / itensPorPagina))

function getAcaoInfo(acao) {
  return ACOES_AUDITORIA[acao] || { label: acao, icon: 'i-heroicons-document', color: 'gray' }
}

function formatarData(data) {
  return data ? format(new Date(data), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR }) : '-'
}

async function buscarLogs() {
  carregando.value = true
  try {
    let query = supabase
      .from('auditoria')
      .select(`
        *,
        usuario:funcionarios!auditoria_autor_id_fkey(nome_completo, email, perfis(nome)),
        requisicao:requisicoes!inner(numero_requisicao, titulo)
      `, { count: 'exact' })
      .eq('entidade', 'requisicao')

    // Filtro por número de requisição
    if (filtros.value.numero_requisicao) {
      const { data: reqData } = await supabase
        .from('requisicoes')
        .select('id')
        .ilike('numero_requisicao', `%${filtros.value.numero_requisicao}%`)
      
      if (reqData && reqData.length > 0) {
        query = query.in('requisicao_id', reqData.map(r => r.id))
      } else {
        logs.value = []
        totalRegistros.value = 0
        return
      }
    }

    // Filtro por usuário
    if (filtros.value.usuario_id) {
      query = query.eq('usuario_id', filtros.value.usuario_id)
    }

    // Filtro por ação
    if (filtros.value.acao) {
      query = query.eq('acao', filtros.value.acao)
    }

    // Filtro por período
    if (filtros.value.periodo !== 'all') {
      const dias = parseInt(filtros.value.periodo)
      const dataInicio = startOfDay(subDays(new Date(), dias))
      query = query.gte('created_at', dataInicio.toISOString())
    }

    // Paginação
    const inicio = (paginaAtual.value - 1) * itensPorPagina
    query = query
      .order('created_at', { ascending: false })
      .range(inicio, inicio + itensPorPagina - 1)

    const { data, error, count } = await query

    if (error) throw error

    logs.value = (data || []).map(log => ({
      ...log,
      usuario: log.usuario ? {
        nome_completo: log.usuario.nome_completo,
        email: log.usuario.email,
        perfil: log.usuario.perfis?.nome || 'N/A'
      } : null,
      requisicao: log.requisicao || null
    }))

    totalRegistros.value = count || 0
  } catch (err) {
    console.error('[Auditoria] Erro ao buscar:', err)
    toast.add({ title: 'Erro ao buscar logs', description: err.message, color: 'red' })
  } finally {
    carregando.value = false
  }
}

async function carregarUsuarios() {
  try {
    // Usa endpoint server para obter lista de funcionários (contorna RLS)
    const tokenResp = await supabase.auth.getSession();
    const token = tokenResp?.data?.session?.access_token || null;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await $fetch('/api/funcionarios/search', { method: 'POST', headers, body: { is_active: true, limit: 2000 } });
    const data = res?.data || [];

    usuariosOpcoes.value = [
      { value: null, label: 'Todos os usuários' },
      ...(data || []).map(u => ({ value: u.id, label: u.nome_completo }))
    ]
  } catch (err) {
    console.error('[Auditoria] Erro ao carregar usuários:', err)
  }
}

function limparFiltros() {
  filtros.value = {
    numero_requisicao: '',
    usuario_id: null,
    acao: null,
    periodo: '7'
  }
  paginaAtual.value = 1
  buscarLogs()
}

function abrirDetalhes(log) {
  logSelecionado.value = log
  modalDetalhesAberto.value = true
}

function exportarCSV() {
  if (logs.value.length === 0) {
    toast.add({ title: 'Nenhum dado para exportar', color: 'orange' })
    return
  }

  const headers = ['Data/Hora', 'Usuário', 'Perfil', 'Requisição', 'Ação', 'IP', 'User Agent']
  const rows = logs.value.map(log => [
    formatarData(log.created_at),
    log.usuario?.nome_completo || 'N/A',
    log.usuario?.perfil || '-',
    log.requisicao?.numero_requisicao || 'N/A',
    getAcaoInfo(log.acao).label,
    log.ip_address || '-',
    log.user_agent || '-'
  ])

  const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `auditoria_requisicoes_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`
  link.click()

  toast.add({ title: 'CSV exportado com sucesso', color: 'green' })
}

onMounted(() => {
  carregarUsuarios()
  buscarLogs()
})
</script>
