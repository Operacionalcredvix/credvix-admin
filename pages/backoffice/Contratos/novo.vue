<template>
  <div>
    <header class="mb-8">
      <div class="flex items-center gap-2 text-sm text-gray-500">
        <NuxtLink to="/backoffice/contratos" class="text-primary-500 hover:underline">Gestão de Contratos</NuxtLink>
        <span>/</span>
        <span>Novo Contrato</span>
      </div>
      <h1 class="text-3xl font-bold mt-2">Digitação de Novo Contrato</h1>
    </header>

    <UForm :state="formData" @submit="handleFormSubmit" class="space-y-6 max-w-4xl">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">1. Cliente e Produto</h3>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UFormGroup label="Cliente" name="cliente_id" required>
            <USelectMenu v-model="formData.cliente_id" :options="clientes" value-attribute="id" option-attribute="nome_completo" placeholder="Selecione o cliente" searchable />
          </UFormGroup>
          <UFormGroup label="CPF do Cliente" name="cpf">
            <UInput :model-value="clienteSelecionado?.cpf" disabled placeholder="Preenchido automaticamente" />
          </UFormGroup>
          <UFormGroup label="Produto" name="produto_id" required>
            <USelectMenu v-model="formData.produto_id" :options="produtos" value-attribute="id" option-attribute="nome" placeholder="Selecione o produto" />
          </UFormGroup>
          <UFormGroup label="Instituição Bancária" name="banco_id" required>
            <USelectMenu v-model="formData.banco_id" :options="bancos" value-attribute="id" option-attribute="nome_instituicao" placeholder="Selecione o banco" searchable />
          </UFormGroup>
        </div>
      </UCard>
      
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">2. Detalhes Financeiros</h3>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <UFormGroup label="Valor Total" name="valor_total">
                <UInput v-model.number="formData.valor_total" type="number" step="0.01" placeholder="R$ 0,00" />
            </UFormGroup>
            <UFormGroup label="Valor da Parcela" name="valor_parcela">
                <UInput v-model.number="formData.valor_parcela" type="number" step="0.01" placeholder="R$ 0,00" />
            </UFormGroup>
             <UFormGroup label="Prazo (meses)" name="prazo">
                <UInput v-model.number="formData.prazo" type="number" />
            </UFormGroup>
            <UFormGroup label="Primeiro Vencimento" name="primeiro_vencimento">
                <UInput v-model="formData.primeiro_vencimento" type="date" />
            </UFormGroup>
             <UFormGroup label="Tabela" name="tabela">
                <UInput v-model="formData.tabela" />
            </UFormGroup>
        </div>
      </UCard>

       <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">3. Informações de Digitação</h3>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UFormGroup label="Data do Contrato" name="data_contrato" required>
                <UInput v-model="formData.data_contrato" type="date" />
            </UFormGroup>
            <UFormGroup label="Status Inicial" name="status" required>
                <USelectMenu v-model="formData.status" :options="statusOptions" />
            </UFormGroup>
            <UFormGroup label="Consultor Responsável" name="consultor_id" required>
              <UInput :model-value="profile?.nome_completo" disabled />
            </UFormGroup>
            <UFormGroup label="Loja do Contrato" name="loja_id" required>
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
  origem_dados: 'Backoffice Manual',
  valor_parcela: null,
  prazo: null,
  primeiro_vencimento: null,
  tabela: '',
});

const statusOptions = ['Em Análise', 'Aprovado', 'Reprovado', 'Pendente', 'Pago', 'Cancelado'];

// --- CARREGAMENTO DE DADOS PARA DROPDOWNS ---
const { data: clientesData } = await useAsyncData('clientes-form', () => supabase.from('clientes').select('id, nome_completo, cpf').order('nome_completo'));
const { data: produtosData } = await useAsyncData('produtos-form', () => supabase.from('produtos').select('id, nome').eq('is_active', true).order('nome'));
const { data: bancosData } = await useAsyncData('bancos-form', () => supabase.from('bancos').select('id, nome_instituicao').order('nome_instituicao'));
const { data: lojasData } = await useAsyncData('lojas-form', () => supabase.from('lojas').select('id, nome'));

// Extrai apenas o array de dados de cada resultado
const clientes = ref(clientesData.value?.data || []);
const produtos = ref(produtosData.value?.data || []);
const bancos = ref(bancosData.value?.data || []);
const lojas = ref(lojasData.value?.data || []);


// --- LÓGICA COMPUTADA ---
const clienteSelecionado = computed(() => clientes.value.find(c => c.id === formData.cliente_id));
const lojaDoConsultor = computed(() => lojas.value.find(l => l.id === profile.value?.loja_id));

// --- SUBMISSÃO DO FORMULÁRIO ---
async function handleFormSubmit() {
  if (!formData.consultor_id || !formData.loja_id) {
      toast.add({ title: 'Erro!', description: 'Não foi possível identificar o consultor ou a loja. Por favor, faça login novamente.', color: 'red' });
      return;
  }

  saving.value = true;
  try {
    const { error } = await supabase.from('contratos').insert(formData);
    if (error) throw error;

    toast.add({ title: 'Sucesso!', description: 'Novo contrato registado com sucesso.' });
    router.push('/backoffice/contratos');
  } catch (error) {
    console.error('Erro ao salvar contrato:', error);
    toast.add({ title: 'Erro!', description: error.message, color: 'red' });
  } finally {
    saving.value = false;
  }
}
</script>