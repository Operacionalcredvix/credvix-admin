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
            <UBadge :label="row.is_active ? 'Ativo' : 'Inativo'" :color="row.is_active ? 'primary' : 'red'"
              variant="subtle" />
          </template>

          <template #actions-data="{ row }">
            <UButton icon="i-heroicons-pencil" size="sm" color="gray" variant="ghost" @click="handleEdit(row)" />
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
            <label for="full-name" class="form-label">Nome Completo *</label>
            <UInput v-model="formData.nome_completo" id="full-name" required />
          </div>
          <div>
            <label for="birth-date" class="form-label">Data de Nascimento</label>
            <UInput v-model="formData.data_nascimento" id="birth-date" type="date" />
          </div>
          <div>
            <label for="mother-name" class="form-label">Nome da Mãe</label>
            <UInput v-model="formData.nome_mae" id="mother-name" />
          </div>
          <div>
            <label for="cpf" class="form-label">CPF</label>
            <UInput v-model="formData.cpf" id="cpf" placeholder="000.000.000-00" />
          </div>
          <div>
            <label for="employee-email" class="form-label">Email *</label>
            <UInput v-model="formData.email" id="employee-email" type="email" required />
          </div>
          <div>
            <label for="phone" class="form-label">Telefone</label>
            <UInput v-model="formData.telefone" id="phone" placeholder="(00) 00000-0000" />
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
              <label for="cep" class="form-label">CEP</label>
              <UInput v-model="formData.cep" id="cep" placeholder="00000-000" @blur="consultarCEP"
                :loading="cepLoading" />
            </div>
            <div class="md:col-span-2">
              <label for="address" class="form-label">Endereço</label>
              <UInput v-model="formData.endereco" id="address" />
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="address-number" class="form-label">Número</label>
              <UInput v-model="formData.numero_endereco" id="address-number" />
            </div>
            <div>
              <label for="address-complement" class="form-label">Complemento</label>
              <UInput v-model="formData.complemento_endereco" id="address-complement" />
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div><label for="neighborhood" class="form-label">Bairro</label>
              <UInput v-model="formData.bairro" id="neighborhood" />
            </div>
            <div><label for="city" class="form-label">Cidade</label>
              <UInput v-model="formData.cidade" id="city" />
            </div>
            <div><label for="state" class="form-label">Estado</label>
              <UInput v-model="formData.estado" id="state" />
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
            <label for="perfil-select" class="form-label">Perfil de Acesso *</label>
            <USelectMenu v-model="formData.perfil_id" :options="perfisPermitidos" value-attribute="id"
              option-attribute="nome" required />
          </div>
          <div>
            <label for="lider-select" class="form-label">Líder Direto</label>
            <USelectMenu v-model="formData.gerente_id" :options="lideres" value-attribute="id"
              option-attribute="nome_completo" :disabled="!isLiderEnabled" />
          </div>
          <div>
            <label for="regional-select" class="form-label">Regional</label>
            <USelectMenu v-model="formData.regional_id" :options="regionaisPermitidas" value-attribute="id"
              option-attribute="nome_regional" :disabled="!isRegionalEnabled" />
          </div>
          <div>
            <label for="loja-select" class="form-label">Loja</label>
            <USelectMenu v-model="formData.loja_id" :options="lojasFiltradas" value-attribute="id"
              option-attribute="nome" :disabled="!isLojaEnabled" />
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

const columns = [
  { key: 'nome_completo', label: 'Nome Completo', sortable: true },
  { key: 'perfis.nome', label: 'Perfil' },
  { key: 'lojas.nome', label: 'Loja' },
  { key: 'is_active', label: 'Status' },
  { key: 'actions', label: 'Ações' }
];

// --- DADOS PARA OS DROPDOWNS ---
const perfis = ref([]);
const regionais = ref([]);
const todasLojas = ref([]);
const lideres = ref([]);

// --- CARREGAMENTO INICIAL DOS DADOS ---
// Usando Promise.all para carregar dados em paralelo e useAsyncData para garantir que
// os dados estejam disponíveis antes da renderização do componente.
const { data: initialData, pending } = await useAsyncData('initialFormData', async () => {
  const [perfis, regionais, lojas] = await Promise.all([
    supabase.from('perfis').select('id, nome').order('nome'),
    supabase.from('regionais').select('id, nome_regional').order('nome_regional'),
    supabase.from('lojas').select('id, nome, regional_id').order('nome')
  ]);

  return {
    perfis: perfis.data,
    regionais: regionais.data,
    lojas: lojas.data
  };
});

if (initialData.value) {
  perfis.value = initialData.value.perfis || [];
  regionais.value = initialData.value.regionais || [];
  todasLojas.value = initialData.value.lojas || [];
}

// --- LÓGICA DE BUSCA E EDIÇÃO ---
watch(searchTerm, async (newVal) => {
  if (newVal.length < 3) {
    searchResults.value = [];
    return;
  }
  searching.value = true;
  const { data } = await supabase
    .from('funcionarios')
    .select('*, perfis(nome), lojas(nome)')
    .or(`nome_completo.ilike.%${newVal}%,cpf.ilike.%${newVal}%`)
    .limit(10);
  searchResults.value = data || [];
  searching.value = false;
});

const handleEdit = async (employee) => {
  // 1. Limpa o formulário para evitar misturar dados
  resetForm();

  // 2. Busca o vínculo mais recente para obter as datas corretas
  const { data: vinculo } = await supabase
    .from('historico_vinculos')
    .select('*')
    .eq('funcionario_id', employee.id)
    .order('data_admissao', { ascending: false })
    .limit(1)
    .single();

  // 3. Preenche o formData com os dados do funcionário
  Object.assign(formData, employee);

  // 4. Se encontrou um vínculo, preenche as datas e o ID do vínculo
  if (vinculo) {
    formData.data_admissao = vinculo.data_admissao;
    formData.data_saida = vinculo.data_saida;
    formData.vinculoId = vinculo.id; // Importante para o UPDATE
  }

  // 5. Rola a página para o formulário
  document.getElementById('form-title').scrollIntoView({ behavior: 'smooth' });
};

// --- LÓGICA DINÂMICA DO FORMULÁRIO ---
const formTitle = computed(() => formData.id ? 'Editar Cadastro' : 'Novo Cadastro de Funcionário');
const formSubtitle = computed(() => formData.id ? `A editar o perfil de ${formData.nome_completo}.` : 'Preencha os dados para criar um novo funcionário.');
const formButtonText = computed(() => formData.id ? 'Salvar Alterações' : 'Salvar Novo Funcionário');

const selectedProfileName = computed(() => perfis.value.find(p => p.id === formData.perfil_id)?.nome || '');
const isLiderEnabled = computed(() => ['Supervisor', 'Consultor'].includes(selectedProfileName.value));
const isRegionalEnabled = computed(() => ['Coordenador', 'Supervisor', 'Consultor'].includes(selectedProfileName.value));
const isLojaEnabled = computed(() => ['Supervisor', 'Consultor'].includes(selectedProfileName.value) && formData.regional_id);

const lojasFiltradas = computed(() => {
  if (!formData.regional_id) return [];
  return todasLojas.value.filter(loja => loja.regional_id === formData.regional_id);
});

watch(() => formData.perfil_id, async (newPerfilId, oldPerfilId) => {
  if (newPerfilId === oldPerfilId) return;

  formData.regional_id = null;
  formData.loja_id = null;
  formData.gerente_id = null;
  lideres.value = [];

  let perfilLider = '';
  if (selectedProfileName.value === 'Supervisor') perfilLider = 'Coordenador';
  if (selectedProfileName.value === 'Consultor') perfilLider = 'Supervisor';

  if (perfilLider) {
    const { data: perfilLiderData } = await supabase.from('perfis').select('id').eq('nome', perfilLider).single();
    if (perfilLiderData) {
      const { data: funcs } = await supabase.from('funcionarios').select('id, nome_completo').eq('perfil_id', perfilLiderData.id).eq('is_active', true);
      lideres.value = funcs || [];
    }
  }
});

watch(() => formData.regional_id, (newVal, oldVal) => {
  if (newVal !== oldVal) formData.loja_id = null;
});


// --- LÓGICA DO CEP (CORRIGIDA) ---
const consultarCEP = async () => {
  const cep = formData.cep?.replace(/\D/g, '');
  if (!cep || cep.length !== 8) return;

  cepLoading.value = true;
  try {
    const data = await $fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (data.erro) {
      toast.add({ title: 'Atenção!', description: 'CEP não encontrado.', color: 'amber' });
      return;
    }
    formData.endereco = data.logradouro;
    formData.bairro = data.bairro;
    formData.cidade = data.localidade;
    formData.estado = data.uf;
    document.getElementById('address-number')?.focus();
  } catch (error) {
    toast.add({ title: 'Erro!', description: 'Não foi possível consultar o CEP.', color: 'red' });
  } finally {
    cepLoading.value = false;
  }
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
    const { vinculoId, ...restOfData } = formData;
    const funcionarioData = { ...restOfData };
    delete funcionarioData.vinculoId; // Garante que o campo extra não seja enviado

    if (formData.id) {
      delete funcionarioData.id; // Não envie o id no corpo do update
      const { error: funcError } = await supabase.from('funcionarios').update(funcionarioData).eq('id', formData.id);
      if (funcError) throw funcError;

      const vinculoData = { data_admissao: formData.data_admissao, data_saida: formData.data_saida };
      if (vinculoId) {
        const { error: vincError } = await supabase.from('historico_vinculos').update(vinculoData).eq('id', vinculoId);
        if (vincError) throw vincError;
      }
      toast.add({ title: 'Sucesso!', description: 'Funcionário atualizado com sucesso.' });
    } else {
      delete funcionarioData.id;
      const { data: novoFuncionario, error: funcError } = await supabase.from('funcionarios').insert(funcionarioData).select('id').single();
      if (funcError) throw funcError;

      const vinculoData = { funcionario_id: novoFuncionario.id, data_admissao: formData.data_admissao, data_saida: formData.data_saida };
      const { error: vincError } = await supabase.from('historico_vinculos').insert(vinculoData);
      if (vincError) throw vincError;
      
      toast.add({ title: 'Sucesso!', description: 'Funcionário cadastrado com sucesso.' });
    }
    resetForm();
    if (searchTerm.value) { // Atualiza a busca após salvar
      const { data } = await supabase.from('funcionarios').select('*, perfis(nome), lojas(nome)').or(`nome_completo.ilike.%${searchTerm.value}%,cpf.ilike.%${searchTerm.value}%`).limit(10);
      searchResults.value = data || [];
    }
  } catch (error) {
    console.error('Erro ao salvar funcionário:', error);
    toast.add({ title: 'Erro!', description: error.message, color: 'red' });
  } finally {
    saving.value = false;
  }
}
</script>

<style>
.form-label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}
</style>