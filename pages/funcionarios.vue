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
            <UToggle v-model="formData.is_active" />
            <label>Status do Funcionário Ativo</label>
          </div>
        </div>
      </UCard>

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
  perfil_id: null, gerente_id: null, regional_id: null, loja_id: null,
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
  { key: 'nome_completo', label: 'Nome Completo', sortable: true }, { key: 'perfis.nome', label: 'Perfil' },
  { key: 'lojas.nome', label: 'Loja' }, { key: 'is_active', label: 'Status' }, { key: 'actions', label: 'Ações' }
];

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

// LÓGICA DE EDIÇÃO (AGORA MAIS RÁPIDA)
const handleEdit = (employee) => {
  // 1. Limpa o formulário para evitar misturar dados
  resetForm();

  // 2. OTIMIZAÇÃO: Processa o histórico de vínculo que já foi carregado na busca,
  // em vez de fazer uma nova chamada ao banco de dados.
  let vinculo = null;
  if (employee.historico_vinculos && employee.historico_vinculos.length > 0) {
    // Ordena os vínculos localmente para encontrar o mais recente (maior data de admissão)
    const vinculosOrdenados = [...employee.historico_vinculos].sort((a, b) => new Date(b.data_admissao) - new Date(a.data_admissao));
    vinculo = vinculosOrdenados[0];
  }

  // 3. Preenche o formData com os dados básicos do funcionário
  Object.assign(formData, employee);
  
  // 4. CORREÇÃO: Preenche os dados organizacionais na ordem correta para garantir que os
  //    menus de seleção (regionais, lojas, líderes) funcionem corretamente.
  if (employee.lojas && employee.lojas.regional_id) {
    formData.regional_id = employee.lojas.regional_id;
  }
  // Garante que o loja_id e gerente_id do funcionário sejam usados.
  formData.loja_id = employee.loja_id;
  formData.gerente_id = employee.gerente_id;

  // 5. Se encontrou um vínculo, preenche as datas e o ID do vínculo
  if (vinculo) {
    formData.data_admissao = vinculo.data_admissao;
    formData.data_saida = vinculo.data_saida;
    formData.vinculoId = vinculo.id; // Importante para o UPDATE
  }

  // 6. Rola a página para o formulário
  document.getElementById('form-title').scrollIntoView({ behavior: 'smooth' });
};

// --- LÓGICA DINÂMICA DO FORMULÁRIO ---
const formTitle = computed(() => formData.id ? 'Editar Cadastro' : 'Novo Cadastro de Funcionário');
const formSubtitle = computed(() => formData.id ? `A editar o perfil de ${formData.nome_completo}.` : 'Preencha os dados para criar um novo funcionário.');
const formButtonText = computed(() => formData.id ? 'Salvar Alterações' : 'Salvar Novo Funcionário');

const selectedProfileName = computed(() => perfis.value.find(p => p.id === formData.perfil_id)?.nome || '');
const meuPerfilNome = computed(() => meuPerfil.value?.perfis?.nome);
// --- LÓGICA DE VISIBILIDADE DOS CAMPOS ORGANIZACIONAIS ---
const isRegionalVisible = computed(() => ['Supervisor', 'Consultor'].includes(selectedProfileName.value));
const isLiderVisible = computed(() => ['Supervisor', 'Consultor'].includes(selectedProfileName.value));
const isLojaVisible = computed(() => ['Supervisor', 'Consultor'].includes(selectedProfileName.value));

const perfisPermitidos = computed(() => {
  if (!meuPerfilNome.value) return [];
  if (['Master', 'RH'].includes(meuPerfilNome.value)) return perfis.value;
  if (meuPerfilNome.value === 'Coordenador') return perfis.value.filter(p => ['Supervisor', 'Consultor', 'Coordenador'].includes(p.nome));
  if (meuPerfilNome.value === 'Supervisor') return perfis.value.filter(p => ['Consultor', 'Supervisor'].includes(p.nome));
  return [];
});

// --- LÓGICA PARA DESABILITAR CAMPOS ---
const isRegionalDisabled = computed(() => {
  // Desabilita para Consultor, pois a regional vem do líder (Supervisor)
  return selectedProfileName.value === 'Consultor';
});

const isLojaDisabled = computed(() => {
  // Desabilita para Consultor, pois a loja vem do líder (Supervisor)
  return selectedProfileName.value === 'Consultor';
});

const isLiderDisabled = computed(() => {
  // Desabilita para Supervisor, pois o líder vem da regional (Coordenador)
  return selectedProfileName.value === 'Supervisor';
});

// Otimização: Filtra a lista de líderes pré-carregada em vez de fazer uma nova chamada de API.
const lideres = computed(() => {
  if (selectedProfileName.value === 'Supervisor') return todosLideres.value.filter(l => l.perfil.nome === 'Coordenador');
  if (selectedProfileName.value === 'Consultor') return todosLideres.value.filter(l => l.perfil.nome === 'Supervisor');
  return [];
});

// WATCHERS PARA REATIVIDADE DO FORMULÁRIO
watch(() => formData.perfil_id, (newPerfilId, oldPerfilId) => {
  if (newPerfilId === oldPerfilId) return;

  // Limpa os campos dependentes ao trocar o perfil, respeitando os que podem estar bloqueados
  if (!isRegionalDisabled.value) formData.regional_id = null;
  formData.loja_id = null;
  formData.gerente_id = null;
});

watch(() => formData.regional_id, (newRegionalId) => {
  // Se o perfil for Supervisor, preenche o líder (Coordenador) automaticamente
  if (selectedProfileName.value === 'Supervisor' && newRegionalId) {
    const regionalSelecionada = regionais.value.find(r => r.id === newRegionalId);
    formData.gerente_id = regionalSelecionada?.coordenador_id || null;
  }

  // Limpa a loja se a regional mudar e a loja não pertencer mais à nova regional
  if (formData.loja_id && !isLojaDisabled.value) {
    const lojaAtual = todasLojas.value.find(l => l.id === formData.loja_id);
    if (lojaAtual && lojaAtual.regional_id !== newRegionalId) {
      formData.loja_id = null;
    }
  }
});

// NOVO: Observa a seleção do líder para preencher loja e regional automaticamente
watch(() => formData.gerente_id, (newGerenteId) => {
  // Esta lógica aplica-se apenas ao criar um Consultor
  if (!newGerenteId || selectedProfileName.value !== 'Consultor') return;

  const liderSelecionado = todosLideres.value.find(l => l.id === newGerenteId);
  if (!liderSelecionado || !liderSelecionado.loja_id) return;

  // Encontra a loja do líder na lista de todas as lojas
  const lojaDoLider = todasLojas.value.find(l => l.id === liderSelecionado.loja_id);
  if (lojaDoLider) {
    formData.regional_id = lojaDoLider.regional_id;
    formData.loja_id = lojaDoLider.id;
  }
});

const lojasFiltradas = computed(() => {
  if (formData.regional_id) {
    return todasLojas.value.filter(loja => loja.regional_id === formData.regional_id);
  }
  // Se o usuário logado for Master ou RH, mostra todas as lojas. Senão, a lista começa vazia.
  return ['Master', 'RH'].includes(meuPerfilNome.value) ? todasLojas.value : [];
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

      const { data: existingEmployee, error: checkError } = await query.single();

      // O erro 'PGRST116' significa "nenhum registo encontrado", o que é bom. Qualquer outro erro é um problema.
      if (checkError && checkError.code !== 'PGRST116') throw checkError;

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

      // Prepara os dados que pertencem APENAS à tabela 'funcionarios'
      const funcionarioData = {
        nome_completo: formData.nome_completo, data_nascimento: formData.data_nascimento, nome_mae: formData.nome_mae,
        cpf: formData.cpf, telefone: formData.telefone, cep: formData.cep,
        endereco: formData.endereco, numero_endereco: formData.numero_endereco, complemento_endereco: formData.complemento_endereco,
        bairro: formData.bairro, cidade: formData.cidade, estado: formData.estado,
        perfil_id: formData.perfil_id, gerente_id: formData.gerente_id, loja_id: formData.loja_id,
        is_active: formData.is_active,
      };

      // PASSO A: Atualiza a tabela 'funcionarios'
      const { error: funcError } = await supabase
        .from('funcionarios')
        .update(funcionarioData)
        .eq('id', formData.id);
      if (funcError) throw funcError;

      // PASSO B: Atualiza ou cria o registo de vínculo na tabela 'historico_vinculos'
      const vinculoData = {
        funcionario_id: formData.id,
        data_admissao: formData.data_admissao,
        data_saida: formData.data_saida
      };

      // Se já temos um vinculoId, atualizamos (upsert com 'onConflict' não funciona bem aqui)
      if (formData.vinculoId) {
        const { error: vincError } = await supabase
          .from('historico_vinculos')
          .update(vinculoData)
          .eq('id', formData.vinculoId);
        if (vincError) throw vincError;
      } else {
        // Se não, criamos um novo (caso o funcionário não tivesse um vínculo antes)
        const { error: vincError } = await supabase
          .from('historico_vinculos')
          .insert(vinculoData);
        if (vincError) throw vincError;
      }

      // PASSO C: (Opcional) Adicionar lógica para o histórico de alocações se o perfil ou loja mudar.
      // Por enquanto, a edição não cria um novo registo de alocação para manter o histórico simples.

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
        cpf: formData.cpf, email: formData.email, telefone: formData.telefone, cep: formData.cep,
        endereco: formData.endereco, numero_endereco: formData.numero_endereco, complemento_endereco: formData.complemento_endereco,
        bairro: formData.bairro, cidade: formData.cidade, estado: formData.estado,
        perfil_id: formData.perfil_id, gerente_id: formData.gerente_id, loja_id: formData.loja_id,
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

<style>
.form-label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}
</style>