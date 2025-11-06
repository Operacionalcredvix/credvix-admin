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
          <USelect v-model="form.loja_id" :options="lojasOptions" placeholder="Selecione uma loja" />
        </div>
        <div>
          <label class="block text-sm text-gray-600">Centro de Custo</label>
          <div class="flex items-center gap-2">
            <USelect v-model="form.centro_custo_id" :options="centrosOptions" placeholder="Selecione centro" />
            <UButton size="sm" color="primary" variant="ghost" @click="isCreateCentroOpen = true">+ Centro</UButton>
            <UButton size="sm" color="gray" variant="ghost" @click="isManageCentrosOpen = true">Gerenciar</UButton>
          </div>
        </div>
        <div>
          <label class="block text-sm text-gray-600">Data de Vencimento</label>
          <UInput v-model="form.data_vencimento" type="date" />
        </div>
        <div>
          <label class="block text-sm text-gray-600">Valor (R$)</label>
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
    
    <!-- Edit Modal -->
    <UModal v-model="isEditModalOpen">
      <UCard>
        <template #header>
          <h3 class="text-base font-semibold">Editar Lançamento</h3>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-gray-600">Loja</label>
            <USelect v-model="editForm.loja_id" :options="lojasOptions" />
          </div>
          <div>
            <label class="block text-sm text-gray-600">Centro de Custo</label>
            <USelect v-model="editForm.centro_custo_id" :options="centrosOptions" />
          </div>
          <div>
            <label class="block text-sm text-gray-600">Data de Vencimento</label>
            <UInput v-model="editForm.data_vencimento" type="date" />
          </div>
          <div>
            <label class="block text-sm text-gray-600">Valor (R$)</label>
            <UInput v-model="editForm.valor" type="number" step="0.01" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm text-gray-600">Descrição</label>
            <textarea v-model="editForm.descricao" rows="3" class="w-full border rounded px-3 py-2" placeholder="Descrição (opcional)"></textarea>
          </div>
        </div>
        <div class="flex justify-end space-x-2 pt-4">
          <UButton color="gray" variant="ghost" @click="isEditModalOpen = false">Cancelar</UButton>
          <UButton :loading="editing" @click="saveEdit">Salvar</UButton>
        </div>
      </UCard>
    </UModal>

    <!-- Create Centro de Custo Modal (quick-create) -->
    <UModal v-model="isCreateCentroOpen">
      <UCard>
        <template #header>
          <h3 class="text-base font-semibold">Novo Centro de Custo</h3>
        </template>
        <div class="grid grid-cols-1 gap-4">
          <div>
            <label class="block text-sm text-gray-600">Nome</label>
            <UInput v-model="centroForm.nome" placeholder="Nome do centro" />
          </div>
          <div>
            <label class="block text-sm text-gray-600">Descrição</label>
            <UInput v-model="centroForm.descricao" />
          </div>
        </div>
        <div class="flex justify-end space-x-2 pt-4">
          <UButton color="gray" variant="ghost" @click="closeCreateCentro">Cancelar</UButton>
          <UButton :loading="creatingCentro" @click="createCentro">Criar Centro</UButton>
        </div>
      </UCard>
    </UModal>

    <!-- Manage Centros Modal -->
    <UModal v-model="isManageCentrosOpen">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold">Gerenciar Centros de Custo</h3>
            <div>
              <UButton size="sm" color="primary" variant="ghost" @click="fetchManagedCentros">Atualizar</UButton>
            </div>
          </div>
        </template>
        <div class="space-y-3">
          <div v-if="managedError" class="text-red-500">{{ managedError }}</div>
          <div v-for="c in managedCentros" :key="c.id" class="flex items-center justify-between p-2 border rounded">
            <div>
              <div class="font-medium">{{ c.nome }}</div>
              <div class="text-sm text-gray-600">{{ c.descricao }}</div>
              <div class="text-xs text-gray-500">{{ c.codigo }} • {{ c.ativo ? 'Ativo' : 'Inativo' }}</div>
            </div>
            <div class="flex items-center gap-2">
              <UButton size="sm" color="primary" variant="ghost" @click="openEditCentro(c)">Editar</UButton>
              <UButton size="sm" :color="c.ativo ? 'red' : 'green'" variant="ghost" @click="toggleCentroActive(c)">{{ c.ativo ? 'Desativar' : 'Ativar' }}</UButton>
            </div>
          </div>
        </div>
        <div class="flex justify-end pt-4">
          <UButton color="gray" variant="ghost" @click="closeManageCentros">Fechar</UButton>
        </div>
      </UCard>
    </UModal>

    <!-- Edit Centro Modal -->
    <UModal v-model="isEditCentroOpen">
      <UCard>
        <template #header>
          <h3 class="text-base font-semibold">Editar Centro de Custo</h3>
        </template>
        <div class="grid grid-cols-1 gap-4">
          <div>
            <label class="block text-sm text-gray-600">Nome</label>
            <UInput v-model="centroEditForm.nome" />
          </div>
          <div>
            <label class="block text-sm text-gray-600">Descrição</label>
            <UInput v-model="centroEditForm.descricao" />
          </div>
          <div>
            <label class="inline-flex items-center gap-2"><input type="checkbox" v-model="centroEditForm.ativo" /> Ativo</label>
          </div>
        </div>
        <div class="flex justify-end space-x-2 pt-4">
          <UButton color="gray" variant="ghost" @click="isEditCentroOpen = false">Cancelar</UButton>
          <UButton :loading="updatingCentro" @click="updateCentro">Salvar</UButton>
        </div>
      </UCard>
    </UModal>

    <UCard class="mt-6">
      <template #header>
        <h3 class="text-lg font-semibold">Lançamentos</h3>
      </template>
      <div class="flex items-center gap-4 mb-4">
        <div>
          <UButton size="sm" color="red" variant="ghost" :pressed="filters.onlyVencidos" @click="toggleOnlyVencidos">Vencidos</UButton>
        </div>
        <div class="w-48">
          <USelect v-model="filters.loja_id" :options="lojasOptions" placeholder="Todas as lojas" clearable />
        </div>
        <div class="w-48">
          <USelect v-model="filters.centro_custo_id" :options="centrosOptions" placeholder="Todos os centros" clearable />
        </div>
        <div class="w-40">
          <USelect v-model="filters.status" :options="[{ label: 'Todos', value: null }, { label: 'Pendente', value: 'pendente' }, { label: 'Pago', value: 'pago' }, { label: 'Cancelado', value: 'cancelado' }]" placeholder="Status" clearable />
        </div>
        <div>
          <UInput type="date" v-model="filters.date_from" placeholder="De" />
        </div>
        <div>
          <UInput type="date" v-model="filters.date_to" placeholder="Até" />
        </div>
        <div class="ml-auto flex items-center gap-2">
          <UButton color="primary" variant="ghost" @click="doFilter">Filtrar</UButton>
          <UButton color="gray" variant="ghost" @click="resetFilters">Limpar</UButton>
          <UButton color="gray" variant="ghost" @click="exportCsv">Export CSV</UButton>
        </div>
      </div>

      <div v-if="listError" class="p-4 text-red-500">{{ listError }}</div>

      <UTable v-else :rows="lancamentos" :columns="columns" :empty-state="{ icon: 'i-heroicons-archive-box-x-mark', label: 'Nenhum lançamento encontrado.' }">
                <template #centro="{ row }">
                          <div :class="rowHighlightClass(row)">
                            <span>{{ row.centro_display || getCentroName(row) || 'N/D' }}</span>
                          </div>
                </template>
          <template #descricao="{ row }">
            <div :class="rowHighlightClass(row)">{{ row.descricao }}</div>
          </template>
        <template #vencido="{ row }">
          <div>
            <template>
              <!-- calcula dias de diferença entre hoje e data_vencimento -->
              <span v-if="!row.data_vencimento">-</span>
              <template v-else>
                  <UBadge v-if="isOverdue(row)" color="red" :label="overdueLabel(row)" :title="`Vencimento: ${row.data_vencimento} — ${daysDiff(row.data_vencimento)} dia(s) de atraso`" />
                  <UBadge v-else-if="isDueSoon(row)" color="yellow" :label="dueSoonLabel(row)" :title="`Vencimento: ${row.data_vencimento}`" />
                  <UBadge v-else color="gray" :label="dueInLabel(row)" :title="`Vencimento: ${row.data_vencimento}`" />
              </template>
            </template>
          </div>
        </template>
        <template #status="{ row }">
          <div>
            <UBadge v-if="isPaid(row)" color="green" label="Pago" />
            <UBadge v-else-if="row.status === 'cancelado'" color="red" label="Cancelado" />
            <UBadge v-else color="yellow" label="Pendente" />
          </div>
        </template>
        <template #loja="{ row }">
          <div :class="rowHighlightClass(row)">{{ row.loja_display || getLojaName(row) || 'N/D' }}</div>
        </template>
        <template #data_vencimento="{ row }">
          <div :class="rowHighlightClass(row)">{{ formatDate(row.data_vencimento) }}</div>
        </template>
        <template #lancamento="{ row }">
          <div :class="rowHighlightClass(row)">{{ formatDate(row.criado_em || row.created_at || row.lancamento) }}</div>
        </template>
        <template #valor="{ row }">
          <div :class="rowHighlightClass(row)">{{ formatCurrency(row.valor) }}</div>
        </template>
        <template #acoes="{ row }">
            <div class="flex items-center gap-2">
            <UButton v-if="!isPaid(row)" size="sm" color="green" variant="ghost" @click="markAsPaid(row)">Marcar Pago</UButton>
            <UButton size="sm" color="primary" variant="ghost" @click="openEdit(row)">Editar</UButton>
            <UButton size="sm" color="red" variant="ghost" @click="remove(row)">Excluir</UButton>
          </div>
        </template>
      </UTable>

      <!-- Paginação simples -->
      <div class="flex items-center justify-between mt-4">
        <div class="text-sm text-gray-600">Mostrando pagina {{ page }} — total {{ totalCount }}</div>
        <div class="flex items-center gap-2">
          <UButton size="sm" :disabled="page<=1" @click="prevPage">Anterior</UButton>
          <UButton size="sm" :disabled="(page*pageSize) >= totalCount" @click="nextPage">Próxima</UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';

const client = useSupabaseClient();
const toast = useToast();

const lojas = ref([]);
const lancamentos = ref([]);
const lojaMap = ref({});
const lojasOptions = ref([]);
const centros = ref([]);
const centrosOptions = ref([]);
const centroMap = ref({});

const form = reactive({
  loja_id: null,
  centro_custo_id: null,
  descricao: '',
  data_vencimento: '',
  valor: ''
});

const saving = ref(false);
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
  { key: 'loja', label: 'Loja' },
  { key: 'data_vencimento', label: 'Vencimento' },
  { key: 'lancamento', label: 'Lançamento' },
  { key: 'valor', label: 'Valor' }
];

// adiciona coluna de ações (UTable renderiza slots mesmo sem coluna explícita)
columns.push({ key: 'acoes', label: 'Ações' })

// adiciona coluna de status
columns.splice(columns.length - 1, 0, { key: 'status', label: 'Status' })

// --- AÇÕES: Marcar pago / Edit / Delete ---
const isEditModalOpen = ref(false)
const editForm = reactive({ id: null, loja_id: null, centro_custo_id: null, descricao: '', data_vencimento: '', valor: '' })
const editing = ref(false)

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
  editForm.id = row.id
  // defensivo: aceite id vindo direto ou em objeto aninhado
  editForm.loja_id = row.loja_id ?? row.loja?.id ?? row.lojaId ?? row.lojas?.id ?? null
  editForm.centro_custo_id = row.centro_custo_id ?? row.centro?.id ?? row.centro_custo?.id ?? row.centroId ?? row.centros_custo?.id ?? null
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
      descricao: editForm.descricao,
      data_vencimento: editForm.data_vencimento,
      valor: Number(editForm.valor)
    }
    const res = await $fetch(`/api/financeiro/contas-pagar/${editForm.id}`, { method: 'PUT', headers, body: payload })
    if (!res || res.success === false) throw new Error(res?.error || 'Falha ao atualizar')
    toast.add({ title: 'Sucesso', description: 'Lançamento atualizado.' })
    isEditModalOpen.value = false
    await fetchLancamentos()
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

const resetFilters = async () => {
  filters.loja_id = null
  filters.centro_custo_id = null
  filters.status = null
  filters.date_from = null
  filters.date_to = null
  page.value = 1
  await fetchLancamentos()
}

const fetchCentros = async () => {
  try {
    const res = await client.from('centros_custo').select('id,nome').eq('ativo', true)
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
    // helper: parse JSON strings that may arrive stringified
    const tryParseJson = (v) => {
      try {
        if (typeof v === 'string') {
          const s = v.trim()
          if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
            return JSON.parse(s)
          }
        }
      } catch (e) {
        // ignore parse errors
      }
      return v
    }

    // normalize rows to expected shape (accept snake_case or camelCase or nested objects coming from backend)
    const rows = (res.data || []).map(r => {
      // try to coerce nested/json fields into objects
      const rawLoja = r.lojas ?? r.loja ?? r.store ?? null
      const rawCentro = r.centros_custo ?? r.centro ?? null
      const lojaObj = tryParseJson(rawLoja)
      const centroObj = tryParseJson(rawCentro)
      return ({
        ...r,
        // ids (aceita campos diretos ou vindos no objeto relacionado retornado pelo servidor)
        loja_id: r.loja_id ?? r.lojaId ?? (lojaObj && (lojaObj.id ?? lojaObj.ID)) ?? r.loja?.id ?? null,
        centro_custo_id: r.centro_custo_id ?? r.centroCustoId ?? (centroObj && (centroObj.id ?? centroObj.ID)) ?? r.centro?.id ?? null,
        // nested objects (parsed when stringified)
        loja: lojaObj,
        centro: centroObj,
        // dates / values
        data_vencimento: r.data_vencimento ?? r.dataVencimento ?? null,
        criado_em: r.criado_em ?? r.created_at ?? r.lancamento ?? r.criadoEm ?? null,
        valor: r.valor !== undefined && r.valor !== null ? Number(r.valor) : 0,
        pago: r.pago
      })
    })
    // adiciona campos de exibição já formatados para evitar que objetos nested apareçam como JSON
    const rowsWithDisplay = rows.map(r => ({
      ...r,
      centro_display: getCentroName(r),
      loja_display: getLojaName(r)
    }))
    lancamentos.value = rows;
    // expõe também a lista com displays para garantir templates recebam strings
    lancamentos.value = rowsWithDisplay;
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
  const headersRow = ['id','loja','centro_custo','descricao','data_vencimento','valor','status','pago','data_pagamento','lancamento','vencido_dias'];
    csvRows.push(headersRow.join(','));
    for (const r of rows) {
      // defensive name resolution: prefer maps, then nested objects, then fallback fields
      const lojaNome = lojaMap.value[r.loja_id] || r.lojas?.nome || r.loja?.nome || r.loja_nome || r.lojaName || '';
      const centroNome = centroMap.value[r.centro_custo_id] || r.centros_custo?.nome || r.centro?.nome || r.centro_nome || r.centroName || '';
      const vencidoDias = daysDiff(r.data_vencimento ?? r.dataVencimento);
      const createdAtVal = r.criado_em ?? r.created_at ?? r.lancamento ?? r.criadoEm ?? '';
  const vals = [r.id, `"${(lojaNome||'').replace(/"/g,'\"')}"`, `"${(centroNome||'').replace(/"/g,'\"')}"`, `"${(r.descricao||'').replace(/"/g,'\"')}"`, (r.data_vencimento ?? r.dataVencimento) || '', `"${formatCurrency(r.valor)}"`, r.status || '', r.pago ? 'TRUE' : 'FALSE', r.data_pagamento || '', createdAtVal, (vencidoDias === null ? '' : String(vencidoDias))];
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
const toggleOnlyVencidos = () => { filters.onlyVencidos = !filters.onlyVencidos; page.value = 1; fetchLancamentos() }
const doFilter = () => { page.value = 1; fetchLancamentos() }
const prevPage = () => { page.value = Math.max(1, page.value - 1); fetchLancamentos() }
const nextPage = () => { page.value = page.value + 1; fetchLancamentos() }

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
      descricao: form.descricao || null,
      data_vencimento: form.data_vencimento,
      valor: Number(form.valor)
    };

    const res = await $fetch('/api/financeiro/contas-pagar', { method: 'POST', headers, body });
    if (!res || res.success === false) throw new Error(res?.error || 'Falha ao registrar');

    toast.add({ title: 'Sucesso', description: 'Lançamento registrado.' });
    // limpa form e recarrega lista
    form.descricao = '';
    form.data_vencimento = '';
    form.valor = '';
    form.loja_id = null;
    await fetchLancamentos();
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
  await fetchCentros();
  await fetchLancamentos();
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
