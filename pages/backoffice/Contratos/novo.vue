<template>
  <div>
    <header class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-primary-500 text-3xl font-bold">Digitação de Novo Contrato</h1>
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
            <USelectMenu v-model="formData.cliente_id" :options="clientes" value-attribute="id"
              option-attribute="nome_completo" placeholder="Selecione o cliente" searchable />
          </UFormGroup>
          <UFormGroup label="CPF do Cliente" name="cpf">
            <UInput :model-value="clienteSelecionado?.cpf" disabled placeholder="Automático" />
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
          <UFormGroup label="Prazo" name="prazo" required>
            <USelectMenu v-model="formData.prazo" :options="prazosDisponiveis" placeholder="Selecione o prazo"
              :disabled="!formData.tabela" />
          </UFormGroup>
          <UFormGroup label="Número Benefício" name="numero_beneficio" required>
            <USelectMenu v-model="formData.numero_beneficio" :options="numerosBeneficio" placeholder="Selecione o número do benefício" />
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
          <h3 class="text-lg font-semibold">3. Informações de Controlo</h3>
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

          <UFormGroup label="Status Inicial" name="status" required>
            <USelectMenu v-model="formData.status" :options="statusOptions" />
          </UFormGroup>

          <UFormGroup v-if="mostrarCampoMotivo" label="Motivo do Status" name="motivo_status" required
            class="md:col-span-2">
            <UTextarea v-model="formData.motivo_status" placeholder="Descreva o motivo..." />
          </UFormGroup>
        </div>
      </UCard>

      <div class="flex justify-end pt-4">
        <UButton type="submit" label="Salvar Novo Contrato" size="lg" :loading="saving" />
      </div>
    </UForm>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';

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
  consultor_id: null,
  loja_id: null,
  data_contrato: new Date().toISOString().split('T')[0],
  status: null,
  valor_total: null,
  valor_parcela: null,
  prazo: null,
  tabela: null,
  numero_beneficio: null,
  data_pagamento: null,
  motivo_status: null
});

const statusOptions = ['Em Análise', 'Aprovado', 'Reprovado', 'Pendente', 'Pago', 'Cancelado'];

// --- CARREGAMENTO DE DADOS ---
const { data: clientes } = await useAsyncData('clientes-form', async () => {
  const { data } = await supabase.from('clientes').select('id, nome_completo, cpf, data_nascimento, cidade').order('nome_completo');
  return data || []; // Garante que o retorno seja sempre um array
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
const { data: beneficiosResult } = await useAsyncData('beneficios-form', () =>
  supabase.from('beneficios').select('numero_beneficio, nome_beneficio').eq('is_active', true).order('nome_beneficio'));

const { data: todosConsultores } = await useAsyncData('consultores-form', async () => {
  const { data: perfilConsultor } = await supabase.from('perfis').select('id').eq('nome', 'Consultor').single();
  if (!perfilConsultor) return [];

  const { data } = await supabase.from('funcionarios').select('id, nome_completo, loja_id').eq('perfil_id', perfilConsultor.id);
  return data || [];
});

// --- LÓGICA COMPUTADA E REATIVA ---
const lojaDoConsultor = computed(() => lojas.value?.find(l => l.id === profile.value?.loja_id));
const beneficios = ref(beneficiosResult.value?.data || []);
const numerosBeneficio = computed(() => { return beneficios.value.map(b => b.numero_beneficio); });
// Determina se o campo de motivo deve ser exibido
const mostrarCampoMotivo = computed(() => { const statusSelecionado = formData.status; return statusSelecionado && statusSelecionado !== 'Aprovado' && statusSelecionado !== 'Pago'; });
const clienteSelecionado = computed(() => {
  if (!formData.cliente_id || !clientes.value) return null; const cliente = clientes.value.find(c => c.id === formData.cliente_id); if (!cliente || !cliente.data_nascimento) return cliente;
  const hoje = new Date(); const nascimento = new Date(cliente.data_nascimento); let idade = hoje.getFullYear() - nascimento.getFullYear(); const m = hoje.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }

  return { ...cliente, idade: idade >= 0 ? idade : 'N/A' };
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

watch(() => formData.loja_id, () => {
  formData.consultor_id = null; // Limpa o consultor quando a loja muda
});

watch(() => formData.banco_id, () => {
  formData.tabela = null;
  formData.prazo = null;
});
watch(() => formData.tabela, () => {
  formData.prazo = null;
});

// Limpa o campo de motivo se ele não for mais necessário
watch(() => formData.status, (newStatus) => {
  if (newStatus === 'Aprovado' || newStatus === 'Pago') {
    formData.motivo_status = '';
  }
});

// --- SUBMISSÃO DO FORMULÁRIO  ---
async function handleFormSubmit() {
  // Verificação de segurança para garantir que temos os IDs necessários
  if (!formData.consultor_id || !formData.loja_id || !profile.value?.id) {
    toast.add({
      title: 'Erro de Permissão!',
      description: 'Não foi possível identificar o consultor, a loja ou o digitador. Por favor, faça login novamente.',
      color: 'red'
    });
    return;
  }

  saving.value = true;
  try {
    const numeroContrato = `CONTR-${Date.now()}`;
    const dataToSubmit = {
      ...formData,
      numero_contrato: numeroContrato,
      // AQUI ADICIONAMOS O ID DO DIGITADOR
      digitador_id: profile.value.id 
    };

    if (dataToSubmit.prazo) {
      dataToSubmit.prazo = parseInt(String(dataToSubmit.prazo).replace('x', ''), 10);
    }

    const { error } = await supabase.from('contratos').insert(dataToSubmit);
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