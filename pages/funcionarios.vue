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
              <UInput v-model="formData.email" id="employee-email" type="email" required placeholder="Email" />
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
          <div>
            <UFormGroup label="Líder Direto" name="gerente_id">
              <USelectMenu v-model="formData.gerente_id" :options="lideres" value-attribute="id"
                option-attribute="nome_completo" :disabled="!isLiderEnabled" placeholder="Líder Direto" />
            </UFormGroup>
          </div>
          <div>
            <UFormGroup label="Regional" name="regional_id">
              <USelectMenu v-model="formData.regional_id" :options="regionaisPermitidas" value-attribute="id"
                option-attribute="nome_regional" :disabled="!isRegionalEnabled" placeholder="Regional" />
            </UFormGroup>
          </div>
          <div>
            <UFormGroup label="Loja" name="loja_id">
              <USelectMenu v-model="formData.loja_id" :options="lojasFiltradas" value-attribute="id"
                option-attribute="nome" :disabled="!isLojaEnabled" placeholder="Loja" />
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

const supabase = useSupabaseClient();
const saving = ref(false);
const toast = useToast(); // Sistema de notificações do Nuxt UI
const cepLoading = ref(false);


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

const cpfError = ref('');
const columns = [
  { key: 'nome_completo', label: 'Nome Completo', sortable: true }, { key: 'perfis.nome', label: 'Perfil' },
  { key: 'lojas.nome', label: 'Loja' }, { key: 'is_active', label: 'Status' }, { key: 'actions', label: 'Ações' }
];

// --- DADOS PARA OS DROPDOWNS ---
const perfis = ref([]);
const regionais = ref([]);
const todasLojas = ref([]);
const lideres = ref([]);
const meuPerfil = ref(null);

// --- CARREGAMENTO INICIAL DOS DADOS ---
// Usando Promise.all para carregar dados em paralelo e useAsyncData para garantir que
// os dados estejam disponíveis antes da renderização do componente.
// CARREGAMENTO INICIAL DE DADOS (AGORA INCLUI O PERFIL DO UTILIZADOR LOGADO)
const { data: initialData } = await useAsyncData('funcionarios-form-data', async () => {
  const user = useSupabaseUser();
  const [perfisRes, regionaisRes, lojasRes, meuPerfilRes] = await Promise.all([
    supabase.from('perfis').select('id, nome').order('nome'),
    supabase.from('regionais').select('id, nome_regional').order('nome_regional'),
    supabase.from('lojas').select('id, nome, regional_id').order('nome'),
    supabase.from('funcionarios').select('*, perfis(nome)').eq('user_id', user.value.id).single()
  ]);
  return { perfis: perfisRes.data, regionais: regionaisRes.data, lojas: lojasRes.data, meuPerfil: meuPerfilRes.data };
});

if (initialData.value) {
  perfis.value = initialData.value.perfis || [];
  regionais.value = initialData.value.regionais || [];
  todasLojas.value = initialData.value.lojas || [];
  meuPerfil.value = initialData.value.meuPerfil || null;
}

// LÓGICA DE BUSCA
watch(searchTerm, async (newVal) => {
  if (newVal.length < 3) { searchResults.value = []; return; }
  searching.value = true;
  const { data } = await supabase.from('funcionarios').select('*, perfis(nome), lojas(nome)').or(`nome_completo.ilike.%${newVal}%,cpf.ilike.%${newVal}%`).limit(10);
  searchResults.value = data || [];
  searching.value = false;
});

// LÓGICA DE EDIÇÃO
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

// --- LÓGICA DE VISIBILIDADE DOS CAMPOS ORGANIZACIONAIS ---
const isLiderEnabled = computed(() => {
  return ['Supervisor', 'Consultor'].includes(selectedProfileName.value);
});
const isRegionalEnabled = computed(() => {
  // Apenas Supervisores e Consultores precisam selecionar uma regional para filtrar a loja.
  // Coordenadores são associados às regionais na tela de Gestão de Regionais.
  return ['Supervisor', 'Consultor'].includes(selectedProfileName.value);
});
const isLojaEnabled = computed(() => {
  // O campo loja é habilitado para Supervisor e Consultor, e depende de uma regional ser selecionada.
  return ['Supervisor', 'Consultor'].includes(selectedProfileName.value) && !!formData.regional_id;
});
const lojasFiltradas = computed(() => {
  if (!formData.regional_id) return [];
  return todasLojas.value.filter(loja => loja.regional_id === formData.regional_id);
});

const perfisPermitidos = computed(() => {
  const userProfileName = meuPerfil.value?.perfis?.nome;
  if (!userProfileName) return [];
  if (['Master', 'RH'].includes(userProfileName)) return perfis.value;
  if (userProfileName === 'Coordenador') return perfis.value.filter(p => ['Supervisor', 'Consultor'].includes(p.nome));
  if (userProfileName === 'Supervisor') return perfis.value.filter(p => p.nome === 'Consultor');
  return [];
});

const isRegionalDisabled = computed(() => {
  const userProfileName = meuPerfil.value?.perfis?.nome;
  return ['Supervisor', 'Coordenador'].includes(userProfileName);
});

const isLojaDisabled = computed(() => {
  const userProfileName = meuPerfil.value?.perfis?.nome;
  return userProfileName === 'Supervisor';
});

// WATCHERS PARA REATIVIDADE DO FORMULÁRIO
watch(() => formData.perfil_id, async (newPerfilId, oldPerfilId) => {
  if (newPerfilId === oldPerfilId) return;

  // Limpa os campos dependentes ao trocar o perfil
  formData.regional_id = null;
  formData.loja_id = null;
  formData.gerente_id = null;
  lideres.value = [];

  let perfilLider = '';
  // Define qual o perfil do líder baseado no perfil selecionado para o funcionário
  if (selectedProfileName.value === 'Supervisor') perfilLider = 'Coordenador';
  if (selectedProfileName.value === 'Consultor') perfilLider = 'Supervisor';

  // Se houver um perfil de líder, busca os funcionários com esse perfil
  if (perfilLider) {
    const { data: perfilLiderData } = await supabase.from('perfis').select('id').eq('nome', perfilLider).single();
    if (perfilLiderData) {
      const { data: funcs } = await supabase.from('funcionarios').select('id, nome_completo, loja_id').eq('perfil_id', perfilLiderData.id).eq('is_active', true);
      lideres.value = funcs || [];
    }
  }
});

watch(() => formData.regional_id, (newVal) => {
  if (formData.loja_id) {
    const loja = todasLojas.value.find(l => l.id === formData.loja_id);
    if (loja && loja.regional_id !== newVal) formData.loja_id = null;
  }
});

// NOVO: Observa a seleção do líder para preencher loja e regional automaticamente
watch(() => formData.gerente_id, (newGerenteId) => {
  if (!newGerenteId) return;

  // Encontra o objeto completo do líder selecionado
  const liderSelecionado = lideres.value.find(l => l.id === newGerenteId);
  if (!liderSelecionado || !liderSelecionado.loja_id) return;

  // Encontra a loja do líder na lista de todas as lojas
  const lojaDoLider = todasLojas.value.find(l => l.id === liderSelecionado.loja_id);
  if (lojaDoLider) {
    formData.regional_id = lojaDoLider.regional_id;
    formData.loja_id = lojaDoLider.id;
  }
});

// --- MÁSCARAS DE INPUT ---
watch(() => formData.cpf, (newCpf) => {
  if (typeof newCpf !== 'string') return;
  const cleaned = newCpf.replace(/\D/g, '').slice(0, 11);
  let formatted = cleaned;
  if (cleaned.length > 9) {
    formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  } else if (cleaned.length > 6) {
    formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  } else if (cleaned.length > 3) {
    formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  }
  formData.cpf = formatted;
});

watch(() => formData.telefone, (newPhone) => {
  if (typeof newPhone !== 'string') return;
  const cleaned = newPhone.replace(/\D/g, '').slice(0, 11);
  let formatted = cleaned;
  if (cleaned.length > 10) { // Celular (00) 00000-0000
    formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length > 6) { // Fixo (00) 0000-0000
    formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length > 2) {
    formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  }
  formData.telefone = formatted;
});
// FUNÇÃO DE CEP CORRIGIDA
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
    document.getElementById('address-number')?.focus(); // Move o cursor para o campo de número
  } catch (error) {
    toast.add({ title: 'Erro!', description: 'Não foi possível consultar o CEP.', color: 'red' });
  } finally {
    cepLoading.value = false;
  }
};

// --- VALIDAÇÃO DE CPF ---
const isValidCPF = (cpf) => {
  if (typeof cpf !== 'string') return false;
  cpf = cpf.replace(/[^\d]+/g, ''); // Remove caracteres não numéricos

  // Verifica se tem 11 dígitos e se não são todos iguais
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;

  const digits = cpf.split('').map(el => +el);

  // Função para calcular um dígito verificador
  const calcDigit = (sliceEnd) => {
    let sum = 0;
    for (let i = 0, j = sliceEnd + 1; i < sliceEnd; i++, j--) {
      sum += digits[i] * j;
    }
    const rest = (sum * 10) % 11;
    return rest < 10 ? rest : 0;
  };

  return calcDigit(9) === digits[9] && calcDigit(10) === digits[10];
};

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

    // 1. Prepara os dados que pertencem APENAS à tabela 'funcionarios'
    const funcionarioData = {
      nome_completo: formData.nome_completo,
      data_nascimento: formData.data_nascimento,
      nome_mae: formData.nome_mae,
      cpf: formData.cpf,
      email: formData.email,
      telefone: formData.telefone,
      cep: formData.cep,
      endereco: formData.endereco,
      numero_endereco: formData.numero_endereco,
      complemento_endereco: formData.complemento_endereco,
      bairro: formData.bairro,
      cidade: formData.cidade,
      estado: formData.estado,
      perfil_id: formData.perfil_id,
      gerente_id: formData.gerente_id,
      loja_id: formData.loja_id,
      is_active: formData.is_active,
    };

    if (formData.id) { // --- MODO UPDATE ---
      // PASSO A: Atualiza a tabela 'funcionarios' com os dados corretos
      const { error: funcError } = await supabase.from('funcionarios').update(funcionarioData).eq('id', formData.id);
      if (funcError) throw funcError;

      // PASSO B: Prepara e atualiza a tabela 'historico_vinculos'
      const vinculoData = {
        data_admissao: formData.data_admissao,
        data_saida: formData.data_saida
      };

      if (formData.vinculoId) { // Apenas atualiza se houver um vínculo para editar
        const { error: vincError } = await supabase.from('historico_vinculos').update(vinculoData).eq('id', formData.vinculoId);
        if (vincError) throw vincError;
      }

      toast.add({ title: 'Sucesso!', description: 'Funcionário atualizado com sucesso.' });

    } else { // --- MODO CREATE ---
      // PASSO A: Chamar a nossa API segura para convidar o usuário
      const invitedUser = await $fetch('/api/invite-user', {
        method: 'POST',
        body: { email: formData.email }
      });

      if (!invitedUser || !invitedUser.id) {
        throw new Error('Não foi possível obter o ID do usuário convidado.');
      }

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