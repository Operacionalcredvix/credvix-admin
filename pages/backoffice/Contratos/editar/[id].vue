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
            <USelectMenu v-model="formData.prazo" :options="prazosDisponiveis" value-attribute="value"
              option-attribute="label" placeholder="Selecione o prazo" :disabled="!formData.tabela" />
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
import { ref, reactive, computed, watch } from 'vue';

definePageMeta({
  middleware: 'auth',
  profiles: ['Backoffice', 'Master']
});

const supabase = useSupabaseClient();
const { profile } = useProfile();
const toast = useToast();
const router = useRouter();
const route = useRoute();
const contractId = route.params.id;

// --- ESTADO DO FORMULÁRIO ---
const saving = ref(false);
const isLoadingInitialData = ref(true); // Flag para controlar carregamento inicial
const formData = reactive({
  cliente_id: null, produto_id: null, banco_id: null, consultor_id: null,
  loja_id: null, data_contrato: null, status: null, valor_total: null,
  valor_parcela: null, prazo: null, tabela: null, numero_beneficio: null,
  especie_beneficio: null, data_pagamento: null, motivo_status: null, adesao: null
});
const statusOptions = ['Em Análise', 'Reprovado', 'Pendente', 'Pago', 'Cancelado'];

// --- CARREGAMENTO DE DADOS DO CONTRATO PARA EDIÇÃO ---
const { data: contrato, pending } = await useAsyncData(`contrato-${contractId}`, async () => {
  const { data, error } = await supabase
    .from('contratos')
    .select(`
      *,
      consultor:funcionarios!consultor_id(id, nome_completo),
      loja:lojas!loja_id(id, nome)
    `)
    .eq('id', contractId)
    .single();

  if (error) {
    toast.add({ title: 'Erro!', description: 'Não foi possível carregar o contrato.', color: 'red' });
    return null;
  }
  
  console.log('📝 [Edição Contrato] Dados carregados:', data);
  
  return data;
});

// Popula o formulário com os dados carregados
watch(contrato, (novoContrato) => {
  if (novoContrato) {
    console.log('📝 [Edição Contrato] Watch detectou dados:', novoContrato);
    
    // Garante que a edição só é possível nos status permitidos
    if (novoContrato.status !== 'Em Análise' && novoContrato.status !== 'Pendente') {
        toast.add({ title: 'Acesso Negado', description: 'Este contrato não pode mais ser editado.', color: 'red' });
        router.push('/backoffice/contratos');
        return;
    }
    
    // Desabilita watchs de limpeza durante carregamento inicial
    isLoadingInitialData.value = true;
    
    // Popula os campos do formulário
    formData.cliente_id = novoContrato.cliente_id;
    formData.produto_id = novoContrato.produto_id;
    formData.banco_id = novoContrato.banco_id;
    formData.loja_id = novoContrato.loja_id;
    formData.consultor_id = novoContrato.consultor_id;
    formData.data_contrato = novoContrato.data_contrato;
    formData.status = novoContrato.status;
    formData.valor_total = novoContrato.valor_total;
    formData.valor_parcela = novoContrato.valor_parcela;
    formData.tabela = novoContrato.tabela;
    formData.prazo = novoContrato.prazo; // Já vem como número do banco
    formData.numero_beneficio = novoContrato.numero_beneficio;
    formData.especie_beneficio = novoContrato.especie_beneficio;
    formData.data_pagamento = novoContrato.data_pagamento;
    formData.motivo_status = novoContrato.motivo_status;
    formData.adesao = novoContrato.adesao;
    
    // Reabilita watchs após 100ms (dá tempo dos dados serem aplicados)
    setTimeout(() => {
      isLoadingInitialData.value = false;
      console.log('📋 [Edição Contrato] FormData populado:', {
        prazo: formData.prazo,
        prazo_tipo: typeof formData.prazo,
        tabela: formData.tabela,
        banco_id: formData.banco_id,
        consultor_id: formData.consultor_id,
        numero_beneficio: formData.numero_beneficio,
        especie_beneficio: formData.especie_beneficio,
        loja_id: formData.loja_id
      });
      
      // Debug: verifica prazos disponíveis após carregamento
      setTimeout(() => {
        console.log('🎯 [Debug Prazo] Prazos disponíveis:', prazosDisponiveis.value);
        console.log('🎯 [Debug Prazo] Prazo atual no formData:', formData.prazo);
        console.log('🎯 [Debug Prazo] Prazo encontrado?', prazosDisponiveis.value.some(p => p.value === formData.prazo));
      }, 100);
    }, 100);
  }
}, { immediate: true });


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
  return data || []; // Garante que sempre retorna um array
});

const { data: lojas } = await useAsyncData('lojas-form', async () => {
  const { data } = await supabase.from('lojas').select('id, nome');
  return data || [];
});

const { data: todasTabelas } = await useAsyncData('tabelas-form', async () => {
  const { data } = await supabase.from('tabelas').select('banco_id, nome_tabela, prazos');
  return data || []; // Garante que sempre retorna um array
});

const { data: todosConsultores } = await useAsyncData('consultores-form', async () => {
  const { data: perfilConsultor } = await supabase.from('perfis').select('id').eq('nome', 'Consultor').single();
  if (!perfilConsultor) return [];
  try {
    const tokenResp = await supabase.auth.getSession();
    const token = tokenResp?.data?.session?.access_token || null;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await $fetch('/api/funcionarios/search', { method: 'POST', headers, body: { perfil_ids: [perfilConsultor.id], is_active: true, limit: 200 } });
    return (res?.data) || [];
  } catch (err) {
    console.error('Erro ao carregar consultores via endpoint:', err);
    return [];
  }
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
  
  // Formata os prazos (números) para exibição (texto "72x")
  if (!tabelaSelecionada || !tabelaSelecionada.prazos) return [];
  return tabelaSelecionada.prazos.map(p => ({ label: `${p}x`, value: p }));
});

const consultoresFiltrados = computed(() => {
  if (!formData.loja_id || !todosConsultores.value) return [];
  return todosConsultores.value.filter(c => c.loja_id === formData.loja_id);
});

// Observa a seleção do cliente e limpa o campo de benefício (só quando não está carregando)
watch(() => formData.cliente_id, () => {
  if (!isLoadingInitialData.value) {
    formData.numero_beneficio = null;
    console.log('🧹 Limpou numero_beneficio (cliente mudou)');
  }
});

watch(() => formData.loja_id, () => {
  if (!isLoadingInitialData.value) {
    formData.consultor_id = null;
    console.log('🧹 Limpou consultor_id (loja mudou)');
  }
});

watch(() => formData.banco_id, () => {
  if (!isLoadingInitialData.value) {
    formData.tabela = null;
    formData.prazo = null;
    console.log('🧹 Limpou tabela e prazo (banco mudou)');
  }
});

watch(() => formData.tabela, () => {
  if (!isLoadingInitialData.value) {
    formData.prazo = null;
    console.log('🧹 Limpou prazo (tabela mudou)');
  }
});

watch(() => formData.status, (newStatus) => {
  if (newStatus === 'Pago') {
    formData.motivo_status = '';
  }
});

// --- LÓGICA DE SUBMISSÃO ATUALIZADA PARA EDIÇÃO ---
async function handleFormSubmit() {
  if (!formData.adesao) {
    toast.add({ title: 'Atenção!', description: 'O campo "Adesão" é obrigatório.', color: 'amber' });
    return;
  }
  
  console.log('💾 [Edição Contrato] Dados a salvar:', formData);
  
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
    const { id, created_at, numero_contrato, consultor, loja, ...dataToUpdate } = formData;
    
    // CORREÇÃO: Garante que prazo é número inteiro
    if (dataToUpdate.prazo) {
      dataToUpdate.prazo = typeof dataToUpdate.prazo === 'number' ? dataToUpdate.prazo : parseInt(String(dataToUpdate.prazo).replace(/\D/g, ''), 10);
    }
    
    // CORREÇÃO: Adiciona especie_beneficio buscando do cliente selecionado
    if (dataToUpdate.numero_beneficio && clienteSelecionado.value) {
      if (dataToUpdate.numero_beneficio === clienteSelecionado.value.numero_beneficio_1) {
        dataToUpdate.especie_beneficio = clienteSelecionado.value.especie_beneficio_1;
      } else if (dataToUpdate.numero_beneficio === clienteSelecionado.value.numero_beneficio_2) {
        dataToUpdate.especie_beneficio = clienteSelecionado.value.especie_beneficio_2;
      }
    }
    
    console.log('💾 [Edição Contrato] Dados finais para UPDATE:', dataToUpdate);
    
    const { error } = await supabase
      .from('contratos')
      .update(dataToUpdate)
      .eq('id', contractId);

    if (error) throw error;
    
    toast.add({ title: 'Sucesso!', description: 'Contrato atualizado com sucesso.' });
    router.push('/backoffice/contratos');

  } catch (error) {
    console.error('❌ [Edição Contrato] Erro ao atualizar:', error);
    toast.add({ title: 'Erro!', description: error.message, color: 'red' });
  } finally {
    saving.value = false;
  }
}


</script>