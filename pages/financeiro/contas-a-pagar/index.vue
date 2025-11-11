<template>
  <div>
    <header class="mb-6">
      <h1 class="text-2xl font-bold">Contas a Pagar</h1>
      <p class="text-sm text-gray-500">Registre e acompanhe contas a pagar por loja.</p>
    </header>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Novo Lançamento</h3>
        </div>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm text-gray-600">Loja</label>
          <USelect v-model="form.loja_id" :options="lojasOptions" placeholder="Selecione uma loja" selectClass="text-sm text-gray-800 dark:text-gray-100" />
        </div>
        <div>
          <label class="block text-sm text-gray-600">Centro de Custo <span class="text-red-600">*</span></label>
          <div class="flex items-center gap-2">
            <USelect v-model="form.centro_custo_id" :options="centrosOptions" placeholder="Selecione centro" selectClass="text-sm text-gray-800 dark:text-gray-100" />
            <UButton size="sm" color="primary" variant="ghost" @click="isCreateCentroOpen = true">+ Centro</UButton>
            <UButton size="sm" color="gray" variant="ghost" @click="openManageCentros">Gerenciar</UButton>
          </div>
          <p v-if="!centrosOptions || centrosOptions.length === 0" class="text-sm text-yellow-600 mt-1">Aviso: nenhum centro de custo carregado</p>
        </div>
        <div>
          <label class="block text-sm text-gray-600">Fornecedor <span class="text-red-600">*</span></label>
          <USelect v-model="form.fornecedor_id" :options="fornecedoresOptions" placeholder="Selecione fornecedor" selectClass="text-sm text-gray-800 dark:text-gray-100" />
          <p v-if="!fornecedoresOptions || fornecedoresOptions.length === 0" class="text-sm text-yellow-600 mt-1">Aviso: nenhum fornecedor carregado</p>
        </div>
        <div>
          <label class="block text-sm text-gray-600">Plano de Conta <span class="text-red-600">*</span></label>
          <USelect v-model="form.plano_conta_id" :options="planosOptions" placeholder="Selecione plano contábil" selectClass="text-sm text-gray-800 dark:text-gray-100" />
        </div>
        <div>
          <label for="form_data_vencimento" class="block text-sm text-gray-600">Data de Vencimento <span class="text-red-600">*</span></label>
          <UInput id="form_data_vencimento" v-model="form.data_vencimento" type="date" />
        </div>
        <div>
          <label for="form_agendado_para" class="block text-sm text-gray-600">Agendar pagamento (opcional)</label>
          <UInput id="form_agendado_para" v-model="form.agendado_para" type="date" placeholder="Data agendada" />
        </div>
        <div>
          <label class="block text-sm text-gray-600">Valor (R$) <span class="text-red-600">*</span></label>
          <UInput v-model="form.valor" type="number" step="0.01" />
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm text-gray-600">Descrição</label>
          <textarea v-model="form.descricao" rows="3" class="w-full border rounded px-3 py-2" placeholder="Descrição da conta (opcional)"></textarea>
        </div>
        <div class="col-span-3 flex justify-end pt-4">
          <UButton :loading="saving" color="primary" @click="save">Registrar</UButton>
        </div>
      </div>

      <p v-if="formError" class="text-red-500 text-sm mt-3">{{ formError }}</p>
    </UCard>

  <!-- lista de lançamentos centralizada no componente -->
  <LancamentosCard ref="lancamentosCard" :lojasOptions="lojasOptions" :centrosOptions="centrosOptions" :fornecedoresOptions="fornecedoresOptions" :planosOptions="planosOptions" />

  <!-- Modal: Criar Centro de Custo -->
  <UModal v-model="isCreateCentroOpen">
    <UCard>
      <template #header>
        <h3 class="text-base font-semibold">Novo Centro de Custo</h3>
      </template>
      <div class="space-y-3">
        <div>
          <label class="block text-sm text-gray-600">Código</label>
          <UInput v-model="centroForm.codigo" />
        </div>
        <div>
          <label class="block text-sm text-gray-600">Nome</label>
          <UInput v-model="centroForm.nome" />
        </div>
        <div>
          <label class="block text-sm text-gray-600">Descrição</label>
          <UInput v-model="centroForm.descricao" />
        </div>
      </div>
      <div class="flex justify-end gap-2 pt-4">
        <UButton color="gray" variant="ghost" @click="closeCreateCentro">Cancelar</UButton>
        <UButton :loading="creatingCentro" color="primary" @click="createCentro">Criar</UButton>
      </div>
    </UCard>
  </UModal>

  <!-- Modal: Gerenciar Centros -->
  <UModal v-model="isManageCentrosOpen" class="max-w-3xl">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold">Gerenciar Centros de Custo</h3>
        </div>
      </template>
      <div class="space-y-3">
        <div v-if="managedError" class="text-red-500">{{ managedError }}</div>
        <div v-if="!managedCentros || managedCentros.length === 0" class="text-sm text-gray-500">Nenhum centro encontrado.</div>
        <div v-else class="space-y-2">
          <div v-for="c in managedCentros" :key="c.id" class="flex items-center justify-between border-b pb-2">
            <div>
              <div class="font-medium">{{ c.nome }}</div>
              <div class="text-sm text-gray-500">{{ c.descricao }}</div>
            </div>
            <div class="flex items-center gap-2">
              <UButton size="sm" color="green" variant="outline" @click="toggleCentroActive(c)">{{ c.ativo ? 'Desativar' : 'Ativar' }}</UButton>
              <UButton size="sm" color="primary" @click="openEditCentro(c)">Editar</UButton>
            </div>
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-2 pt-4">
        <UButton color="gray" variant="ghost" @click="closeManageCentros">Fechar</UButton>
      </div>
    </UCard>
  </UModal>

  <!-- Modal: Edit Centro (reaproveita isEditCentroOpen & centroEditForm) -->
  <UModal v-model="isEditCentroOpen">
    <UCard>
      <template #header>
        <h3 class="text-base font-semibold">Editar Centro de Custo</h3>
      </template>
      <div class="space-y-3">
        <div>
          <label class="block text-sm text-gray-600">Nome</label>
          <UInput v-model="centroEditForm.nome" />
        </div>
        <div>
          <label class="block text-sm text-gray-600">Descrição</label>
          <UInput v-model="centroEditForm.descricao" />
        </div>
        <div class="flex items-center gap-2">
          <UInput type="checkbox" v-model="centroEditForm.ativo" />
          <label class="text-sm text-gray-600">Ativo</label>
        </div>
      </div>
      <div class="flex justify-end gap-2 pt-4">
        <UButton color="gray" variant="ghost" @click="isEditCentroOpen = false">Cancelar</UButton>
        <UButton :loading="updatingCentro" color="primary" @click="updateCentro">Salvar</UButton>
      </div>
    </UCard>
  </UModal>

  </div>
  </template>

  <script setup>

import LancamentosCard from '~/components/financeiro/LancamentosCard.vue'

// infra helpers
const client = useSupabaseClient()
const toast = useToast()

  const saving = ref(false);
const form = reactive({ loja_id: null, centro_custo_id: null, fornecedor_id: null, plano_conta_id: null, data_vencimento: '', agendado_para: '', valor: '', descricao: '' })
const lojas = ref([])
const lojasOptions = ref([])
const lojaMap = ref({})
const fornecedores = ref([])
const fornecedoresOptions = ref([])
const fornecedorMap = ref({})
const centros = ref([])
const centrosOptions = ref([])
const centroMap = ref({})
const planosContas = ref([])
const planosOptions = ref([])
const planoMap = ref({})
const lancamentos = ref([])
const lancamentosCard = ref(null)
const formError = ref(null);
const listError = ref(null);
const isCreateCentroOpen = ref(false)
const creatingCentro = ref(false)
const centroForm = reactive({ codigo: '', nome: '', descricao: '' })
const isManageCentrosOpen = ref(false)
const managedCentros = ref([])
const managedError = ref(null)
const isEditCentroOpen = ref(false)
const centroEditForm = reactive({ id: null, nome: '', descricao: '', ativo: true })
const updatingCentro = ref(false)
const filters = reactive({ loja_id: null, centro_custo_id: null, status: null, date_from: null, date_to: null, onlyVencidos: false });
const page = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);

  const columns = [
  { key: 'descricao', label: 'Descrição' },
  { key: 'centro', label: 'Centro de Custo' },
  { key: 'vencido', label: 'Vencido' },
  { key: 'fornecedor', label: 'Fornecedor' },
  { key: 'loja', label: 'Loja' },
  { key: 'data_vencimento', label: 'Vencimento' },
  { key: 'agendado_para', label: 'Agendado' },
  { key: 'lancamento', label: 'Lançamento' },
  { key: 'valor', label: 'Valor' }
];

// adiciona coluna de ações (UTable renderiza slots mesmo sem coluna explícita)
columns.push({ key: 'acoes', label: 'Ações' })

// adiciona coluna de status
columns.splice(columns.length - 1, 0, { key: 'status', label: 'Status' })

// --- AÇÕES: Marcar pago / Edit / Delete ---
const isEditModalOpen = ref(false)
const editForm = reactive({ id: null, loja_id: null, centro_custo_id: null, fornecedor_id: null, plano_conta_id: null, descricao: '', data_vencimento: '', valor: '', agendado_para: '' })
const editing = ref(false)

const markAsPaid = async (row) => {
  try {
    const session = await client.auth.getSession();
    const token = session?.data?.session?.access_token || null;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await $fetch(`/api/financeiro/contas-pagar/${row.id}/pagar`, { method: 'POST', headers })
    if (!res || res.success === false) throw new Error(res?.error || 'Falha ao marcar como pago')
    toast.add({ title: 'Sucesso', description: 'Lançamento marcado como pago.' })
  await lancamentosCard.value?.refresh()
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
  await lancamentosCard.value?.refresh()
  } catch (err) {
    console.error('Erro ao excluir:', err)
    toast.add({ title: 'Erro', description: String(err?.message || err || 'Erro desconhecido'), color: 'red' })
  }
}

const openEdit = (row) => {
  editForm.id = row.id
  // defensivo: aceite id vindo direto ou em objeto aninhado
  editForm.loja_id = row.loja_id ?? row.loja?.id ?? row.lojaId ?? row.lojas?.id ?? null
  editForm.centro_custo_id = row.centro_custo_id ?? row.centro?.id ?? row.centro_custo?.id ?? row.centroId ?? row.centros_custo?.id ?? null
  editForm.fornecedor_id = row.fornecedor_id ?? row.fornecedor?.id ?? row.fornecedores?.id ?? row.fornecedores_id ?? null
  editForm.plano_conta_id = row.plano_conta_id ?? row.plano_conta?.id ?? row.plano_contas?.id ?? null
  editForm.descricao = row.descricao
  editForm.data_vencimento = row.data_vencimento
  editForm.valor = row.valor
  isEditModalOpen.value = true
}

const saveEdit = async () => {
  editing.value = true
  try {
    const session = await client.auth.getSession();
    const token = session?.data?.session?.access_token || null;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const payload = {
      loja_id: editForm.loja_id,
      centro_custo_id: editForm.centro_custo_id,
      fornecedor_id: editForm.fornecedor_id || null,
      plano_conta_id: editForm.plano_conta_id || null,
      descricao: editForm.descricao,
      data_vencimento: editForm.data_vencimento,
      agendado_para: editForm.agendado_para || null,
      valor: Number(editForm.valor)
    }
    const res = await $fetch(`/api/financeiro/contas-pagar/${editForm.id}`, { method: 'PUT', headers, body: payload })
    if (!res || res.success === false) throw new Error(res?.error || 'Falha ao atualizar')
    toast.add({ title: 'Sucesso', description: 'Lançamento atualizado.' })
  isEditModalOpen.value = false
  await lancamentosCard.value?.refresh()
  } catch (err) {
    console.error('Erro ao atualizar lançamento:', err)
    toast.add({ title: 'Erro', description: String(err?.message || err || 'Erro desconhecido'), color: 'red' })
  } finally {
    editing.value = false
  }
}
const fetchLojas = async () => {
  try {
    const { data, error } = await client.from('lojas').select('id,nome');
    if (error) throw error;
    lojas.value = data || [];
    lojasOptions.value = lojas.value.map(l => ({ label: l.nome, value: l.id }));
    const map = {};
    (lojas.value || []).forEach(l => map[l.id] = l.nome);
    lojaMap.value = map;
  } catch (err) {
    console.error('Erro ao buscar lojas:', err);
    listError.value = 'Não foi possível carregar as lojas.';
  }
}

const fetchFornecedores = async () => {
  try {
    const res = await client.from('fornecedores').select('id,nome_razao,ativo')
    console.info('[fetchFornecedores] response:', res)
    const data = res?.data ?? []
    fornecedores.value = Array.isArray(data) ? data : []
    fornecedoresOptions.value = fornecedores.value.map(f => ({ label: f.nome_razao, value: f.id }))
    const map = {}
    fornecedores.value.forEach(f => map[f.id] = f.nome_razao)
    fornecedorMap.value = map
  } catch (err) {
    console.error('Erro ao buscar fornecedores:', err)
  }
}

// fallback: try server endpoint (admin) when client returns empty list
const fetchFornecedoresWithFallback = async () => {
  await fetchFornecedores()
  if (!fornecedores.value || fornecedores.value.length === 0) {
    try {
      console.info('[fetchFornecedoresWithFallback] client returned empty, trying server endpoint')
      const res = await $fetch('/api/fornecedores?limit=1000', { method: 'GET' })
      if (res && res.success && Array.isArray(res.data) && res.data.length) {
        fornecedores.value = res.data
        fornecedoresOptions.value = fornecedores.value.map(f => ({ label: f.nome_razao || f.nome, value: f.id }))
        const map = {}
        fornecedores.value.forEach(f => map[f.id] = f.nome_razao || f.nome)
        fornecedorMap.value = map
      } else {
        console.info('[fetchFornecedoresWithFallback] server endpoint returned empty or failed', res)
      }
    } catch (e) {
      console.error('[fetchFornecedoresWithFallback] error calling server endpoint', e)
    }
  }
}

const fetchPlanos = async () => {
  try {
    const res = await client.from('plano_contas').select('id,codigo,nome,ativo')
    const data = res?.data ?? []
    planosContas.value = Array.isArray(data) ? data : []
    planosOptions.value = planosContas.value.map(p => ({ label: `${p.codigo} — ${p.nome}`, value: p.id }))
    const map = {}
    planosContas.value.forEach(p => map[p.id] = p.nome)
    planoMap.value = map
  } catch (err) {
    console.error('Erro ao buscar plano de contas:', err)
  }
}

const resetFilters = async () => {
  filters.loja_id = null
  filters.centro_custo_id = null
  filters.status = null
  filters.date_from = null
  filters.date_to = null
  page.value = 1
  await lancamentosCard.value?.refresh()
}

const fetchCentros = async () => {
  try {
    const res = await client.from('centros_custo').select('id,nome').eq('ativo', true)
    console.info('[fetchCentros] response:', res)
    // debug: log response shape if something unexpected happens
    // console.debug('fetchCentros response', res)
    const data = res?.data ?? null
    const error = res?.error ?? null
    if (error) throw error
    // defensive: ensure we have an array
    const rows = Array.isArray(data) ? data : []
    centros.value = rows
    centrosOptions.value = rows.map(c => ({ label: c.nome, value: c.id }))
    const map = {}
    rows.forEach(c => map[c.id] = c.nome)
    centroMap.value = map
  } catch (err) {
    console.error('Erro ao buscar centros de custo:', err)
    // não bloqueia; apenas não mostra opções
  }
}

// fallback: call server endpoint if client returns empty
const fetchCentrosWithFallback = async () => {
  await fetchCentros()
  if ((!centros.value || centros.value.length === 0)) {
    try {
      console.info('[fetchCentrosWithFallback] client returned empty, trying server endpoint')
      const res = await $fetch('/api/centros-custo', { method: 'GET' })
      if (res && res.success && Array.isArray(res.data) && res.data.length) {
        centros.value = res.data
        centrosOptions.value = centros.value.map(c => ({ label: c.nome, value: c.id }))
        const map = {}
        centros.value.forEach(c => map[c.id] = c.nome)
        centroMap.value = map
      } else {
        console.info('[fetchCentrosWithFallback] server endpoint returned empty or failed', res)
      }
    } catch (e) {
      console.error('[fetchCentrosWithFallback] error calling server endpoint', e)
    }
  }
}

const fetchLancamentos = async () => {
  try {
    // usa endpoint server que aplica autorização e paginação
    const session = await client.auth.getSession();
    const token = session?.data?.session?.access_token || null;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const params = new URLSearchParams();
    // pagination
    params.set('limit', String(pageSize.value));
    params.set('offset', String((page.value - 1) * pageSize.value));
    // filters
    if (filters.loja_id) params.set('loja_id', String(filters.loja_id));
    if (filters.centro_custo_id) params.set('centro_custo_id', String(filters.centro_custo_id));
    if (filters.status) params.set('status', String(filters.status));
  if (filters.date_from) params.set('date_from', String(filters.date_from));
  if (filters.date_to) params.set('date_to', String(filters.date_to));
  // filtro rápido de vencidos (servidor já implementa this filter)
  if (filters.onlyVencidos) params.set('vencidos', 'true');

    const res = await $fetch(`/api/financeiro/contas-pagar?${params.toString()}`, { method: 'GET', headers });
    if (!res || res.success === false) throw new Error(res?.error || 'Falha ao buscar lançamentos');
    // Rely on server-provided display fields when available (less duplication):
    // expected server fields: loja_nome, centro_nome, fornecedor_nome, valor (numérico), criado_em
    const rows = (res.data || []).map(r => {
      const valorNum = r.valor !== undefined && r.valor !== null ? Number(r.valor) : 0
      const criado = r.criado_em ?? r.created_at ?? r.lancamento ?? r.criadoEm ?? null
      return {
        ...r,
        centro_display: r.centro_nome || r.centros_custo?.nome || (r.centro && (r.centro.nome || r.centro.name)) || getCentroName(r),
        loja_display: r.loja_nome || r.lojas?.nome || (r.loja && (r.loja.nome || r.loja.fantasia)) || getLojaName(r),
        fornecedor_display: r.fornecedor_nome || (r.fornecedores && (r.fornecedores.nome_razao || r.fornecedores.nome)) || (r.fornecedor && (r.fornecedor.nome_razao || r.fornecedor.nome)) || getFornecedorName(r),
        valor: valorNum,
        criado_em: criado,
        lancamento_display: criado ? formatDate(criado) : 'N/A',
        valor_display: formatCurrency(valorNum)
      }
    })
    lancamentos.value = rows;
    totalCount.value = res.count || 0;
    // se as tabelas de lojas/centros não estiverem disponíveis via client (RLS), tente preencher opções a partir dos lançamentos retornados
    ensureOptionsFromLancamentos()
  } catch (err) {
    console.error('Erro ao buscar lançamentos:', err);
    listError.value = 'Não foi possível carregar lançamentos. Verifique se a tabela `contas_pagar` existe e se o usuário tem permissão.';
  }
}

const ensureOptionsFromLancamentos = () => {
  try {
    // lojas
    if ((!lojas.value || lojas.value.length === 0) && Array.isArray(lancamentos.value) && lancamentos.value.length) {
      const map = {}
      const opts = []
      for (const r of lancamentos.value) {
        const id = r.loja_id ?? r.lojas?.id ?? r.loja?.id
        const nome = (r.lojas && (r.lojas.nome)) || (r.loja && (r.loja.nome)) || (r.loja_nome) || null
        if (id && nome && !map[id]) {
          map[id] = nome
          opts.push({ label: nome, value: id })
        }
      }
      if (opts.length) {
        lojas.value = Object.keys(map).map(k => ({ id: Number(k), nome: map[k] }))
        lojasOptions.value = opts
        lojaMap.value = map
      }
    }
    // centros
    if ((!centros.value || centros.value.length === 0) && Array.isArray(lancamentos.value) && lancamentos.value.length) {
      const map = {}
      const opts = []
      for (const r of lancamentos.value) {
        const id = r.centro_custo_id ?? r.centros_custo?.id ?? r.centro?.id
        const nome = (r.centros_custo && (r.centros_custo.nome)) || (r.centro && (r.centro.nome)) || (r.centro_nome) || null
        if (id && nome && !map[id]) {
          map[id] = nome
          opts.push({ label: nome, value: id })
        }
      }
      if (opts.length) {
        centros.value = Object.keys(map).map(k => ({ id: Number(k), nome: map[k] }))
        centrosOptions.value = opts
        centroMap.value = map
      }
    }
  } catch (e) {
    // não crítico
    console.error('ensureOptionsFromLancamentos error', e)
  }
}

// export CSV do conjunto atual de filtros (busca até 10k registros)
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
    for (const r of rows) {
      // defensive name resolution: prefer maps, then nested objects, then fallback fields
      const lojaNome = lojaMap.value[r.loja_id] || r.lojas?.nome || r.loja?.nome || r.loja_nome || r.lojaName || '';
      const centroNome = centroMap.value[r.centro_custo_id] || r.centros_custo?.nome || r.centro?.nome || r.centro_nome || r.centroName || '';
      const vencidoDias = daysDiff(r.data_vencimento ?? r.dataVencimento);
      const createdAtVal = r.criado_em ?? r.created_at ?? r.lancamento ?? r.criadoEm ?? '';
  const vals = [r.id, `"${(lojaNome||'').replace(/"/g,'\"')}"`, `"${(centroNome||'').replace(/"/g,'\"')}"`, `"${(r.descricao||'').replace(/"/g,'\"')}"`, (r.data_vencimento ?? r.dataVencimento) || '', (r.agendado_para ?? r.agendadoPara) || '', `"${formatCurrency(r.valor)}"`, r.status || '', r.pago ? 'TRUE' : 'FALSE', r.data_pagamento || '', createdAtVal, (vencidoDias === null ? '' : String(vencidoDias))];
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

const formatDate = (d) => {
  if (!d) return 'N/A';
  try { return new Date(d).toLocaleDateString('pt-BR'); } catch (e) { return d; }
}

const formatCurrency = (v) => {
  try {
    const n = Number(v || 0)
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  } catch (e) { return `R$ ${Number(v || 0).toFixed(2)}` }
}

// auxiliares para obter nome do centro/loja de forma defensiva
const getCentroName = (row) => {
  if (!row) return ''
  // prioriza mapa (vindo de fetchCentros), depois objetos aninhados e diversos nomes possíveis
  return centroMap.value[row.centro_custo_id]
    || (row.centro && (row.centro.nome || row.centro.name || row.centro.label))
    || (row.centros_custo && (row.centros_custo.nome || row.centros_custo.name))
    || row.centro_nome
    || row.centroName
    || ''
}

const getLojaName = (row) => {
  if (!row) return ''
  return lojaMap.value[row.loja_id]
    || (row.loja && (row.loja.nome || row.loja.name || row.loja.fantasia))
    || (row.lojas && (row.lojas.nome || row.lojas.name))
    || row.loja_nome
    || row.lojaName
    || ''
}

const getFornecedorName = (row) => {
  if (!row) return ''
  return fornecedorMap.value[row.fornecedor_id]
    || (row.fornecedor && (row.fornecedor.nome_razao || row.fornecedor.nome || row.fornecedor.name))
    || (row.fornecedores && (row.fornecedores.nome_razao || row.fornecedores.nome))
    || row.fornecedor_nome
    || row.fornecedorName
    || ''
}

// robust check for pago status (coerce strings/numbers)
const isPaid = (row) => {
  if (!row) return false
  const p = row.pago
  if (p === true) return true
  if (p === false) return false
  if (p === 'true' || p === 't' || p === '1') return true
  if (p === 'false' || p === 'f' || p === '0') return false
  if (Number(p) === 1) return true
  if (row.status === 'pago') return true
  return !!p
}

// ações de UI que mutam refs — declaradas como funções para evitar atribuições diretas em expressões do template
const closeCreateCentro = () => { isCreateCentroOpen.value = false }
const closeManageCentros = () => { isManageCentrosOpen.value = false }
const openManageCentros = async () => { isManageCentrosOpen.value = true; await fetchManagedCentros() }
const toggleOnlyVencidos = () => { filters.onlyVencidos = !filters.onlyVencidos; page.value = 1; lancamentosCard.value?.refresh() }
const doFilter = () => { page.value = 1; lancamentosCard.value?.refresh() }
const prevPage = () => { page.value = Math.max(1, page.value - 1); lancamentosCard.value?.refresh() }
const nextPage = () => { page.value = page.value + 1; lancamentosCard.value?.refresh() }

// helpers para vencimento
const daysDiff = (dateStr) => {
  if (!dateStr) return null
  const today = new Date()
  const d = new Date(dateStr)
  // zerar horas para comparação por dias
  const t0 = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const t1 = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
  const diff = Math.floor((t1 - t0) / (1000 * 60 * 60 * 24))
  return diff
}

const isOverdue = (row) => {
  try {
    if (row.pago) return false
    const diff = daysDiff(row.data_vencimento)
    return diff !== null && diff < 0
  } catch (e) { return false }
}

const isDueSoon = (row) => {
  try {
    if (row.pago) return false
    const diff = daysDiff(row.data_vencimento)
    return diff !== null && diff >= 0 && diff <= 3
  } catch (e) { return false }
}

const overdueLabel = (row) => {
  const diff = daysDiff(row.data_vencimento)
  if (diff === null) return 'Vencimento N/D'
  const days = Math.abs(diff)
  return `Vencido ${days} dia${days === 1 ? '' : 's'}`
}

const dueSoonLabel = (row) => {
  const diff = daysDiff(row.data_vencimento)
  if (diff === null) return 'Próximo'
  return `Vence em ${diff} dia${diff === 1 ? '' : 's'}`
}

const dueInLabel = (row) => {
  const diff = daysDiff(row.data_vencimento)
  if (diff === null) return '-'
  if (diff > 3) return `Em ${diff} dias`
  return `Vence em ${diff} dia${diff === 1 ? '' : 's'}`
}

// retorna classe CSS para destacar linhas (vencidas / próximas)
const rowHighlightClass = (row) => {
  try {
    if (isOverdue(row)) return 'bg-red-50'
    if (isDueSoon(row)) return 'bg-yellow-50'
    return ''
  } catch (e) { return '' }
}

const save = async () => {
  formError.value = null;
  if (!form.loja_id) { formError.value = 'Selecione a loja.'; return }
  if (!form.fornecedor_id) { formError.value = 'Selecione o fornecedor.'; return }
  if (!form.centro_custo_id) { formError.value = 'Selecione o centro de custo.'; return }
  if (!form.plano_conta_id) { formError.value = 'Selecione a conta contábil (plano de contas).'; return }
  if (!form.data_vencimento) { formError.value = 'Data de vencimento é obrigatória.'; return }
  if (!form.valor || Number(form.valor) <= 0) { formError.value = 'Valor deve ser maior que zero.'; return }

  saving.value = true;
  try {
    // usa endpoint server para inserir (requer service role configurado no servidor)
    const session = await client.auth.getSession();
    const token = session?.data?.session?.access_token || null;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const body = {
      loja_id: form.loja_id,
      centro_custo_id: form.centro_custo_id,
      fornecedor_id: form.fornecedor_id,
      plano_conta_id: form.plano_conta_id,
      descricao: form.descricao || null,
      data_vencimento: form.data_vencimento,
      agendado_para: form.agendado_para || null,
      valor: Number(form.valor)
    };

    const res = await $fetch('/api/financeiro/contas-pagar', { method: 'POST', headers, body });
    if (!res || res.success === false) throw new Error(res?.error || 'Falha ao registrar');

    toast.add({ title: 'Sucesso', description: 'Lançamento registrado.' });
  // limpa form e recarrega lista
  form.descricao = '';
  form.data_vencimento = '';
  form.agendado_para = '';
  form.valor = '';
  form.loja_id = null;
  form.fornecedor_id = null;
  form.centro_custo_id = null;
  form.plano_conta_id = null;
  await lancamentosCard.value?.refresh();
  } catch (err) {
    console.error('Erro ao salvar lançamento:', err);
    formError.value = String(err?.message || err || 'Erro desconhecido');
    toast.add({ title: 'Erro', description: formError.value, color: 'red' });
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await fetchLojas();
  await fetchCentrosWithFallback();
  await fetchFornecedoresWithFallback();
  await fetchPlanos();
  // agora que as opções (lojas, centros, fornecedores, planos) estão carregadas, dispare o fetch dos lançamentos
  await lancamentosCard.value?.refresh()
});

const createCentro = async () => {
  creatingCentro.value = true
  try {
    if (!centroForm.nome) throw new Error('Nome é obrigatório')
    const session = await client.auth.getSession();
    const token = session?.data?.session?.access_token || null;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const body = { nome: centroForm.nome.trim(), descricao: centroForm.descricao || null }
    const res = await $fetch('/api/centros-custo', { method: 'POST', headers, body })
    if (!res || res.success === false) throw new Error(res?.error || 'Falha ao criar centro')
    // atualiza listagem local
    const novo = res.data
    centros.value = centros.value || []
    centros.value.push(novo)
    centrosOptions.value = (centros.value || []).map(c => ({ label: c.nome, value: c.id }))
    centroMap.value = { ...(centroMap.value || {}), [novo.id]: novo.nome }
    // seleciona no form
    form.centro_custo_id = novo.id
    isCreateCentroOpen.value = false
    centroForm.codigo = ''
    centroForm.nome = ''
    centroForm.descricao = ''
    toast.add({ title: 'Sucesso', description: 'Centro de custo criado.' })
  } catch (err) {
    console.error('Erro ao criar centro:', err)
    toast.add({ title: 'Erro', description: String(err?.message || err || 'Erro desconhecido'), color: 'red' })
  } finally {
    creatingCentro.value = false
  }
}

const fetchManagedCentros = async () => {
  managedError.value = null
  try {
    const session = await client.auth.getSession();
    const token = session?.data?.session?.access_token || null;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await $fetch('/api/centros-custo?all=true', { method: 'GET', headers })
    if (!res || res.success === false) throw new Error(res?.error || 'Falha ao buscar centros')
    managedCentros.value = res.data || []
  } catch (err) {
    console.error('Erro ao buscar centros (admin):', err)
    managedError.value = String(err?.message || err || 'Erro desconhecido')
  }
}

const toggleCentroActive = async (c) => {
  try {
    const session = await client.auth.getSession();
    const token = session?.data?.session?.access_token || null;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await $fetch(`/api/centros-custo/${c.id}`, { method: 'PUT', headers, body: { ativo: !c.ativo } })
    if (!res || res.success === false) throw new Error(res?.error || 'Falha ao atualizar')
    toast.add({ title: 'Sucesso', description: `Centro ${res.data.ativo ? 'ativado' : 'desativado'}.` })
    await fetchManagedCentros()
    await fetchCentros()
  } catch (err) {
    console.error('Erro ao ativar/desativar centro:', err)
    toast.add({ title: 'Erro', description: String(err?.message || err || 'Erro desconhecido'), color: 'red' })
  }
}

const openEditCentro = (c) => {
  centroEditForm.id = c.id
  centroEditForm.nome = c.nome
  centroEditForm.descricao = c.descricao
  centroEditForm.ativo = !!c.ativo
  isEditCentroOpen.value = true
}

const updateCentro = async () => {
  updatingCentro.value = true
  try {
    if (!centroEditForm.nome) throw new Error('Nome é obrigatório')
    const session = await client.auth.getSession();
    const token = session?.data?.session?.access_token || null;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const body = { nome: centroEditForm.nome.trim(), descricao: centroEditForm.descricao || null, ativo: centroEditForm.ativo }
    const res = await $fetch(`/api/centros-custo/${centroEditForm.id}`, { method: 'PUT', headers, body })
    if (!res || res.success === false) throw new Error(res?.error || 'Falha ao atualizar')
    toast.add({ title: 'Sucesso', description: 'Centro atualizado.' })
    isEditCentroOpen.value = false
    await fetchManagedCentros()
    await fetchCentros()
  } catch (err) {
    console.error('Erro ao atualizar centro:', err)
    toast.add({ title: 'Erro', description: String(err?.message || err || 'Erro desconhecido'), color: 'red' })
  } finally {
    updatingCentro.value = false
  }
}
</script>

<NuxtPage />
