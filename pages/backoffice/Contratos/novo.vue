<template>
  <div>
    <header class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold">Digitação de Novo Contrato</h1>
          <p class="text-gray-500 mt-1">Preencha os campos abaixo para registar um novo contrato.</p>
        </div>
        <UButton icon="i-heroicons-arrow-left-circle" size="lg" color="gray" to="/backoffice/contratos">
          Voltar para a Lista
        </UButton>
      </div>
    </header>

    <UForm :state="formData" @submit="handleFormSubmit" class="space-y-6 max-w-5xl">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">1. Cliente e Operação</h3>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <UFormGroup label="Cliente" name="cliente_id" required class="md:col-span-2">
            <USelectMenu v-model="formData.cliente_id" :options="clientes" value-attribute="id" option-attribute="nome_completo" placeholder="Selecione o cliente" searchable />
          </UFormGroup>
          
          <UFormGroup label="CPF do Cliente" name="cpf">
            <UInput :model-value="clienteSelecionado?.cpf" disabled placeholder="Automático" />
          </UFormGroup>

          <template v-if="clienteSelecionado">
            <UFormGroup label="Idade" name="idade">
              <UInput :model-value="clienteSelecionado?.idade" disabled />
            </UFormGroup>
            <UFormGroup label="Cidade" name="cidade">
              <UInput :model-value="clienteSelecionado?.cidade" disabled />
            </UFormGroup>
          </template>
        </div>
      </UCard>
      
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">2. Valores, Prazos e Tabelas</h3>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <UFormGroup label="Produto" name="produto_id" required>
            <USelectMenu v-model="formData.produto_id" :options="produtos" value-attribute="id" option-attribute="nome" placeholder="Selecione o produto" />
          </UFormGroup>
          
          <UFormGroup label="Instituição Bancária" name="banco_id" required>
            <USelectMenu v-model="formData.banco_id" :options="bancos" value-attribute="id" option-attribute="nome_instituicao" placeholder="Selecione o banco" searchable />
          </UFormGroup>

          <UFormGroup label="Tabela" name="tabela" required>
            <USelectMenu v-model="formData.tabela" :options="tabelasFiltradas" value-attribute="nome_tabela" option-attribute="nome_tabela" placeholder="Selecione a tabela" :disabled="!formData.banco_id" />
          </UFormGroup>

          <UFormGroup label="Valor Total" name="valor_total">
            <UInput v-model.number="formData.valor_total" type="number" step="0.01" placeholder="R$ 0,00" />
          </UFormGroup>
          <UFormGroup label="Valor da Parcela" name="valor_parcela">
            <UInput v-model.number="formData.valor_parcela" type="number" step="0.01" placeholder="R$ 0,00" />
          </UFormGroup>
          <UFormGroup label="Prazo" name="prazo" required>
             <USelectMenu v-model="formData.prazo" :options="prazosDisponiveis" placeholder="Selecione o prazo" :disabled="!formData.tabela" />
          </UFormGroup>
          <UFormGroup label="Primeiro Vencimento" name="primeiro_vencimento" class="md:col-span-2 lg:col-span-3">
            <UInput v-model="formData.primeiro_vencimento" type="date" />
          </UFormGroup>
        </div>
      </UCard>

       <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">3. Informações de Controlo</h3>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UFormGroup label="Data da Digitação" name="data_contrato" required>
            <UInput v-model="formData.data_contrato" type="date" />
          </UFormGroup>
          <UFormGroup label="Status Inicial" name="status" required>
            <USelectMenu v-model="formData.status" :options="statusOptions" />
          </UFormGroup>
          <UFormGroup label="Consultor" name="consultor_id" required>
            <UInput :model-value="profile?.nome_completo" disabled />
          </UFormGroup>
          <UFormGroup label="Loja" name="loja_id" required>
            <UInput :model-value="lojaDoConsultor?.nome" disabled />
          </UFormGroup>
        </div>
      </UCard>

      <div class="flex justify-end pt-4">
        <UButton type="submit" label="Salvar Novo Contrato" size="lg" :loading="saving" />
      </div>
    </Uform>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient();
const { profile } = useProfile();
const toast = useToast();
const router = useRouter();

// --- ESTADO DO FORMULÁRIO ---
const saving = ref(false);
const formData = reactive({
  cliente_id: null,
  produto_id: null,
  banco_id: null,
  consultor_id: profile.value?.id || null,
  loja_id: profile.value?.loja_id || null,
  data_contrato: new Date().toISOString().split('T')[0],
  status: 'Em Análise',
  valor_total: null,
  valor_parcela: null,
  prazo: null,
  primeiro_vencimento: null,
  tabela: null,
});

const statusOptions = ['Em Análise', 'Aprovado', 'Reprovado', 'Pendente', 'Pago', 'Cancelado'];

// --- CARREGAMENTO DE DADOS PARA DROPDOWNS ---
// CORREÇÃO 1: Adicionamos 'data_nascimento' e 'cidade' à seleção de clientes
const { data: clientesResult } = await useAsyncData('clientes-form', () => 
  supabase.from('clientes').select('id, nome_completo, cpf, data_nascimento, cidade').order('nome_completo')
);
const { data: produtosResult } = await useAsyncData('produtos-form', () => supabase.from('produtos').select('id, nome').eq('is_active', true).order('nome'));
const { data: bancosResult } = await useAsyncData('bancos-form', () => supabase.from('bancos').select('id, nome_instituicao').order('nome_instituicao'));
const { data: lojasResult } = await useAsyncData('lojas-form', () => supabase.from('lojas').select('id, nome'));
const { data: todasTabelasResult } = await useAsyncData('tabelas-form', () => supabase.from('tabelas').select('banco_id, nome_tabela, prazos'));

const clientes = ref(clientesResult.value?.data || []);
const produtos = ref(produtosResult.value?.data || []);
const bancos = ref(bancosResult.value?.data || []);
const lojas = ref(lojasResult.value?.data || []);
const todasTabelas = ref(todasTabelasResult.value?.data || []);

// --- LÓGICA COMPUTADA E REATIVA ---
const lojaDoConsultor = computed(() => lojas.value.find(l => l.id === profile.value?.loja_id));

// CORREÇÃO 2: A lógica para calcular a idade já está aqui, agora ela terá os dados corretos.
const clienteSelecionado = computed(() => {
  if (!formData.cliente_id) return null;
  const cliente = clientes.value.find(c => c.id === formData.cliente_id);
  if (!cliente || !cliente.data_nascimento) return cliente;

  // Cálculo da idade
  const hoje = new Date();
  const nascimento = new Date(cliente.data_nascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
  }
  
  return { ...cliente, idade: idade || 'N/A' };
});

const tabelasFiltradas = computed(() => {
  if (!formData.banco_id || !todasTabelas.value) return [];
  return todasTabelas.value.filter(t => t.banco_id === formData.banco_id);
});

const prazosDisponiveis = computed(() => {
  if (!formData.tabela || !todasTabelas.value) return [];
  const tabelaSelecionada = todasTabelas.value.find(t => t.nome_tabela === formData.tabela && t.banco_id === formData.banco_id);
  return tabelaSelecionada ? tabelaSelecionada.prazos : [];
});

watch(() => formData.banco_id, () => {
  formData.tabela = null;
  formData.prazo = null;
});
watch(() => formData.tabela, () => {
  formData.prazo = null;
});

// --- SUBMISSÃO DO FORMULÁRIO ---
async function handleFormSubmit() {
  // Validação para garantir que o consultor e a loja foram identificados
  if (!formData.consultor_id || !formData.loja_id) {
      toast.add({ 
        title: 'Erro de Permissão!', 
        description: 'Não foi possível identificar o consultor ou a loja. Por favor, faça login novamente.', 
        color: 'red' 
      });
      return;
  }

  saving.value = true;
  try {
    // 1. Gerar um número de contrato único
    const numeroContrato = `CONTR-${Date.now()}`;
    
    // 2. Preparar os dados para submissão
    const dataToSubmit = { 
      ...formData, 
      numero_contrato: numeroContrato // Adiciona o novo número
    };
    
    // Converte o prazo para número, se existir
    if (dataToSubmit.prazo) {
      dataToSubmit.prazo = parseInt(String(dataToSubmit.prazo).replace('x', ''), 10);
    }

    // 3. Inserir no Supabase
    const { error } = await supabase.from('contratos').insert(dataToSubmit);
    if (error) throw error;

    // 4. Feedback e Redirecionamento
    toast.add({ title: 'Sucesso!', description: 'Novo contrato registado com sucesso.' });
    router.push('/backoffice/contratos'); // Redireciona de volta para a lista

  } catch (error) {
    console.error('Erro ao salvar contrato:', error);
    toast.add({ title: 'Erro!', description: error.message, color: 'red' });
  } finally {
    saving.value = false;
  }
}
</script>