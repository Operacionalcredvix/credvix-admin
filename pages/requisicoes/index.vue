<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Requisições Internas
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          Gerenciamento de solicitações entre lojas e setores
        </p>
      </div>
      
      <UButton
        icon="i-heroicons-plus"
        size="lg"
        @click="navigateTo('/requisicoes/nova')"
      >
        Nova Requisição
      </UButton>
    </div>

    <!-- Filtros -->
    <UCard>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Busca -->
        <div class="md:col-span-2">
          <UInput
            v-model="filtros.busca"
            icon="i-heroicons-magnifying-glass"
            placeholder="Buscar por número, título ou descrição..."
            @input="buscarRequisicoes"
          />
        </div>

        <!-- Status -->
        <USelectMenu
          v-model="filtros.status"
          :options="statusOptions"
          placeholder="Todos os Status"
          @change="buscarRequisicoes"
        />

        <!-- Setor -->
        <USelectMenu
          v-model="filtros.setor"
          :options="setorOptions"
          placeholder="Todos os Setores"
          @change="buscarRequisicoes"
        />
      </div>

      <!-- Filtros Adicionais -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        <!-- Prioridade -->
        <USelectMenu
          v-model="filtros.prioridade"
          :options="prioridadeOptions"
          placeholder="Todas as Prioridades"
          @change="buscarRequisicoes"
        />

        <!-- Categoria -->
        <USelectMenu
          v-model="filtros.categoria"
          :options="categoriaOptions"
          placeholder="Todas as Categorias"
          @change="buscarRequisicoes"
        />

        <!-- Período -->
        <USelectMenu
          v-model="filtros.periodo"
          :options="periodoOptions"
          placeholder="Todo o Período"
          @change="buscarRequisicoes"
        />

        <!-- Botão Limpar -->
        <UButton
          color="gray"
          variant="outline"
          icon="i-heroicons-x-mark"
          @click="limparFiltros"
        >
          Limpar Filtros
        </UButton>
      </div>
    </UCard>

    <!-- Cards de Resumo -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Total</p>
            <p class="text-2xl font-bold">{{ resumo.total }}</p>
          </div>
          <UIcon name="i-heroicons-clipboard-document-list" class="w-8 h-8 text-blue-500" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Pendentes</p>
            <p class="text-2xl font-bold">{{ resumo.pendentes }}</p>
          </div>
          <UIcon name="i-heroicons-clock" class="w-8 h-8 text-yellow-500" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Em Atraso</p>
            <p class="text-2xl font-bold text-red-600">{{ resumo.atrasadas }}</p>
          </div>
          <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-red-500" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Concluídas</p>
            <p class="text-2xl font-bold text-green-600">{{ resumo.concluidas }}</p>
          </div>
          <UIcon name="i-heroicons-check-circle" class="w-8 h-8 text-green-500" />
        </div>
      </UCard>
    </div>

    <!-- Lista Responsiva (Mobile) -->
    <div class="md:hidden space-y-4">
      <!-- Filtros Compactos Mobile -->
      <div class="flex gap-2 overflow-x-auto pb-2">
        <UButton
          v-for="s in [null, ...STATUS_REQUISICAO]"
          :key="s || 'todos'"
          size="xs"
          :color="filtros.status === s ? 'primary' : 'gray'"
          :variant="filtros.status === s ? 'solid' : 'outline'"
          @click="filtros.status = s; buscarRequisicoes()"
        >
          {{ s || 'Todos' }}
        </UButton>
      </div>

      <div v-if="carregando" class="flex justify-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-primary" />
      </div>

      <CardRequisicao
        v-for="r in requisicoes"
        :key="r.id"
        :req="r"
        @click="verRequisicao(r.id)"
      />
      
      <div v-if="!carregando && requisicoes.length === 0" class="text-center text-sm text-gray-500 py-8">
        <UIcon name="i-heroicons-inbox" class="w-12 h-12 mx-auto mb-2 text-gray-400" />
        <p>Nenhuma requisição encontrada</p>
      </div>
    </div>

    <!-- Tabela de Requisições (Desktop) -->
    <UCard class="hidden md:block">
      <UTable
        :rows="requisicoes"
        :columns="colunas"
        :loading="carregando"
        :empty-state="{ icon: 'i-heroicons-inbox', label: 'Nenhuma requisição encontrada' }"
      >
        <!-- Coluna: Número -->
        <template #numero_requisicao-data="{ row }">
          <div class="font-mono font-semibold text-primary-600 dark:text-primary-400">
            {{ row.numero_requisicao }}
          </div>
        </template>

        <!-- Coluna: Status -->
        <template #status-data="{ row }">
          <RequisicaoStatusBadge :status="row.status" />
        </template>

        <!-- Coluna: Prioridade -->
        <template #prioridade-data="{ row }">
          <RequisicaoPrioridadeBadge :prioridade="row.prioridade_final || row.prioridade_sugerida" size="xs" />
        </template>

        <!-- Coluna: Setor -->
        <template #setor_destino-data="{ row }">
          <div class="flex items-center gap-2">
            <UIcon :name="getSetorIcon(row.setor_destino)" class="w-4 h-4" />
            <span>{{ row.setor_destino }}</span>
          </div>
        </template>

        <!-- Coluna: SLA -->
        <template #sla-data="{ row }">
          <div v-if="row.status === 'Aceita' && row.prazo_final" class="text-sm">
            <span
              :class="row.em_atraso ? 'text-red-600 font-semibold' : 'text-gray-600'"
            >
              {{ formatarSLA(row.horas_restantes_sla) }}
            </span>
          </div>
          <span v-else class="text-gray-400">-</span>
        </template>

        <!-- Coluna: Data -->
        <template #data_criacao-data="{ row }">
          <div class="text-sm text-gray-600">
            {{ formatarData(row.data_criacao) }}
          </div>
        </template>

        <!-- Coluna: Ações -->
        <template #actions-data="{ row }">
          <UButton
            icon="i-heroicons-eye"
            size="xs"
            color="gray"
            variant="ghost"
            @click="verRequisicao(row.id)"
          />
        </template>
      </UTable>
    </UCard>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  STATUS_COLORS, 
  PRIORIDADE_COLORS, 
  SETOR_ICONS,
  STATUS_REQUISICAO,
  SETORES_DESTINO,
  PRIORIDADES,
  CATEGORIAS_REQUISICAO
} from '~/types/requisicoes';
import { useRequisicoesRealtime } from '~/composables/useRequisicoesRealtime';
const { profile } = useProfile();

definePageMeta({
  middleware: 'auth'
});

const supabase = useSupabaseClient();
const toast = useToast();
const router = useRouter();

// --- ESTADO ---
const carregando = ref(false);
const requisicoes = ref([]);
const filtros = ref({
  busca: '',
  status: null,
  setor: null,
  prioridade: null,
  categoria: null,
  periodo: 'todos'
});

// --- COLUNAS ---
const colunas = [
  { key: 'numero_requisicao', label: 'Número' },
  { key: 'titulo', label: 'Título' },
  { key: 'status', label: 'Status' },
  { key: 'prioridade', label: 'Prioridade' },
  { key: 'setor_destino', label: 'Setor' },
  { key: 'solicitante_nome', label: 'Solicitante' },
  { key: 'loja_nome', label: 'Loja' },
  { key: 'sla', label: 'SLA' },
  { key: 'data_criacao', label: 'Criada em' },
  { key: 'actions', label: '' }
];

// --- OPTIONS ---
const statusOptions = computed(() => [
  { label: 'Todos os Status', value: null },
  ...STATUS_REQUISICAO.map(s => ({ label: s, value: s }))
]);

const setorOptions = computed(() => [
  { label: 'Todos os Setores', value: null },
  ...SETORES_DESTINO.map(s => ({ label: s, value: s }))
]);

const prioridadeOptions = computed(() => [
  { label: 'Todas as Prioridades', value: null },
  ...PRIORIDADES.map(p => ({ label: p, value: p }))
]);

const categoriaOptions = computed(() => [
  { label: 'Todas as Categorias', value: null },
  ...CATEGORIAS_REQUISICAO.map(c => ({ label: c, value: c }))
]);

const periodoOptions = [
  { label: 'Todo o Período', value: 'todos' },
  { label: 'Últimos 7 dias', value: '7dias' },
  { label: 'Últimos 30 dias', value: '30dias' },
  { label: 'Últimos 90 dias', value: '90dias' }
];

// --- RESUMO ---
const resumo = computed(() => {
  return {
    total: requisicoes.value.length,
    pendentes: requisicoes.value.filter(r => 
      ['Nova', 'Em Análise', 'Aceita', 'Necessita Informação', 'Devolvida'].includes(r.status)
    ).length,
    atrasadas: requisicoes.value.filter(r => r.em_atraso).length,
    concluidas: requisicoes.value.filter(r => r.status === 'Concluída').length
  };
});

// --- FUNÇÕES ---
async function buscarRequisicoes() {
  carregando.value = true;
  try {
    let query = supabase
      .from('vw_requisicoes_completas')
      .select('*')
      .order('data_criacao', { ascending: false });

    // Filtro de busca
    if (filtros.value.busca) {
      query = query.or(`numero_requisicao.ilike.%${filtros.value.busca}%,titulo.ilike.%${filtros.value.busca}%`);
    }

    // Filtro de status
    if (filtros.value.status) {
      query = query.eq('status', filtros.value.status);
    }

    // Filtro de setor
    if (filtros.value.setor) {
      query = query.eq('setor_destino', filtros.value.setor);
    }

    // Filtro de prioridade
    if (filtros.value.prioridade) {
      query = query.or(`prioridade_final.eq.${filtros.value.prioridade},prioridade_sugerida.eq.${filtros.value.prioridade}`);
    }

    // Filtro de categoria
    if (filtros.value.categoria) {
      query = query.eq('categoria', filtros.value.categoria);
    }

    // Filtro de período
    if (filtros.value.periodo !== 'todos') {
      const dias = parseInt(filtros.value.periodo);
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - dias);
      query = query.gte('data_criacao', dataLimite.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    requisicoes.value = data || [];
  } catch (error) {
    console.error('[Requisições] Erro ao buscar:', error);
    toast.add({
      title: 'Erro ao carregar requisições',
      description: error.message,
      color: 'red'
    });
  } finally {
    carregando.value = false;
  }
}

function limparFiltros() {
  filtros.value = {
    busca: '',
    status: null,
    setor: null,
    prioridade: null,
    categoria: null,
    periodo: 'todos'
  };
  buscarRequisicoes();
}

function verRequisicao(id) {
  router.push(`/requisicoes/${id}`);
}

// --- HELPERS ---
function getStatusColor(status) {
  return STATUS_COLORS[status] || 'gray';
}

function getPrioridadeColor(prioridade) {
  return PRIORIDADE_COLORS[prioridade] || 'gray';
}

function getSetorIcon(setor) {
  return SETOR_ICONS[setor] || 'i-heroicons-building-office';
}

function formatarData(data) {
  if (!data) return '-';
  return format(new Date(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

function formatarSLA(horas) {
  if (horas === null || horas === undefined) return '-';
  
  if (horas < 0) {
    const horasAtrasadas = Math.abs(horas);
    if (horasAtrasadas < 24) {
      return `Atrasada ${Math.floor(horasAtrasadas)}h`;
    }
    return `Atrasada ${Math.floor(horasAtrasadas / 24)} dias`;
  }
  
  if (horas < 24) {
    return `${Math.floor(horas)}h restantes`;
  }
  return `${Math.floor(horas / 24)} dias restantes`;
}

// --- LIFECYCLE ---
onMounted(() => {
  buscarRequisicoes();
  // Realtime updates com notificações ricas
  const { subscribe } = useRequisicoesRealtime();
  const unsubscribe = subscribe((payload) => {
    // Atualiza lista sempre
    buscarRequisicoes();
    try {
      const me = profile?.value?.id;
      if (!me || !payload) return;
      const table = payload.table || payload?.ids?.table;
      if (table === 'requisicoes') {
        const row = payload.new || payload.old;
        if (!row) return;
        if (row.solicitante_id === me || row.responsavel_id === me) {
          if (payload.eventType === 'UPDATE' && payload.new) {
            if (payload.old?.status !== payload.new.status) {
              toast.add({ 
                title: row.numero_requisicao || 'Requisição',
                description: `Status atualizado: ${payload.new.status}`,
                color: 'blue',
                timeout: 5000,
                actions: [{
                  label: 'Ver Detalhes',
                  click: () => router.push(`/requisicoes/${row.id}`)
                }]
              });
            }
          }
          if (payload.eventType === 'INSERT') {
            toast.add({ 
              title: 'Nova Requisição',
              description: `${row.numero_requisicao || row.titulo}`,
              color: 'green',
              timeout: 5000,
              actions: [{
                label: 'Ver',
                click: () => router.push(`/requisicoes/${row.id}`)
              }]
            });
          }
        }
      }
      if (table === 'requisicoes_comentarios') {
        const c = payload.new;
        if (c && c.autor_id !== me) {
          toast.add({ 
            title: 'Novo Comentário',
            description: 'Uma requisição que você acompanha recebeu um comentário',
            color: 'cyan',
            timeout: 5000,
            actions: [{
              label: 'Ver',
              click: () => router.push(`/requisicoes/${c.requisicao_id}`)
            }]
          });
        }
      }
    } catch {}
  });
  onUnmounted(() => unsubscribe && unsubscribe());
});
</script>
