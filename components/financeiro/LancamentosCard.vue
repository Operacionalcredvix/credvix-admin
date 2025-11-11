<template>
  <UCard class="mt-6">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Lançamentos</h3>
        <div class="flex items-center gap-3">
          <!-- contador visível para depuração / confirmação de dados -->
          <div class="text-sm text-gray-600">Registros: <strong>{{ lancamentos.length }}</strong></div>
          <div class="text-sm text-gray-500">Total no servidor: <strong>{{ totalCount }}</strong></div>
          <UButton size="sm" color="primary" variant="ghost" @click="refresh">Atualizar</UButton>
        </div>
      </div>
    </template>

    <div class="flex items-center gap-4 mb-4">
      <div>
        <UButton size="sm" color="red" variant="ghost" :pressed="filters.onlyVencidos" @click="toggleOnlyVencidos">Vencidos</UButton>
      </div>
      <div class="w-48">
        <USelect v-model="filters.loja_id" :options="lojasOptions" placeholder="Todas as lojas" clearable selectClass="text-sm text-gray-800 dark:text-gray-100" />
      </div>
      <div class="w-48">
        <USelect v-model="filters.centro_custo_id" :options="centrosOptions" placeholder="Todos os centros" clearable selectClass="text-sm text-gray-800 dark:text-gray-100" />
      </div>
      <div class="w-40">
        <USelect v-model="filters.status" :options="statusOptions" placeholder="Status" clearable selectClass="text-sm text-gray-800 dark:text-gray-100" />
      </div>
      <div>
        <UInput type="date" v-model="filters.date_from" placeholder="De" />
      </div>
      <div>
        <UInput type="date" v-model="filters.date_to" placeholder="Até" />
      </div>
      <div class="ml-auto flex items-center gap-2">
        <UButton color="primary" variant="ghost" @click="applyFilter">Filtrar</UButton>
        <UButton color="gray" variant="ghost" @click="resetFilters">Limpar</UButton>
        <UButton color="gray" variant="ghost" @click="exportCsv">Export CSV</UButton>
      </div>
    </div>

    <div v-if="listError" class="p-4 text-red-500">{{ listError }}</div>

  <UTable class="lancamentos-table" v-else :rows="lancamentos" :columns="columns" :empty-state="{ icon: 'i-heroicons-archive-box-x-mark', label: 'Nenhum lançamento encontrado.' }">
      <template #centro-data="{ row }">
        <div :class="rowHighlightClass(row)">
          <span class="text-sm text-gray-800 dark:text-gray-100">{{ row.centro_display || getCentroName(row) || 'N/D' }}</span>
        </div>
      </template>
      <template #descricao-data="{ row }">
        <div :class="[rowHighlightClass(row), 'text-sm text-gray-800 dark:text-gray-100']">{{ row.descricao }}</div>
      </template>
      <template #vencido-data="{ row }">
        <div>
          <template>
            <span v-if="!row.data_vencimento">-</span>
            <template v-else>
              <UBadge v-if="isOverdue(row)" color="red" :label="overdueLabel(row)" :title="`Vencimento: ${row.data_vencimento} — ${daysDiff(row.data_vencimento)} dia(s) de atraso`" />
              <UBadge v-else-if="isDueSoon(row)" color="yellow" :label="dueSoonLabel(row)" :title="`Vencimento: ${row.data_vencimento}`" />
              <UBadge v-else color="gray" :label="dueInLabel(row)" :title="`Vencimento: ${row.data_vencimento}`" />
            </template>
          </template>
        </div>
      </template>
      <template #status-data="{ row }">
        <div>
          <UBadge v-if="isPaid(row)" color="green" label="Pago" />
          <UBadge v-else-if="row.status === 'cancelado'" color="red" label="Cancelado" />
          <UBadge v-else color="yellow" label="Pendente" />
        </div>
      </template>
      <template #fornecedor-data="{ row }">
        <div :class="['relative', rowHighlightClass(row)]">
          <template v-if="(row.fornecedor_display && String(row.fornecedor_display).trim()) || (getFornecedorName(row) && String(getFornecedorName(row)).trim())">
            <span class="block text-sm text-gray-800 dark:text-gray-100">{{ row.fornecedor_display || getFornecedorName(row) }}</span>
          </template>
          <template v-else>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500">Sem fornecedor</span>
              <UButton size="sm" color="primary" variant="outline" class="ml-2" @click="openEdit(row)">Atribuir</UButton>
            </div>
          </template>
        </div>
      </template>
      <template #loja-data="{ row }">
        <div :class="[rowHighlightClass(row), 'text-sm text-gray-800 dark:text-gray-100']">{{ row.loja_display || getLojaName(row) || 'N/D' }}</div>
      </template>
      <template #data_vencimento-data="{ row }">
        <div :class="[rowHighlightClass(row), 'text-sm text-gray-800 dark:text-gray-100']">{{ formatDate(row.data_vencimento) }}</div>
      </template>
      <template #agendado_para-data="{ row }">
        <div :class="[rowHighlightClass(row), 'text-sm text-gray-800 dark:text-gray-100']">{{ formatDate(row.agendado_para) }}</div>
      </template>
      <template #lancamento-data="{ row }">
        <div :class="[rowHighlightClass(row), 'text-sm text-gray-800 dark:text-gray-100']">{{ formatDate(row.criado_em || row.created_at || row.lancamento) }}</div>
      </template>
      <template #valor-data="{ row }">
        <div :class="[rowHighlightClass(row), 'text-sm text-gray-800 dark:text-gray-100']">{{ formatCurrency(row.valor) }}</div>
      </template>
      <template #acoes-data="{ row }">
        <div class="flex items-center gap-2">
          <UButton v-if="getRowId(row)" size="sm" color="gray" variant="ghost" @click.stop="handleView(row)">Ver</UButton>
          <UButton v-else size="sm" color="gray" variant="ghost" @click.prevent="toast.add({ title: 'Aviso', description: 'Identificador não disponível', color: 'yellow' })">Ver</UButton>
          <UButton v-if="!isPaid(row)" size="sm" color="green" @click="markAsPaid(row)">Marcar Pago</UButton>
          <UButton size="sm" color="primary" @click="openEdit(row)">Editar</UButton>
          <UButton size="sm" color="red" @click="remove(row)">Excluir</UButton>
        </div>
      </template>
    </UTable>

    <div class="flex items-center justify-between mt-4">
      <div class="text-sm text-gray-600">Mostrando até {{ pageSize }} registros — total {{ totalCount }}</div>
    </div>

    <!-- Detalhes movidos para página dedicada; modal removido -->

    <!-- Editor modal -->
    <UModal v-model="isEditOpen">
      <UCard>
        <template #header>
          <h3 class="text-base font-semibold">Editar Lançamento</h3>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm text-gray-600">Descrição</label>
            <UInput v-model="editRow.descricao" />
          </div>
          <div>
            <label class="block text-sm text-gray-600">Valor (R$)</label>
            <UInput v-model.number="editRow.valor" type="number" step="0.01" />
          </div>
          <div>
            <label for="edit_data_vencimento" class="block text-sm text-gray-600">Data de Vencimento</label>
            <UInput id="edit_data_vencimento" v-model="editRow.data_vencimento" type="date" />
          </div>
          <div>
            <label class="block text-sm text-gray-600">Status</label>
            <USelect v-model="editRow.status" :options="statusOptions" selectClass="text-sm text-gray-800 dark:text-gray-100" />
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-4">
          <UButton color="gray" variant="ghost" @click="isEditOpen = false">Cancelar</UButton>
          <UButton :loading="savingEdit" @click="onSaveEdit">Salvar</UButton>
        </div>
      </UCard>
    </UModal>

  </UCard>
</template>

<script setup>
import { ref, reactive, onMounted, watch, toRefs } from 'vue'
// Removed imports for TimelineRequisicao and AuditoriaLog
import { useRouter, isNavigationFailure } from 'vue-router'
const client = useSupabaseClient()
const toast = useToast()

const router = useRouter()

const props = defineProps({
  lojasOptions: { type: Array, default: () => [] },
  centrosOptions: { type: Array, default: () => [] },
  fornecedoresOptions: { type: Array, default: () => [] },
  planosOptions: { type: Array, default: () => [] }
})

// Expor vinculações de propriedades para uso em modelos.
const { lojasOptions, centrosOptions, fornecedoresOptions, planosOptions } = toRefs(props)

const lancamentos = ref([])

const filters = reactive({ loja_id: null, centro_custo_id: null, status: null, date_from: null, date_to: null, onlyVencidos: false })
const page = ref(1)
const pageSize = ref(15)
const totalCount = ref(0)
const listError = ref(null)
// Exibir apenas as colunas básicas no cartão; abrir modal de detalhes para visualização/edição completa.
const columns = [
  { key: 'descricao', label: 'Descrição' },
  { key: 'fornecedor', label: 'Fornecedor' },
  { key: 'valor', label: 'Valor' },
  { key: 'data_vencimento', label: 'Vencimento' },
  { key: 'status', label: 'Status' },
  { key: 'acoes', label: 'Ações' }
]

const statusOptions = [{ label: 'Todos', value: null }, { label: 'Pendente', value: 'pendente' }, { label: 'Pago', value: 'pago' }, { label: 'Cancelado', value: 'cancelado' }]


const formatDate = (d) => { if (!d) return 'N/A'; try { return new Date(d).toLocaleDateString('pt-BR') } catch (e) { return d } }
const formatCurrency = (v) => { try { const n = Number(v || 0); return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) } catch (e) { return `R$ ${Number(v || 0).toFixed(2)}` } }
const daysDiff = (dateStr) => { if (!dateStr) return null; const today = new Date(); const d = new Date(dateStr); const t0 = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()); const t1 = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); return Math.floor((t1 - t0) / (1000 * 60 * 60 * 24)) }
const isPaid = (row) => { if (!row) return false; const p = row.pago; if (p === true) return true; if (p === false) return false; if (p === 'true' || p === 't' || p === '1') return true; if (p === 'false' || p === 'f' || p === '0') return false; if (Number(p) === 1) return true; if (row.status === 'pago') return true; return !!p }
const isOverdue = (row) => { try { if (row.pago) return false; const diff = daysDiff(row.data_vencimento); return diff !== null && diff < 0 } catch (e) { return false } }
const isDueSoon = (row) => { try { if (row.pago) return false; const diff = daysDiff(row.data_vencimento); return diff !== null && diff >= 0 && diff <= 3 } catch (e) { return false } }
const overdueLabel = (row) => { const diff = daysDiff(row.data_vencimento); if (diff === null) return 'Vencimento N/D'; const days = Math.abs(diff); return `Vencido ${days} dia${days === 1 ? '' : 's'}` }
const dueSoonLabel = (row) => { const diff = daysDiff(row.data_vencimento); if (diff === null) return 'Próximo'; return `Vence em ${diff} dia${diff === 1 ? '' : 's'}` }
const dueInLabel = (row) => { const diff = daysDiff(row.data_vencimento); if (diff === null) return '-'; if (diff > 3) return `Em ${diff} dias`; return `Vence em ${diff} dia${diff === 1 ? '' : 's'}` }
// Desativado: remover destaque de fundo nas células para evitar faixas claras/rosadas
const rowHighlightClass = (row) => {
  try {
    return ''
  } catch (e) {
    return ''
  }
}

const getCentroName = (row) => {
  if (!row) return ''
  return (row.centro_nome || row.centroName || (row.centro && (row.centro.nome || row.centro.name)) || (row.centros_custo && (row.centros_custo.nome))) || ''
}
const getLojaName = (row) => {
  if (!row) return ''
  return (row.loja_nome || row.lojaName || (row.loja && (row.loja.nome || row.loja.fantasia)) || (row.lojas && (row.lojas.nome))) || ''
}
const getFornecedorName = (row) => {
  if (!row) return ''
  return (row.fornecedor_nome || row.fornecedorName || (row.fornecedor && (row.fornecedor.nome_razao || row.fornecedor.nome)) || (row.fornecedores && (row.fornecedores.nome_razao || row.fornecedores.nome))) || ''
}

// Obter a lista do servidor e normalizar as linhas.
const fetchLancamentos = async () => {
  try {
    const session = await client.auth.getSession();
    const token = session?.data?.session?.access_token || null;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const params = new URLSearchParams();
    params.set('limit', String(pageSize.value));
    params.set('offset', String((page.value - 1) * pageSize.value));
    if (filters.loja_id) params.set('loja_id', String(filters.loja_id));
    if (filters.centro_custo_id) params.set('centro_custo_id', String(filters.centro_custo_id));
    if (filters.status) params.set('status', String(filters.status));
    if (filters.date_from) params.set('date_from', String(filters.date_from));
    if (filters.date_to) params.set('date_to', String(filters.date_to));
    if (filters.onlyVencidos) params.set('vencidos', 'true');

    const res = await $fetch(`/api/financeiro/contas-pagar?${params.toString()}`, { method: 'GET', headers });
    if (!res || res.success === false) throw new Error(res?.error || 'Falha ao buscar lançamentos');
    // linhas brutas do servidor
    const raw = res.data || [];
    // garantir que temos mapas de pesquisa preenchidos a partir das props OU fallback para valores presentes nas linhas retornadas
    ensureOptionsFromLancamentos(raw)
    // agora normalize as linhas usando os mapas (que podem ter sido preenchidos acima)
    const rows = raw.map(r => {
      const valorNum = r.valor !== undefined && r.valor !== null ? Number(r.valor) : 0
      const criado = r.criado_em ?? r.created_at ?? r.lancamento ?? r.criadoEm ?? null
      return {
        ...r,
        centro_display: r.centro_nome || centroMap.value[r.centro_custo_id] || getCentroName(r),
        loja_display: r.loja_nome || lojaMap.value[r.loja_id] || getLojaName(r),
        fornecedor_display: r.fornecedor_nome || fornecedorMap.value[r.fornecedor_id] || getFornecedorName(r),
        valor: valorNum,
        criado_em: criado,
        lancamento_display: criado ? formatDate(criado) : 'N/A',
        valor_display: formatCurrency(valorNum)
      }
    })
  // debug: log number of rows and sample first row to help diagnose frontend not updating
  try { console.info('[LancamentosCard] fetchLancamentos rows:', rows.length, rows[0] ?? null) } catch(e) {}
    lancamentos.value = rows;
    totalCount.value = res.count || 0;
  } catch (err) {
    console.error('Erro ao buscar lançamentos:', err)
    listError.value = 'Não foi possível carregar lançamentos.'
  }
}

// expose a simple refresh method to the parent
const refresh = async () => { await fetchLancamentos() }
defineExpose({ refresh })

// edit modal helpers
const savingEdit = ref(false)
const onSaveEdit = async () => {
  if (!editRow.value) return
  savingEdit.value = true
  try {
    await saveEdit(editRow.value)
  } finally {
    savingEdit.value = false
  }
}

// CRUD actions
const markAsPaid = async (row) => {
  try {
    const session = await client.auth.getSession();
    const token = session?.data?.session?.access_token || null;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await $fetch(`/api/financeiro/contas-pagar/${row.id}/pagar`, { method: 'POST', headers })
    if (!res || res.success === false) throw new Error(res?.error || 'Falha ao marcar como pago')
    toast.add({ title: 'Sucesso', description: 'Lançamento marcado como pago.' })
    await fetchLancamentos()
  } catch (err) {
    console.error('Erro ao marcar como pago:', err)
    toast.add({ title: 'Erro', description: String(err?.message || err || 'Erro desconhecido'), color: 'red' })
  }
}

const remove = async (row) => {
  if (!confirm('Deseja realmente excluir este lançamento?')) return
  try {
    const session = await client.auth.getSession();
    const token = session?.data?.session?.access_token || null;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await $fetch(`/api/financeiro/contas-pagar/${row.id}`, { method: 'DELETE', headers })
    if (!res || res.success === false) throw new Error(res?.error || 'Falha ao excluir')
    toast.add({ title: 'Sucesso', description: 'Lançamento excluído.' })
    await fetchLancamentos()
  } catch (err) {
    console.error('Erro ao excluir:', err)
    toast.add({ title: 'Erro', description: String(err?.message || err || 'Erro desconhecido'), color: 'red' })
  }
}

const openEdit = (row) => {
  // open the internal edit modal
  openEditModal(row)
}

const viewDetail = (row) => {
  // abrir modal de detalhes em vez de navegar para outra página
  try {
    openDetail(row)
  } catch (e) { console.error('viewDetail error', e) }
}

// fetching and helpers
// local maps derived from props for quick lookup
const lojaMap = ref({})
const centroMap = ref({})
const fornecedorMap = ref({})
const planoMap = ref({})

const buildMapsFromProps = () => {
  lojaMap.value = {}
  centroMap.value = {}
  fornecedorMap.value = {}
  planoMap.value = {}
  ;(props.lojasOptions || []).forEach(o => { if (o && o.value !== undefined) lojaMap.value[o.value] = o.label })
  ;(props.centrosOptions || []).forEach(o => { if (o && o.value !== undefined) centroMap.value[o.value] = o.label })
  ;(props.fornecedoresOptions || []).forEach(o => { if (o && o.value !== undefined) fornecedorMap.value[o.value] = o.label })
  ;(props.planosOptions || []).forEach(o => { if (o && o.value !== undefined) planoMap.value[o.value] = o.label })
}

// Fallback: when props don't provide options (e.g., RLS hidden), build maps from the returned lancamentos
const ensureOptionsFromLancamentos = (rawRows) => {
  try {
    if (!Array.isArray(rawRows) || rawRows.length === 0) return
    // lojas
    if (!Object.keys(lojaMap.value || {}).length) {
      for (const r of rawRows) {
        const id = r.loja_id ?? r.lojas?.id ?? r.loja?.id
        const nome = r.loja_nome || (r.lojas && (r.lojas.nome)) || (r.loja && (r.loja.nome || r.loja.fantasia)) || null
        if (id && nome && !lojaMap.value[id]) lojaMap.value[id] = nome
      }
    }
    // centros
    if (!Object.keys(centroMap.value || {}).length) {
      for (const r of rawRows) {
        const id = r.centro_custo_id ?? r.centros_custo?.id ?? r.centro?.id
        const nome = r.centro_nome || (r.centros_custo && (r.centros_custo.nome)) || (r.centro && (r.centro.nome)) || null
        if (id && nome && !centroMap.value[id]) centroMap.value[id] = nome
      }
    }
    // fornecedores
    if (!Object.keys(fornecedorMap.value || {}).length) {
      for (const r of rawRows) {
        const id = r.fornecedor_id ?? r.fornecedores?.id ?? r.fornecedor?.id
        const nome = r.fornecedor_nome || (r.fornecedores && (r.fornecedores.nome_razao || r.fornecedores.nome)) || (r.fornecedor && (r.fornecedor.nome_razao || r.fornecedor.nome)) || null
        if (id && nome && !fornecedorMap.value[id]) fornecedorMap.value[id] = nome
      }
    }
    // planos
    if (!Object.keys(planoMap.value || {}).length) {
      for (const r of rawRows) {
        const id = r.plano_conta_id ?? r.plano?.id
        const nome = (r.plano && (r.plano.nome || r.plano.descricao)) || r.plano_nome || null
        if (id && nome && !planoMap.value[id]) planoMap.value[id] = nome
      }
    }
  } catch (e) {
    console.error('ensureOptionsFromLancamentos error', e)
  }
}

const exportCsv = async () => {
  try {
    const session = await client.auth.getSession();
    const token = session?.data?.session?.access_token || null;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const params = new URLSearchParams();
    if (filters.loja_id) params.set('loja_id', String(filters.loja_id));
    if (filters.centro_custo_id) params.set('centro_custo_id', String(filters.centro_custo_id));
    if (filters.status) params.set('status', String(filters.status));
    params.set('limit', '10000');
    params.set('offset', '0');
    if (filters.onlyVencidos) params.set('vencidos', 'true');

    const res = await $fetch(`/api/financeiro/contas-pagar?${params.toString()}`, { method: 'GET', headers });
    if (!res || res.success === false) throw new Error(res?.error || 'Falha ao exportar');
    const rows = res.data || [];
    const csvRows = [];
    const headersRow = ['id','loja','centro_custo','descricao','data_vencimento','agendado_para','valor','status','pago','data_pagamento','lancamento','vencido_dias'];
    csvRows.push(headersRow.join(','));
    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    for (const r of rows) {
      const lojaNome = (props.lojasOptions || []).find(x => x.value === r.loja_id)?.label || r.loja_nome || ''
      const centroNome = (props.centrosOptions || []).find(x => x.value === r.centro_custo_id)?.label || r.centro_nome || ''
      const vencidoDias = daysDiff(r.data_vencimento ?? r.dataVencimento);
      const createdAtVal = r.criado_em ?? r.created_at ?? r.lancamento ?? r.criadoEm ?? '';
      const vals = [
        r.id,
        escape(lojaNome),
        escape(centroNome),
        escape(r.descricao),
        (r.data_vencimento ?? r.dataVencimento) || '',
        (r.agendado_para ?? r.agendadoPara) || '',
        escape(formatCurrency(r.valor)),
        r.status || '',
        r.pago ? 'TRUE' : 'FALSE',
        r.data_pagamento || '',
        escape(createdAtVal),
        (vencidoDias === null ? '' : String(vencidoDias))
      ];
      csvRows.push(vals.join(','));
    }
    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contas_a_pagar_export_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Erro ao exportar CSV:', err);
    toast.add({ title: 'Erro', description: 'Falha ao exportar CSV', color: 'red' });
  }
}
const resetFilters = () => { filters.loja_id = null; filters.centro_custo_id = null; filters.status = null; filters.date_from = null; filters.date_to = null; filters.onlyVencidos = false; page.value = 1; fetchLancamentos() }
const applyFilter = () => { page.value = 1; fetchLancamentos() }
const toggleOnlyVencidos = () => { filters.onlyVencidos = !filters.onlyVencidos; page.value = 1; fetchLancamentos() }
const prevPage = () => { page.value = Math.max(1, page.value - 1); fetchLancamentos() }
const nextPage = () => { page.value = page.value + 1; fetchLancamentos() }



onMounted(async () => {
  // build lookup maps from props
  buildMapsFromProps()
  // do not auto-fetch here: parent page should trigger initial fetch after it has loaded global options
  // this avoids a race where child fetches lancamentos before the parent has populated lojas/fornecedores via client
})

// react to prop changes
watch(() => [props.lojasOptions, props.centrosOptions, props.fornecedoresOptions, props.planosOptions], () => {
  buildMapsFromProps()
})

// Edit modal state
const isEditOpen = ref(false)
const editRow = ref(null)

// Detalhes: abrimos a página dedicada em nova aba; não mantemos estado de modal aqui.
const getRowId = (row) => {
  if (!row) return null
  // common id keys used across the codebase
  return row.id ?? row.conta_id ?? row.contaId ?? row.codigo ?? row.numero ?? row.numero_contrato ?? null
}

const openDetail = async (row) => {
  try {
    const id = getRowId(row)
    console.info('[LancamentosCard] openDetail id:', id, 'row:', row)
    if (!id) {
      toast.add({ title: 'Aviso', description: 'Identificador da conta não disponível para visualização.', color: 'yellow' })
      return
    }
    const path = `/financeiro/contas-a-pagar/${id}`
    console.info('[LancamentosCard] about to router.push to', path)
    let res = null
    try {
      // tenta navegar via router (SPA)
      res = await router.push(path)
      console.info('[LancamentosCard] router.push result:', res)
      // Se router retornar um NavigationFailure, faça fallback imediato
      if (isNavigationFailure(res)) {
        console.warn('[LancamentosCard] navigation failure:', res)
        toast.add({ title: 'Erro', description: 'Navegação abortada pelo roteador.', color: 'red' })
        window.location.href = path
        return
      }

      // router.push pode resolver `undefined` em casos de sucesso — porém, às vezes
      // a URL não é atualizada (ex.: edge-case com guards). Para cobrir isso, aguarde
      // um curto período e verifique se a localização do browser mudou; caso não, força redirect.
      console.info('[LancamentosCard] waiting 200ms to check location')
      await new Promise(resolve => setTimeout(resolve, 200))
      console.info('[LancamentosCard] after wait, checking location')
      try {
        const current = window.location.pathname || window.location.href
        // compara apenas o pathname final (evita querystring/host mismatches)
        if (!current.includes(path)) {
          console.info('[LancamentosCard] router.push did not change location, forcing full redirect to', path)
          window.location.href = path
        } else {
          console.info('[LancamentosCard] location changed successfully to', current)
        }
      } catch (e) {
        // em caso de erro ao acessar window (por exemplo durante SSR) faça fallback seguro
        console.error('[LancamentosCard] error checking location after push', e)
        window.location.href = path
      }
    } catch (err) {
      console.error('[LancamentosCard] router.push error', err)
      toast.add({ title: 'Erro', description: 'Falha ao navegar (fallback).', color: 'red' })
      window.location.href = path
    }
  } catch (e) {
    console.error('Erro ao navegar para detalhe', e)
  }
}

const handleView = (row) => {
  try {
    console.info('[LancamentosCard] handleView click, row id guess:', getRowId(row))
    openDetail(row)
  } catch (e) {
    console.error('handleView error', e)
  }
}

const openEditModal = (row) => {
  editRow.value = { ...row }
  isEditOpen.value = true
}

const saveEdit = async (payload) => {
  try {
    const session = await client.auth.getSession();
    const token = session?.data?.session?.access_token || null;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await $fetch(`/api/financeiro/contas-pagar/${payload.id}`, { method: 'PUT', headers, body: payload })
    if (!res || res.success === false) throw new Error(res?.error || 'Falha ao atualizar')
    toast.add({ title: 'Sucesso', description: 'Lançamento atualizado.' })
    isEditOpen.value = false
    await fetchLancamentos()
  } catch (err) {
    console.error('Erro ao atualizar lançamento:', err)
    toast.add({ title: 'Erro', description: String(err?.message || err || 'Erro desconhecido'), color: 'red' })
  }
}
</script>

<!-- Removed temporary CSS mitigation rules per request (they were forcing transparency and removing pseudo-elements). -->
