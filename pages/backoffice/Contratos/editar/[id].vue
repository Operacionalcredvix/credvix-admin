<template>
  <div v-if="pending">
    <p>A carregar dados do contrato...</p>
  </div>
  <div v-else-if="!contrato">
    <h1 class="text-2xl font-bold">Contrato não encontrado.</h1>
  </div>
  <div v-else>
    <header class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-primary-500 text-3xl font-bold">Editar Contrato #{{ contrato.numero_contrato }}</h1>
          <p class="text-gray-500 mt-1">Altere os campos necessários e salve as alterações.</p>
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
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UFormGroup label="Cliente" name="cliente_id" required>
            <USelectMenu v-model="formData.cliente_id" :options="clientes" value-attribute="id"
              option-attribute="nome_completo" placeholder="Selecione o cliente" searchable />
          </UFormGroup>
          <UFormGroup label="CPF do Cliente" name="cpf">
            <UInput :model-value="clienteSelecionado?.cpf" disabled placeholder="Automático" />
          </UFormGroup>

          <UFormGroup label="Benefício para o Contrato" name="numero_beneficio" required class="md:col-span-2">
            <USelectMenu v-model="formData.numero_beneficio" :options="beneficiosDoClienteOptions"
              value-attribute="value" option-attribute="label" placeholder="Selecione um cliente para ver os benefícios"
              :disabled="!formData.cliente_id || beneficiosDoClienteOptions.length === 0" />
          </UFormGroup>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">2. Valores, Prazos e Tabelas</h3>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <UFormGroup label="Produto" name="produto_id" required>
            <USelectMenu v-model="formData.produto_id" :options="produtos" value-attribute="id" option-attribute="nome"
              placeholder="Selecione o produto" />
          </UFormGroup>
          <UFormGroup label="Instituição Bancária" name="banco_id" required>
            <USelectMenu v-model="formData.banco_id" :options="bancos" value-attribute="id"
              option-attribute="nome_instituicao" placeholder="Selecione o banco" searchable />
          </UFormGroup>
          <UFormGroup label="Tabela" name="tabela" required>
            <USelectMenu v-model="formData.tabela" :options="tabelasFiltradas" value-attribute="nome_tabela"
              option-attribute="nome_tabela" placeholder="Selecione a tabela" :disabled="!formData.banco_id" />
          </UFormGroup>
          <UFormGroup label="Valor Total" name="valor_total">
            <UInput v-model.number="formData.valor_total" type="number" step="0.01" placeholder="R$ 0,00" />
          </UFormGroup>
          <UFormGroup label="Valor da Parcela" name="valor_parcela">
            <UInput v-model.number="formData.valor_parcela" type="number" step="0.01" placeholder="R$ 0,00" />
          </UFormGroup>
          <UFormGroup label="Adesão" name="adesao" required>
            <UInput v-model="formData.adesao" placeholder="Número da adesão" />
          </UFormGroup>
          <UFormGroup label="Prazo" name="prazo" required>
            <USelectMenu v-model="formData.prazo" :options="prazosDisponiveis" placeholder="Selecione o prazo"
              :disabled="!formData.tabela" />
          </UFormGroup>
          <UFormGroup label="Data da Digitação" name="data_contrato" required>
            <UInput v-model="formData.data_contrato" type="date" />
          </UFormGroup>
          <UFormGroup label="Data Pagamento" name="data_pagamento">
            <UInput v-model="formData.data_pagamento" type="date" />
          </UFormGroup>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">3. Informações de Controle</h3>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UFormGroup label="Loja" name="loja_id" required>
            <USelectMenu v-model="formData.loja_id" :options="lojas" value-attribute="id" option-attribute="nome"
              placeholder="Selecione a loja" />
          </UFormGroup>
          <UFormGroup label="Consultor" name="consultor_id" required>
            <USelectMenu v-model="formData.consultor_id" :options="consultoresFiltrados" value-attribute="id"
              option-attribute="nome_completo" placeholder="Selecione o consultor" :disabled="!formData.loja_id" />
          </UFormGroup>
          <UFormGroup label="Status" name="status" required>
            <USelectMenu v-model="formData.status" :options="statusOptions" />
          </UFormGroup>
          <UFormGroup v-if="mostrarCampoMotivo" label="Motivo do Status" name="motivo_status" required
            class="md:col-span-2">
            <UTextarea v-model="formData.motivo_status" placeholder="Descreva o motivo..." />
          </UFormGroup>
        </div>
      </UCard>

      <div class="flex justify-end pt-4">
        <UButton type="submit" label="Salvar Alterações" size="lg" :loading="saving" />
      </div>
    </UForm>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';

definePageMeta({
  middleware: 'auth'
});

const supabase = useSupabaseClient();
const { profile } = useProfile();
const toast = useToast();
const router = useRouter();
const route = useRoute();
const contractId = route.params.id;

// --- ESTADO DO FORMULÁRIO ---
const saving = ref(false);
const formData = reactive({
  cliente_id: null, produto_id: null, banco_id: null, consultor_id: null,
  loja_id: null, data_contrato: null, status: null, valor_total: null,
  valor_parcela: null, prazo: null, tabela: null, numero_beneficio: null,
  data_pagamento: null, motivo_status: null, adesao: null
});
const statusOptions = ['Em Análise', 'Aprovado', 'Reprovado', 'Pendente', 'Pago', 'Cancelado'];

// --- CARREGAMENTO DE DADOS DO CONTRATO PARA EDIÇÃO ---
const { data: contrato, pending } = await useAsyncData(`contrato-${contractId}`, async () => {
  const { data, error } = await supabase
    .from('contratos')
    .select('*')
    .eq('id', contractId)
    .single();

  if (error) {
    toast.add({ title: 'Erro!', description: 'Não foi possível carregar o contrato.', color: 'red' });
    return null;
  }
  return data;
});

// Popula o formulário com os dados carregados
onMounted(() => {
  if (contrato.value) {
    // Garante que a edição só é possível nos status permitidos
    if (contrato.value.status !== 'Em Análise' && contrato.value.status !== 'Pendente') {
        toast.add({ title: 'Acesso Negado', description: 'Este contrato não pode mais ser editado.', color: 'red' });
        router.push('/backoffice/contratos');
    }
    Object.assign(formData, contrato.value);
  }
});


// --- CARREGAMENTO DE DADOS (igual ao novo.vue) ---
const { data: clientes } = await useAsyncData('clientes-form', async () => {
  const { data } = await supabase
    .from('clientes')
    .select('id, nome_completo, cpf, especie_beneficio_1, numero_beneficio_1, especie_beneficio_2, numero_beneficio_2')
    .order('nome_completo');
  return data || [];
});
const { data: produtos } = await useAsyncData('produtos-form', async () => {
  const { data } = await supabase.from('produtos').select('id, nome').eq('is_active', true).order('nome');
  return data || [];
});

const { data: bancos } = await useAsyncData('bancos-form', async () => {
  const { data } = await supabase.from('bancos').select('id, nome_instituicao').order('nome_instituicao');
  return data || [];
});

const { data: lojas } = await useAsyncData('lojas-form', async () => {
  const { data } = await supabase.from('lojas').select('id, nome');
  return data || [];
});

const { data: todasTabelas } = await useAsyncData('tabelas-form', async () => {
  const { data } = await supabase.from('tabelas').select('banco_id, nome_tabela, prazos');
  return data || [];
});

const { data: todosConsultores } = await useAsyncData('consultores-form', async () => {
  const { data: perfilConsultor } = await supabase.from('perfis').select('id').eq('nome', 'Consultor').single();
  if (!perfilConsultor) return [];
  const { data } = await supabase.from('funcionarios').select('id, nome_completo, loja_id').eq('perfil_id', perfilConsultor.id);
  return data || [];
});



// --- LÓGICA COMPUTADA E REATIVA (igual ao novo.vue) ---
const clienteSelecionado = computed(() => {
  if (!formData.cliente_id || !clientes.value) return null;
  return clientes.value.find(c => c.id === formData.cliente_id);
});

// As opções de benefício são geradas a partir dos dados do cliente selecionado
const beneficiosDoClienteOptions = computed(() => {
  const cliente = clienteSelecionado.value;
  if (!cliente) return [];

  const options = [];
  if (cliente.numero_beneficio_1 && cliente.especie_beneficio_1) {
    options.push({
      label: `${cliente.especie_beneficio_1} - ${cliente.numero_beneficio_1}`,
      value: cliente.numero_beneficio_1
    });
  }
  if (cliente.numero_beneficio_2 && cliente.especie_beneficio_2) {
    options.push({
      label: `${cliente.especie_beneficio_2} - ${cliente.numero_beneficio_2}`,
      value: cliente.numero_beneficio_2
    });
  }
  return options;
});


const mostrarCampoMotivo = computed(() => {
  const statusSelecionado = formData.status;
  return statusSelecionado && statusSelecionado !== 'Aprovado' && statusSelecionado !== 'Pago';
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

const consultoresFiltrados = computed(() => {
  if (!formData.loja_id || !todosConsultores.value) return [];
  return todosConsultores.value.filter(c => c.loja_id === formData.loja_id);
});

// Observa a seleção do cliente e limpa o campo de benefício
watch(() => formData.cliente_id, () => {formData.numero_beneficio = null;});
watch(() => formData.loja_id, () => { formData.consultor_id = null; });
watch(() => formData.banco_id, () => { formData.tabela = null; formData.prazo = null; });
watch(() => formData.tabela, () => { formData.prazo = null; });
watch(() => formData.status, (newStatus) => {if (newStatus === 'Aprovado' || newStatus === 'Pago') {formData.motivo_status = '';}});

// --- LÓGICA DE SUBMISSÃO ATUALIZADA PARA EDIÇÃO ---
async function handleFormSubmit() {
  if (!formData.adesao) {
    toast.add({ title: 'Atenção!', description: 'O campo "Adesão" é obrigatório.', color: 'amber' });
    return;
  }
  
  saving.value = true;
  try {
    // Verifica duplicidade de adesão, mas ignora o próprio contrato que está a ser editado
    const { data: existingContract, error: checkError } = await supabase
      .from('contratos')
      .select('numero_contrato')
      .eq('adesao', formData.adesao)
      .neq('id', contractId) // <-- PONTO IMPORTANTE: não compara com ele mesmo
      .single();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    if (existingContract) {
      toast.add({ title: 'Contrato Duplicado!', description: `Já existe outro contrato (${existingContract.numero_contrato}) com este número de adesão.`, color: 'red', timeout: 5000 });
      saving.value = false;
      return;
    }

    // Prepara os dados para o UPDATE, removendo campos que não devem ser alterados
    const { id, created_at, numero_contrato, ...dataToUpdate } = formData;
    if (dataToUpdate.prazo) {
      dataToUpdate.prazo = parseInt(String(dataToUpdate.prazo).replace('x', ''), 10);
    }
    
    const { error } = await supabase
      .from('contratos')
      .update(dataToUpdate)
      .eq('id', contractId);

    if (error) throw error;
    
    toast.add({ title: 'Sucesso!', description: 'Contrato atualizado com sucesso.' });
    router.push('/backoffice/contratos');

  } catch (error) {
    console.error('Erro ao atualizar contrato:', error);
    toast.add({ title: 'Erro!', description: error.message, color: 'red' });
  } finally {
    saving.value = false;
  }
}


</script>