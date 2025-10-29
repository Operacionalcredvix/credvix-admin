<template>
  <div>
    <header class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-primary-500 text-3xl font-bold">Funcionários em Experiência</h1>
          <p class="text-gray-500 mt-1">Acompanhamento de funcionários com até 90 dias na empresa</p>
        </div>
        <UButton 
          icon="i-heroicons-arrow-path" 
          @click="recarregar" 
          :loading="carregando"
          color="gray"
          variant="ghost"
        >
          Atualizar
        </UButton>
      </div>
    </header>

    <!-- Filtros -->
    <UCard class="mb-6">
      <div class="flex flex-wrap gap-4 items-end">
        <UFormGroup label="Período de Experiência" class="flex-grow">
          <USelectMenu 
            v-model="filtroSelecionado" 
            :options="filtrosDisponiveis"
            value-attribute="value"
            option-attribute="label"
          />
        </UFormGroup>
        
        <div class="flex gap-2">
          <UBadge color="red" variant="subtle">
            <UIcon name="i-heroicons-exclamation-triangle" class="mr-1" />
            40-45 dias
          </UBadge>
          <UBadge color="red" variant="subtle">
            <UIcon name="i-heroicons-exclamation-triangle" class="mr-1" />
            85-90 dias
          </UBadge>
        </div>
      </div>
    </UCard>

    <!-- Tabela de Funcionários -->
    <UCard v-if="!carregando">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">Total: {{ funcionariosFiltrados.length }} funcionário(s)</h3>
        </div>
      </template>

      <UTable 
        :rows="funcionariosFiltrados" 
        :columns="colunas"
        :empty-state="{ icon: 'i-heroicons-user-group', label: 'Nenhum funcionário em experiência encontrado' }"
      >
        <template #nome_completo-data="{ row }">
          <div :class="{'text-red-600 font-bold': estaEmAlerta(row.dias_na_empresa)}">
            {{ row.nome_completo }}
          </div>
        </template>

        <template #data_admissao-data="{ row }">
          <div :class="{'text-red-600 font-bold': estaEmAlerta(row.dias_na_empresa)}">
            {{ formatarData(row.data_admissao) }}
          </div>
        </template>

        <template #dias_na_empresa-data="{ row }">
          <UBadge 
            :color="getCorBadgeDias(row.dias_na_empresa)" 
            :variant="estaEmAlerta(row.dias_na_empresa) ? 'solid' : 'subtle'"
            size="lg"
          >
            <UIcon 
              v-if="estaEmAlerta(row.dias_na_empresa)" 
              name="i-heroicons-exclamation-triangle" 
              class="mr-1" 
            />
            {{ row.dias_na_empresa }} dias
          </UBadge>
        </template>

        <template #loja_nome-data="{ row }">
          <div :class="{'text-red-600 font-bold': estaEmAlerta(row.dias_na_empresa)}">
            {{ row.loja_nome || 'Sem loja' }}
          </div>
        </template>

        <template #regional_nome-data="{ row }">
          <div :class="{'text-red-600 font-bold': estaEmAlerta(row.dias_na_empresa)}">
            {{ row.regional_nome || 'Sem regional' }}
          </div>
        </template>

        <template #status_contrato-data="{ row }">
          <UBadge 
            :color="row.ativo ? 'green' : 'gray'" 
            :variant="estaEmAlerta(row.dias_na_empresa) ? 'solid' : 'subtle'"
          >
            {{ row.ativo ? 'Ativo' : 'Inativo' }}
          </UBadge>
        </template>

        <template #periodo_experiencia-data="{ row }">
          <div :class="{'text-red-600 font-bold': estaEmAlerta(row.dias_na_empresa)}">
            {{ getPeriodoExperiencia(row.dias_na_empresa) }}
          </div>
        </template>
      </UTable>
    </UCard>

    <div v-else class="text-center py-10 text-gray-500">
      <UIcon name="i-heroicons-arrow-path" class="text-2xl animate-spin" />
      <p class="mt-2">Carregando funcionários...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { format } from 'date-fns';

definePageMeta({
  middleware: 'auth',
  profiles: ['Master', 'RH']
});

const supabase = useSupabaseClient();
const toast = useToast();

// --- ESTADO ---
const carregando = ref(false);
const funcionarios = ref([]);
const filtroSelecionado = ref('todos');

const filtrosDisponiveis = [
  { label: 'Todos (experiência)', value: 'todos' },
  { label: 'Até 45 dias (1º período)', value: 'ate_45' },
  { label: '46 a 90 dias (2º período)', value: '46_90' },
  { label: 'Acima de 90 dias', value: 'acima_90' }
];

const colunas = [
  { key: 'nome_completo', label: 'Nome' },
  { key: 'data_admissao', label: 'Data Admissão' },
  { key: 'dias_na_empresa', label: 'Dias na Empresa' },
  { key: 'periodo_experiencia', label: 'Período' },
  { key: 'loja_nome', label: 'Loja' },
  { key: 'regional_nome', label: 'Regional' },
  { key: 'status_contrato', label: 'Status' }
];

// --- FUNÇÕES DE CÁLCULO ---
function calcularDias(dataAdmissao) {
  if (!dataAdmissao) return 0;
  
  // Garante que estamos trabalhando com data no formato correto
  const admissao = new Date(dataAdmissao + 'T00:00:00');
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0); // Zera as horas para comparação de dias completos
  
  const diffTime = hoje.getTime() - admissao.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

function estaEmAlerta(dias) {
  return (dias >= 40 && dias <= 45) || (dias >= 85 && dias <= 90);
}

function getCorBadgeDias(dias) {
  if (dias >= 40 && dias <= 45) return 'red';
  if (dias >= 85 && dias <= 90) return 'red';
  if (dias <= 45) return 'blue';
  return 'yellow';
}

function getPeriodoExperiencia(dias) {
  if (dias <= 45) return '1º período (até 45 dias)';
  return '2º período (46-90 dias)';
}

function formatarData(data) {
  if (!data) return '-';
  return format(new Date(data), 'dd/MM/yyyy');
}

// --- COMPUTED ---
const funcionariosFiltrados = computed(() => {
  if (!funcionarios.value) return [];

  let lista = funcionarios.value;

  // Aplica filtro selecionado
  if (filtroSelecionado.value === 'ate_45') {
    lista = lista.filter(f => f.dias_na_empresa <= 45);
  } else if (filtroSelecionado.value === '46_90') {
    lista = lista.filter(f => f.dias_na_empresa >= 46 && f.dias_na_empresa <= 90);
  } else if (filtroSelecionado.value === 'acima_90') {
    lista = lista.filter(f => f.dias_na_empresa > 90);
  } else if (filtroSelecionado.value === 'todos') {
    // Mostra apenas funcionários em experiência (até 90 dias)
    lista = lista.filter(f => f.dias_na_empresa <= 90);
  }

  // Ordena: alertas primeiro, depois por dias decrescente
  return lista.sort((a, b) => {
    const alertaA = estaEmAlerta(a.dias_na_empresa);
    const alertaB = estaEmAlerta(b.dias_na_empresa);
    
    if (alertaA && !alertaB) return -1;
    if (!alertaA && alertaB) return 1;
    
    return b.dias_na_empresa - a.dias_na_empresa;
  });
});

// --- FUNÇÕES DE DADOS ---
async function carregarFuncionarios() {
  carregando.value = true;
  try {
    // Busca funcionários com seus vínculos ativos
    const { data, error } = await supabase
      .from('historico_vinculos')
      .select(`
        id,
        data_admissao,
        data_saida,
        funcionario_id,
        funcionarios (
          id,
          nome_completo,
          is_active,
          loja_id,
          lojas (
            id,
            nome,
            regional_id,
            regionais (
              id,
              nome_regional
            )
          )
        )
      `)
      .is('data_saida', null)
      .not('data_admissao', 'is', null)
      .order('data_admissao', { ascending: false });

    if (error) throw error;

    // Mapeia os dados com cálculo de dias
    const todosComDias = (data || [])
      .filter(v => v.funcionarios) // Garante que o funcionário existe
      .map(v => ({
        id: v.funcionarios.id,
        nome_completo: v.funcionarios.nome_completo,
        data_admissao: v.data_admissao,
        dias_na_empresa: calcularDias(v.data_admissao),
        ativo: v.funcionarios.is_active,
        loja_nome: v.funcionarios.lojas?.nome,
        regional_nome: v.funcionarios.lojas?.regionais?.nome_regional
      }));

    // Filtra apenas funcionários ativos
    funcionarios.value = todosComDias.filter(f => f.ativo);

  } catch (error) {
    console.error('❌ [Funcionários Experiência] Erro ao carregar:', error);
    toast.add({
      title: 'Erro ao carregar funcionários',
      description: error.message,
      color: 'red'
    });
  } finally {
    carregando.value = false;
  }
}

async function recarregar() {
  await carregarFuncionarios();
  toast.add({
    title: 'Atualizado!',
    description: 'Lista de funcionários atualizada com sucesso.',
    color: 'green'
  });
}

// --- LIFECYCLE ---
onMounted(() => {
  carregarFuncionarios();
});
</script>
