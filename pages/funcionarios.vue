<template>
  <div>
    <UCard class="mb-8">
      <template #header>
        <h3 class="text-primary-500 text-lg font-semibold">Buscar Funcionário</h3>
      </template>
      <div class=" flex flex-col gap-4">
        <label for="search-employee-input" class="form-label">Buscar por Nome ou CPF</label>
        <UInput v-model="searchTerm" id="search-employee-input" placeholder="Digite para buscar..."
          icon="i-heroicons-magnifying-glass" size="lg" />

        <UTable :rows="searchResults" :columns="columns" :loading="searching"
          :empty-state="{ icon: 'i-heroicons-circle-stack', label: 'Nenhum funcionário encontrado.' }">
          <template #is_active-data="{ row }">
            <UBadge :label="row.is_active ? 'Ativo' : 'Inativo'" :color="row.is_active ? 'green' : 'red'" variant="subtle" />
          </template>

          <template #ultimo_login-data="{ row }">
            <div v-if="row.ultimo_login" class="text-sm">
              <div>{{ formatarDataHora(row.ultimo_login) }}</div>
              <div v-if="row.ultimo_ip" class="text-xs text-gray-500">{{ row.ultimo_ip }}</div>
            </div>
            <span v-else class="text-xs text-gray-400">Nunca acessou</span>
          </template>

          <template #actions-data="{ row }">
            <UButton icon="i-heroicons-pencil" size="sm" color="gray" variant="ghost" @click="handleEdit(row)" />

            <UTooltip text="Redefinir Senha">
              <UButton icon="i-heroicons-key" size="sm" color="orange" variant="ghost"
                @click="handleResetPassword(row)" />
            </UTooltip>
          </template>
        </UTable>
      </div>
    </UCard>

    <header class="mb-8 flex justify-between items-center">
      <div>
        <h1 id="form-title" class="text-3xl font-bold">{{ formTitle }}</h1>
        <p id="form-subtitle" class="text-gray-600">{{ formSubtitle }}</p>
      </div>
      <UButton v-if="formData.id" @click="resetForm" label="Cancelar Edição" color="gray" />
    </header>

    <form @submit.prevent="handleFormSubmit" class="space-y-6 max-w-4xl">
      <input type="hidden" v-model="formData.id">

      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Informações Pessoais e de Acesso</h3>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <UFormGroup label="Nome Completo *" name="nome_completo" :error="cpfError">
              <UInput v-model="formData.nome_completo" id="full-name" required placeholder="Nome Completo" />
            </UFormGroup>
          </div>
          <div>
            <UFormGroup label="Data de Nascimento" name="data_nascimento">
              <UInput v-model="formData.data_nascimento" id="birth-date" type="date" placeholder="Data de Nascimento" />
            </UFormGroup>
          </div>
          <div>
            <UFormGroup label="Nome da Mãe" name="nome_mae">
              <UInput v-model="formData.nome_mae" id="mother-name" placeholder="Nome da Mãe" />
            </UFormGroup>
          </div>
          <div>
            <UFormGroup label="CPF *" name="cpf" :error="cpfError">
              <UInput v-model="formData.cpf" id="cpf" required placeholder="000.000.000-00"
                @blur="validateCpfOnBlur" />
            </UFormGroup>
          </div>
          <div>
            <UFormGroup label="Email *" name="email">
              <UInput v-model="formData.email" id="employee-email" type="email" required placeholder="Email" :disabled="!!formData.id" />
            </UFormGroup>
          </div>
          <div>
            <UFormGroup label="Telefone" name="telefone">
              <UInput v-model="formData.telefone" id="phone" placeholder="(00) 00000-0000" />
            </UFormGroup>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Informações de Contato e Endereço</h3>
        </template>
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <UFormGroup label="CEP" name="cep">
                <UInput v-model="formData.cep" id="cep" placeholder="00000-000" @blur="consultarCEP" :loading="cepLoading" />
              </UFormGroup>
            </div>
            <div>
              <UFormGroup label="Endereço" name="endereco">
                <UInput v-model="formData.endereco" id="address" placeholder="Digite o endereço" />
              </UFormGroup>
            </div>
            <div>
              <UFormGroup label="Número" name="numero_endereco">
                <UInput v-model="formData.numero_endereco" id="address-number" placeholder="000" />
              </UFormGroup>
            </div>
            <div>
            <UFormGroup label="Complemento" name="complemento_endereco">
              <UInput v-model="formData.complemento_endereco" id="address-complement" placeholder="Digite o complemento" />
            </UFormGroup>
            </div>
            <div> 
              <UFormGroup label="Bairro" name="bairro">
                <UInput v-model="formData.bairro" id="neighborhood" placeholder="Digite o bairro" />
              </UFormGroup>
            </div>
            <div>
              <UFormGroup label="Cidade" name="cidade">
                <UInput v-model="formData.cidade" id="city" placeholder="Digite a cidade" />
              </UFormGroup>
            </div>
            <div>
              <UFormGroup label="Estado" name="estado">
                <UInput v-model="formData.estado" id="state" placeholder="Digite o estado" /> 
              </UFormGroup>
            </div>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Informações Organizacionais</h3>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <UFormGroup label="Perfil de Acesso *" name="perfil_id">
              <USelectMenu v-model="formData.perfil_id" :options="perfisPermitidos" value-attribute="id"
                option-attribute="nome" required placeholder="Selecione o Perfil de Acesso" />
            </UFormGroup>
          </div>
          <div v-if="isSetorTrabalhoVisible">
            <UFormGroup label="Setor de Trabalho" name="setor_trabalho" :required="isSetorTrabalhoRequired">
              <USelectMenu v-model="formData.setor_trabalho" :options="setoresOptions" 
                placeholder="Selecione o setor" />
            </UFormGroup>
          </div>
          <div v-if="isLiderVisible">
            <UFormGroup label="Líder Direto" name="gerente_id">
              <USelectMenu v-model="formData.gerente_id" :options="lideres" value-attribute="id"
                option-attribute="nome_completo" placeholder="Líder Direto" :disabled="isLiderDisabled" />
            </UFormGroup>
          </div>
          <div v-if="isRegionalVisible">
            <UFormGroup label="Regional" name="regional_id">
              <USelectMenu v-model="formData.regional_id" :options="regionais" value-attribute="id"
                option-attribute="nome_regional" :disabled="isRegionalDisabled" placeholder="Regional" />
            </UFormGroup>
          </div>
          <div v-if="isLojaVisible">
            <UFormGroup label="Loja" name="loja_id">
              <USelectMenu v-model="formData.loja_id" :options="lojasFiltradas" value-attribute="id" 
                option-attribute="nome" :disabled="isLojaDisabled" placeholder="Loja" />
            </UFormGroup>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Status e Vínculo Contratual</h3>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div>
            <label for="admission-date" class="form-label">Data de Admissão *</label>
            <UInput v-model="formData.data_admissao" id="admission-date" type="date" required />
          </div>
          <div>
            <label for="exit-date" class="form-label">Data de Saída</label>
            <UInput v-model="formData.data_saida" id="exit-date" type="date" />
          </div>
          <div class="flex items-center space-x-2 pt-4">
            <UToggle v-model="formData.is_active" @update:modelValue="onChangeIsActive" />
            <label>Status do Funcionário Ativo</label>
          </div>
        </div>
      </UCard>

      <!-- Histórico de Vínculos -->
      <UCard v-if="formData.id && vinculosHistorico.length" class="mt-4">
        <template #header>
          <h3 class="text-lg font-semibold">Histórico de Vínculos</h3>
        </template>
        <UTable :rows="vinculosFormatados" :columns="historicoColumns"
          :empty-state="{ icon: 'i-heroicons-clock', label: 'Sem registros de vínculo.' }">
          <template #data_saida-data="{ row }">
            <span>{{ row.data_saida || '—' }}</span>
          </template>
          <template #status-data="{ row }">
            <UBadge :label="row.status" :color="row.status === 'Encerrado' ? 'red' : 'primary'" variant="subtle" />
          </template>
        </UTable>
      </UCard>

      <!-- Modal de Confirmação de Inativação -->
      <UModal v-model="showInactivateModal">
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Confirmar Inativação</h3>
          </template>
          <div class="space-y-4">
            <p>Você está inativando este funcionário. Informe a Data de Saída para concluir.</p>
            <UFormGroup label="Data de Saída" name="confirm_data_saida">
              <UInput type="date" v-model="tempDataSaida" />
            </UFormGroup>
          </div>
          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton color="gray" variant="ghost" @click="cancelInactivation">Cancelar</UButton>
              <UButton color="red" @click="confirmInactivation">Confirmar</UButton>
            </div>
          </template>
        </UCard>
      </UModal>

      <div class="flex justify-end pt-4">
        <UButton type="submit" :label="formButtonText" size="lg" :loading="saving" />
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { useCpfValidation } from '~/composables/useCpfValidation';
import { useInputMasks } from '~/composables/useInputMasks';
import { useCepLookup } from '~/composables/useCepLookup';

definePageMeta({
  middleware: 'auth',
  profiles: ['RH']
});

const supabase = useSupabaseClient();
const saving = ref(false);
const toast = useToast(); // Sistema de notificações do Nuxt UI


// --- ESTADO INICIAL DO FORMULÁRIO (Vazio) ---
const getInitialFormData = () => ({
  id: null,
  nome_completo: '', data_nascimento: null, nome_mae: '', cpf: '', email: '', telefone: '',
  cep: '', endereco: '', numero_endereco: '', complemento_endereco: '', bairro: '', cidade: '', estado: '',
  perfil_id: null, gerente_id: null, regional_id: null, loja_id: null, setor_trabalho: null,
  data_admissao: new Date().toISOString().split('T')[0], data_saida: null, is_active: true,
  vinculoId: null // Para guardar o ID do vínculo e facilitar o update
});

// --- ESTADO DO FORMULÁRIO ---
const formData = reactive(getInitialFormData());

// --- BUSCA DE FUNCIONÁRIOS ---
const searchTerm = ref('');
const searchResults = ref([]);
const searching = ref(false);

const cpfError = ref(''); // Usado para validação de CPF
const columns = [
  { key: 'nome_completo', label: 'Nome Completo', sortable: true }, 
  { key: 'perfis.nome', label: 'Perfil' },
  { key: 'lojas.nome', label: 'Loja' }, 
  { key: 'is_active', label: 'Status' }, 
  { key: 'ultimo_login', label: 'Último Acesso' },
  { key: 'actions', label: 'Ações' }
];

// Histórico de vínculos (UI)
const vinculosHistorico = ref([]);
const historicoColumns = [
  { key: 'data_admissao', label: 'Admissão' },
  { key: 'data_saida', label: 'Saída' },
  { key: 'status', label: 'Status' },
];
const formatDate = (d) => d ? new Date(d).toISOString().split('T')[0] : null;
const formatarDataHora = (d) => {
  if (!d) return null;
  const date = new Date(d);
  return date.toLocaleString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
const vinculosFormatados = computed(() => (vinculosHistorico.value || []).map((v) => ({
  data_admissao: formatDate(v.data_admissao),
  data_saida: formatDate(v.data_saida),
  status: v.data_saida ? 'Encerrado' : 'Ativo no período'
})));

// Modal de inativação
const showInactivateModal = ref(false);
const tempDataSaida = ref(null);

// --- COMPOSABLES ---
const { isValidCPF } = useCpfValidation();
const { applyCpfMask, applyPhoneMask } = useInputMasks();
applyCpfMask(computed(() => formData.cpf));
applyPhoneMask(computed(() => formData.telefone));
const { loading: cepLoading, error: cepErrorApi, lookupCep } = useCepLookup();

// --- CARREGAMENTO INICIAL DE DADOS (OTIMIZADO) ---
const { data: initialData } = await useAsyncData('funcionarios-form-data', async () => {
  const user = useSupabaseUser();
  if (!user.value?.id) return { perfis: [], regionais: [], lojas: [], meuPerfil: null, todosLideres: [] };

  const [perfisRes, regionaisRes, lojasRes, meuPerfilRes, todosLideresRes] = await Promise.all([
    supabase.from('perfis').select('id, nome').order('nome'),
    supabase.from('regionais').select('id, nome_regional, coordenador_id').order('nome_regional'),
    supabase.from('lojas').select('id, nome, regional_id').order('nome'),
    supabase.from('funcionarios').select(`
      id, user_id, perfil_id, loja_id,
      perfis (nome),
      lojas (id, regional_id)
    `).eq('user_id', user.value.id).single(),
    // Otimização: Carrega todos os funcionários que podem ser líderes (Coordenadores e Supervisores)
    supabase.from('funcionarios').select(`
      id, nome_completo, loja_id,
      perfil:perfil_id (nome)
    `).in('perfil_id', (await supabase.from('perfis').select('id').in('nome', ['Coordenador', 'Supervisor'])).data.map(p => p.id))
      .eq('is_active', true)
  ]);

  return {
    perfis: perfisRes.data || [],
    regionais: regionaisRes.data || [],
    lojas: lojasRes.data || [],
    meuPerfil: meuPerfilRes.data || null,
    todosLideres: todosLideresRes.data || []
  };
});

// --- DADOS PARA OS DROPDOWNS (Refs populadas a partir do useAsyncData) ---
const perfis = ref(initialData.value?.perfis || []);
const regionais = ref(initialData.value?.regionais || []);
const todasLojas = ref(initialData.value?.lojas || []);
const meuPerfil = ref(initialData.value?.meuPerfil || null);
const todosLideres = ref(initialData.value?.todosLideres || []);

// --- LÓGICA DE PRÉ-SELEÇÃO PARA GESTORES ---
onMounted(() => {
  const userProfileName = meuPerfil.value?.perfis?.nome;
  if (userProfileName === 'Coordenador') {
    const minhaRegional = regionais.value.find(r => r.coordenador_id === meuPerfil.value.id);
    if (minhaRegional) formData.regional_id = minhaRegional.id;
  } else if (userProfileName === 'Supervisor') {
    formData.regional_id = meuPerfil.value?.lojas?.regional_id;
    formData.loja_id = meuPerfil.value?.lojas?.id;
  }
});

// LÓGICA DE BUSCA
watch(searchTerm, useDebounceFn(async (newVal) => {
  if (newVal.length < 3) { searchResults.value = []; return; }
  searching.value = true;
  // OTIMIZAÇÃO: Expande o select para trazer todos os dados necessários para a edição de uma só vez,
  // incluindo o histórico de vínculo, evitando uma consulta extra ao clicar em "Editar".
  const { data } = await supabase
    .from('funcionarios')
    .select(`
      *,
      perfis ( nome ),
      lojas ( *, regionais ( id, nome_regional ) ),
      historico_vinculos ( * )
    `)
    .or(`nome_completo.ilike.%${newVal}%,cpf.ilike.%${newVal}%`).limit(10);
  searchResults.value = data || [];
  searching.value = false;
}, 300));

// --- LÓGICA DE EDIÇÃO (REATORADA E CORRIGIDA) ---
let isEditing = false; // Flag para controlar o modo de edição

const handleEdit = (employee) => {
  isEditing = true; // Sinaliza que estamos a carregar dados para edição
  resetForm();

  // Processa o histórico de vínculo que já foi carregado na busca.
  let vinculo = null;
  if (employee.historico_vinculos && employee.historico_vinculos.length > 0) {
    const vinculosOrdenados = [...employee.historico_vinculos].sort((a, b) => new Date(b.data_admissao) - new Date(a.data_admissao));
    vinculo = vinculosOrdenados[0];
    vinculosHistorico.value = vinculosOrdenados;
  }

  // Preenche o formulário com todos os dados.
  // A flag 'isEditing' impede que os watchers limpem os campos durante esta atribuição.
  Object.assign(formData, {
    ...employee,
    regional_id: employee.lojas?.regional_id || null,
    loja_id: employee.loja_id,
    gerente_id: employee.gerente_id,
    data_admissao: vinculo?.data_admissao || null,
    data_saida: vinculo?.data_saida || null,
    vinculoId: vinculo?.id || null
  });

  // Rola a página para o formulário para uma melhor experiência do utilizador.
  document.getElementById('form-title').scrollIntoView({ behavior: 'smooth' });

  // Após o preenchimento, reativa a lógica normal dos watchers.
  // O nextTick garante que a reativação ocorra após o ciclo de atualização do DOM.
  nextTick(() => {
    isEditing = false;
  });
};

// Dispara modal ao mudar o status para inativo
function onChangeIsActive(newVal) {
  if (newVal === false) {
    tempDataSaida.value = new Date().toISOString().split('T')[0];
    showInactivateModal.value = true;
  } else {
    // Ativou novamente; não obriga limpar a data de saída, o submit tratará como recontratação
  }
}

function cancelInactivation() {
  showInactivateModal.value = false;
  // Reverte toggle
  formData.is_active = true;
}

function confirmInactivation() {
  if (!tempDataSaida.value) {
    toast.add({ title: 'Data de saída obrigatória', description: 'Informe a data de saída para inativar.', color: 'amber' });
    return;
  }
  formData.data_saida = tempDataSaida.value;
  showInactivateModal.value = false;
}

// --- LÓGICA DINÂMICA DO FORMULÁRIO ---
const formTitle = computed(() => formData.id ? 'Editar Cadastro' : 'Novo Cadastro de Funcionário');
const formSubtitle = computed(() => formData.id ? `A editar o perfil de ${formData.nome_completo}.` : 'Preencha os dados para criar um novo funcionário.');
const formButtonText = computed(() => formData.id ? 'Salvar Alterações' : 'Salvar Novo Funcionário');

const selectedProfileName = computed(() => perfis.value.find(p => p.id === formData.perfil_id)?.nome || '');
const meuPerfilNome = computed(() => meuPerfil.value?.perfis?.nome);

// --- OPÇÕES DE SETORES ---
const setoresOptions = [
  { label: 'Administrativo', value: 'Administrativo' },
  { label: 'Financeiro', value: 'Financeiro' },
  { label: 'RH', value: 'RH' },
  { label: 'TI', value: 'TI' },
  { label: 'Backoffice', value: 'Backoffice' }
];

// --- LÓGICA DE VISIBILIDADE DOS CAMPOS ORGANIZACIONAIS ---
const isSetorTrabalhoVisible = computed(() =>
  ['Master', 'Diretoria', 'Gerência', 'RH', 'Financeiro', 'Administrativo', 'Backoffice', 'TI'].includes(selectedProfileName.value)
);const isSetorTrabalhoRequired = computed(() => 
  ['RH', 'Financeiro', 'Administrativo', 'TI'].includes(selectedProfileName.value)
);

const isRegionalVisible = computed(() => ['Supervisor', 'Consultor'].includes(selectedProfileName.value));
const isLiderVisible = computed(() => ['Supervisor', 'Consultor'].includes(selectedProfileName.value));
const isLojaVisible = computed(() => ['Supervisor', 'Consultor'].includes(selectedProfileName.value));

import { isMasterPerfil } from '~/composables/usePermissions';

const perfisPermitidos = computed(() => {
  if (!meuPerfilNome.value) return [];
  // Master-like (Master, Diretoria, Gerência) e RH têm acesso a todos os perfis
  if (isMasterPerfil(meuPerfilNome.value) || meuPerfilNome.value === 'RH') return perfis.value;
  if (meuPerfilNome.value === 'Coordenador') return perfis.value.filter(p => ['Supervisor', 'Consultor', 'Coordenador'].includes(p.nome));
  if (meuPerfilNome.value === 'Supervisor') return perfis.value.filter(p => ['Consultor', 'Supervisor'].includes(p.nome));
  return [];
});

// --- LÓGICA PARA DESABILITAR CAMPOS ---
const isRegionalDisabled = computed(() => {
  // CORREÇÃO: A regional nunca deve ser desabilitada se for visível.
  // A lógica de dependência foi invertida: seleciona-se a regional, depois a loja, depois o líder.
  return false;
});

const isLojaDisabled = computed(() => {
  // CORREÇÃO: A loja só é habilitada após selecionar a regional.
  return !formData.regional_id;
});

const isLiderDisabled = computed(() => {
  // CORREÇÃO: O líder só é habilitado após selecionar a loja.
  return !formData.loja_id;
});

// Otimização: Filtra a lista de líderes pré-carregada em vez de fazer uma nova chamada de API.
const lideres = computed(() => {
  // CORREÇÃO: Filtra líderes pela loja selecionada.
  if (!formData.loja_id) return [];
  if (selectedProfileName.value === 'Supervisor') {
    // O líder de um Supervisor é o Coordenador da regional da loja.
    const regionalDaLoja = regionais.value.find(r => r.id === formData.regional_id);
    if (!regionalDaLoja?.coordenador_id) return [];
    return todosLideres.value.filter(l => l.id === regionalDaLoja.coordenador_id);
  }
  if (selectedProfileName.value === 'Consultor') {
    // O líder de um Consultor é um Supervisor da mesma loja.
    return todosLideres.value.filter(l => l.perfil.nome === 'Supervisor' && l.loja_id === formData.loja_id);
  }
  return [];
});

// WATCHERS PARA REATIVIDADE DO FORMULÁRIO
watch(() => formData.perfil_id, (newPerfilId, oldPerfilId) => {
  // Só limpa os campos se a mudança for feita pelo utilizador (não durante a edição)
  if (isEditing || newPerfilId === oldPerfilId) return;

  formData.regional_id = null;
  formData.loja_id = null;
  formData.gerente_id = null;

  // Preenche automaticamente o setor_trabalho baseado no perfil
  const perfilSelecionado = perfis.value.find(p => p.id === newPerfilId);
  if (perfilSelecionado?.nome === 'Master') {
    formData.setor_trabalho = 'Administrativo'; // Padrão para Master
  } else if (perfilSelecionado?.nome === 'Diretoria') {
    formData.setor_trabalho = 'Administrativo'; // Diretoria é administrativo
  } else if (perfilSelecionado?.nome === 'Gerência') {
    formData.setor_trabalho = 'Administrativo'; // Gerência é administrativo
  } else if (perfilSelecionado?.nome === 'RH') {
    formData.setor_trabalho = 'RH';
  } else if (perfilSelecionado?.nome === 'Financeiro') {
    formData.setor_trabalho = 'Financeiro';
  } else if (perfilSelecionado?.nome === 'Administrativo') {
    formData.setor_trabalho = 'Administrativo';
  } else if (perfilSelecionado?.nome === 'Backoffice') {
    formData.setor_trabalho = 'Backoffice'; // Backoffice tem setor próprio agora
  } else if (perfilSelecionado?.nome === 'TI') {
    formData.setor_trabalho = 'TI';
  } else {
    formData.setor_trabalho = null; // Limpa para perfis sem setor
  }
});

watch(() => formData.regional_id, (newRegionalId) => {
  if (isEditing) return;
  formData.loja_id = null;
  formData.gerente_id = null;
});

watch(() => formData.loja_id, (newLojaId) => {
  if (isEditing) return;

  formData.gerente_id = null; // Limpa o líder ao trocar de loja
  // Se o perfil for Supervisor, preenche o líder (Coordenador) automaticamente
  if (selectedProfileName.value === 'Supervisor' && newLojaId) {
    const regionalSelecionada = regionais.value.find(r => r.id === formData.regional_id);
    formData.gerente_id = regionalSelecionada?.coordenador_id || null;
  }
});

const lojasFiltradas = computed(() => {
  if (formData.regional_id) {
    return todasLojas.value.filter(loja => loja.regional_id === formData.regional_id);
  }
  // Se o usuário logado for Master-like ou RH, mostra todas as lojas. Senão, a lista começa vazia.
  return (isMasterPerfil(meuPerfilNome.value) || meuPerfilNome.value === 'RH') ? todasLojas.value : [];
});

// --- API EXTERNA ---
const consultarCEP = async () => {
  const data = await lookupCep(formData.cep);

  if (data) {
    formData.endereco = data.logradouro;
    formData.bairro = data.bairro;
    formData.cidade = data.localidade;
    formData.estado = data.uf;
    document.getElementById('address-number')?.focus(); // Move o cursor para o campo de número
  } else if (cepErrorApi.value) {
    toast.add({ 
      title: cepErrorApi.value === 'CEP não encontrado.' ? 'Atenção!' : 'Erro!', 
      description: cepErrorApi.value, 
      color: cepErrorApi.value === 'CEP não encontrado.' ? 'amber' : 'red' 
    });
  }
};

// --- VALIDAÇÃO DE CPF ---
const validateCpfOnBlur = () => {
  if (formData.cpf && !isValidCPF(formData.cpf)) {
    cpfError.value = 'O CPF digitado não é válido.';
  } else { cpfError.value = ''; }
};

// --- AÇÕES DO FORMULÁRIO ---
const resetForm = () => {
  Object.assign(formData, getInitialFormData());
  searchTerm.value = '';
  searchResults.value = [];
};

async function handleFormSubmit() {
  saving.value = true;
  try {
    // Validação final do CPF antes de submeter
    validateCpfOnBlur();
    if (cpfError.value) {
      toast.add({ title: 'CPF Inválido', description: 'Por favor, corrija o CPF antes de salvar.', color: 'red' });
      saving.value = false;
      return;
    }

    // Regras de vínculo: se inativar, exigir data de saída e validar datas
    if (formData.is_active === false) {
      if (!formData.data_saida) {
        toast.add({ title: 'Dados incompletos', description: 'Para inativar o funcionário, preencha a Data de Saída.', color: 'amber' });
        saving.value = false;
        return;
      }
      if (formData.data_admissao && formData.data_saida && new Date(formData.data_saida) < new Date(formData.data_admissao)) {
        toast.add({ title: 'Datas inválidas', description: 'A Data de Saída não pode ser anterior à Data de Admissão.', color: 'red' });
        saving.value = false;
        return;
      }
    }
    // --- INÍCIO DA VALIDAÇÃO DE CPF DUPLICADO ---
    if (formData.cpf) {
      const cpfLimpo = formData.cpf.replace(/\D/g, '');
      let query = supabase
        .from('funcionarios')
        .select('id, nome_completo')
        .eq('cpf', cpfLimpo);

      // Se estiver a editar, exclui o funcionário atual da verificação
      if (formData.id) {
        query = query.neq('id', formData.id);
      }

      // Usa maybeSingle() em vez de single() para evitar erro 406 quando há múltiplos registros
      const { data: existingEmployee, error: checkError } = await query.maybeSingle();

      // Se houver erro na query, lança exceção
      if (checkError) throw checkError;

      // Se encontrou um funcionário, é um duplicado.
      if (existingEmployee) {
        toast.add({ title: 'CPF Duplicado!', description: `O CPF informado já está em uso pelo funcionário: ${existingEmployee.nome_completo}.`, color: 'red', timeout: 5000 });
        saving.value = false;
        return; // Interrompe a submissão
      }
    }
    // --- FIM DA VALIDAÇÃO ---

    if (formData.id) {
      // --- LÓGICA DE ATUALIZAÇÃO (UPDATE) ---
      // 1. Prepara os dados para a tabela 'funcionarios'.
      // O trigger 'handle_funcionario_alocacao_change' cuidará do histórico de alocação
      // se o perfil ou a loja forem alterados.
      const funcionarioData = {
        nome_completo: formData.nome_completo, data_nascimento: formData.data_nascimento, nome_mae: formData.nome_mae,
        cpf: formData.cpf ? formData.cpf.replace(/\D/g, '') : null, 
        telefone: formData.telefone ? formData.telefone.replace(/\D/g, '') : null, 
        cep: formData.cep,
        endereco: formData.endereco, numero_endereco: formData.numero_endereco, complemento_endereco: formData.complemento_endereco,
        bairro: formData.bairro, cidade: formData.cidade, estado: formData.estado,
        perfil_id: formData.perfil_id, gerente_id: formData.gerente_id, loja_id: formData.loja_id,
        setor_trabalho: formData.setor_trabalho,
        is_active: formData.is_active,
      };

      // 2. Atualiza a tabela 'funcionarios'
      const { error: funcError } = await supabase
        .from('funcionarios')
        .update(funcionarioData)
        .eq('id', formData.id);
      if (funcError) throw funcError;

      // 3. Atualiza ou cria vínculo (devido à constraint UNIQUE, só pode haver 1 vínculo por funcionário)
      if (formData.vinculoId) {
        // Já existe um vínculo: atualiza os dados
        const vincData = {
          data_admissao: formData.data_admissao,
          data_saida: formData.is_active ? null : (formData.data_saida || null)
        };
        
        const { error: vincUpdateErr } = await supabase
          .from('historico_vinculos')
          .update(vincData)
          .eq('id', formData.vinculoId);
        if (vincUpdateErr) throw vincUpdateErr;
      } else {
        // Não havia vínculo: tenta criar ou atualizar usando upsert
        const { error: vincUpsertErr } = await supabase
          .from('historico_vinculos')
          .upsert({
            funcionario_id: formData.id,
            data_admissao: formData.data_admissao,
            data_saida: formData.is_active ? null : (formData.data_saida || null)
          }, {
            onConflict: 'funcionario_id', // Usa a constraint unique como chave
            ignoreDuplicates: false // Atualiza se já existir
          });
        if (vincUpsertErr) throw vincUpsertErr;
      }

      // 4. Opcional: sincroniza status no Supabase Auth (ban/unban)
      if (formData.user_id) {
        try {
          await $fetch('/api/users/set-active', {
            method: 'POST',
            body: { user_id: formData.user_id, active: formData.is_active }
          });
        } catch (e) {
          // Não bloqueia o fluxo se falhar, mas registra
          console.error('Falha ao sincronizar status no Auth:', e);
        }
      }

      toast.add({ title: 'Sucesso!', description: 'Dados do funcionário atualizados.' });

    } else {
      // --- LÓGICA DE CRIAÇÃO (INSERT) ---
      if (!formData.email) {
        toast.add({ title: 'Erro de Validação', description: 'O campo E-mail é obrigatório para criar um novo funcionário.', color: 'red' });
        throw new Error('E-mail não fornecido.');
      }
      // PASSO A: Chamar a nossa API segura para convidar o usuário
      const invitedUser = await $fetch('/api/invite-user', {
        method: 'POST',
        body: { email: formData.email }
      });

      if (!invitedUser || !invitedUser.id) {
        throw new Error('Não foi possível obter o ID do usuário convidado.');
      }

      // Prepara os dados que pertencem APENAS à tabela 'funcionarios'
      const funcionarioData = {
        nome_completo: formData.nome_completo, data_nascimento: formData.data_nascimento, nome_mae: formData.nome_mae,
        cpf: formData.cpf ? formData.cpf.replace(/\D/g, '') : null, 
        email: formData.email, 
        telefone: formData.telefone ? formData.telefone.replace(/\D/g, '') : null, 
        cep: formData.cep,
        endereco: formData.endereco, numero_endereco: formData.numero_endereco, complemento_endereco: formData.complemento_endereco,
        bairro: formData.bairro, cidade: formData.cidade, estado: formData.estado,
        perfil_id: formData.perfil_id, gerente_id: formData.gerente_id, loja_id: formData.loja_id,
        setor_trabalho: formData.setor_trabalho,
        is_active: formData.is_active,
      };

      // Adiciona o user_id retornado pela nossa API aos dados do funcionário
      funcionarioData.user_id = invitedUser.id;

      // PASSO B: Insere na tabela 'funcionarios' e obtém o ID
      const { data: novoFuncionario, error: funcError } = await supabase.from('funcionarios').insert(funcionarioData).select('id').single();
      if (funcError) throw funcError;

      // PASSO C: Cria o registo de vínculo na tabela 'historico_vinculos'
      const vinculoData = {
        funcionario_id: novoFuncionario.id,
        data_admissao: formData.data_admissao,
        data_saida: formData.data_saida
      };
      const { error: vincError } = await supabase.from('historico_vinculos').insert(vinculoData);
      if (vincError) throw vincError;

      // PASSO D: Cria o registo inicial de alocação na tabela 'historico_alocacoes'
      const { error: allocError } = await supabase
        .from('historico_alocacoes')
        .insert({
          funcionario_id: novoFuncionario.id,
          perfil_id: formData.perfil_id,
          loja_id: formData.loja_id,
          data_inicio: formData.data_admissao // Usa a data de admissão como data de início da primeira alocação
        });
      if (allocError) throw allocError;

      toast.add({ title: 'Sucesso!', description: 'Funcionário cadastrado e convite enviado por e-mail.' });

    }

    resetForm();

    // Atualiza a lista de busca para refletir as alterações
    if (searchTerm.value) {
      const { data } = await supabase.from('funcionarios').select('*, perfis(nome), lojas(nome)').or(`nome_completo.ilike.%${searchTerm.value}%,cpf.ilike.%${searchTerm.value}%`).limit(10);
      searchResults.value = data || [];
    }

  } catch (error) {
    console.error('Erro ao salvar funcionário:', error);
    // Exibe o erro vindo da nossa API ou do banco de dados
    const errorMessage = error.data?.statusMessage || error.message;
    toast.add({ title: 'Erro!', description: errorMessage, color: 'red' });
  } finally {
    saving.value = false;
  }
}

async function handleResetPassword(employee) {
  if (!employee.email) {
    toast.add({ title: 'Erro!', description: 'Este funcionário não possui um e-mail cadastrado.', color: 'red' });
    return;
  }

  if (confirm(`Tem a certeza de que quer enviar um e-mail de redefinição de senha para "${employee.nome_completo}"?`)) {
    saving.value = true; // Reutiliza a variável 'saving' para mostrar um feedback de carregamento
    try {
      // Chama a nossa nova API segura
      await $fetch('/api/reset-password', {
        method: 'POST',
        body: { email: employee.email }
      });
      toast.add({ title: 'Sucesso!', description: `E-mail de redefinição de senha enviado para ${employee.email}.` });
    } catch (error) {
      const errorMessage = error.data?.statusMessage || error.message;
      toast.add({ title: 'Erro!', description: `Não foi possível enviar o e-mail: ${errorMessage}`, color: 'red' });
    } finally {
      saving.value = false;
    }
  }
}
</script>

<style lang="postcss">
.form-label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}
</style>