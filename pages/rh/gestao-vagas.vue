<template>
  <div>
    <header class="mb-8 flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold">Gestão de Vagas</h1>
        <!-- Legenda de Prioridades -->
        <div class="flex items-center gap-3 mt-3">
          <span class="text-sm text-gray-500">Prioridades:</span>
          <UPopover 
            v-for="(info, prioridade) in prioridadeInfo" 
            :key="prioridade"
            mode="hover"
          >
            <UBadge 
              :color="info.color" 
              variant="solid" 
              size="sm"
              class="cursor-help"
            >
              {{ prioridade }}
            </UBadge>
            
            <template #panel>
              <div class="p-3 max-w-xs">
                <p class="text-sm font-medium mb-1">{{ prioridade }}</p>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  {{ info.description }}
                </p>
              </div>
            </template>
          </UPopover>
        </div>
      </div>
      <UButton icon="i-heroicons-plus-circle" size="lg" @click="openModal()">
        Nova Vaga
      </UButton>
    </header>

    <!-- Filtros -->
    <UCard class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <UFormGroup label="Buscar">
          <UInput v-model="filters.search" placeholder="Buscar por loja ou cargo..." icon="i-heroicons-magnifying-glass" />
        </UFormGroup>
        
        <UFormGroup label="Loja">
          <USelectMenu
            v-model="filters.lojaId"
            :options="lojasOptions"
            placeholder="Todas as lojas"
            value-attribute="value"
            option-attribute="label"
          />
        </UFormGroup>
        
        <UFormGroup label="Cargo">
          <USelectMenu
            v-model="filters.cargoId"
            :options="cargosOptions"
            placeholder="Todos os cargos"
            value-attribute="value"
            option-attribute="label"
          />
        </UFormGroup>
        
        <UFormGroup label="Status">
          <USelectMenu
            v-model="filters.status"
            :options="statusOptions"
            placeholder="Todos os status"
          />
        </UFormGroup>

        <UFormGroup label="Prioridade">
          <USelectMenu
            v-model="filters.prioridade"
            :options="['Todas', ...prioridadeOptions]"
            placeholder="Todas as prioridades"
          />
        </UFormGroup>
      </div>
    </UCard>

    <!-- Cards de Vagas Agrupadas por Loja -->
    <div v-if="pending" class="flex justify-center items-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl text-primary-500" />
    </div>

    <div v-else-if="groupedVagas.length === 0" class="text-center py-12">
      <UIcon name="i-heroicons-inbox" class="text-6xl text-gray-400 mb-4" />
      <p class="text-gray-500 text-lg">Nenhuma vaga encontrada</p>
      <UButton class="mt-4" @click="openModal()">Criar primeira vaga</UButton>
    </div>

    <div v-else class="space-y-6">
      <div v-for="group in groupedVagas" :key="group.lojaId">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
            {{ group.lojaNome }}
            <UBadge class="ml-2">{{ group.vagas.length }} vaga(s)</UBadge>
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <UCard 
            v-for="vaga in group.vagas" 
            :key="vaga.id" 
            class="hover:shadow-lg transition-shadow"
            :class="getCardBorderClass(vaga)"
          >
            <template #header>
              <div class="flex justify-between items-start gap-2">
                <div class="flex-1">
                  <h3 class="font-semibold text-lg text-gray-900 dark:text-white">
                    {{ vaga.cargo_nome }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {{ vaga.loja_nome }}
                  </p>
                </div>
                <div class="flex gap-2">
                  <!-- Badge de Status -->
                  <UBadge 
                    :color="getStatusColor(vaga.status)" 
                    variant="subtle"
                    size="sm"
                  >
                    {{ vaga.status }}
                  </UBadge>
                  
                  <!-- Badge de Prioridade com Popover -->
                  <UPopover mode="hover">
                    <UBadge 
                      :color="getPrioridadeColor(vaga.prioridade)" 
                      variant="solid"
                      size="sm"
                      class="cursor-help"
                    >
                      {{ vaga.prioridade }}
                    </UBadge>
                    
                    <template #panel>
                      <div class="p-3 max-w-xs">
                        <p class="text-sm font-medium mb-1">{{ vaga.prioridade }}</p>
                        <p class="text-xs text-gray-600 dark:text-gray-400">
                          {{ prioridadeInfo[vaga.prioridade]?.description }}
                        </p>
                      </div>
                    </template>
                  </UPopover>
                </div>
              </div>
            </template>

            <div class="space-y-3">
              <!-- Alerta de vaga vencida -->
              <div v-if="isVagaVencida(vaga)" class="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-2">
                <div class="flex items-center gap-2 text-red-700 dark:text-red-300">
                  <UIcon name="i-heroicons-exclamation-triangle" class="text-xl" />
                  <span class="text-sm font-semibold">Vaga Vencida!</span>
                </div>
              </div>

              <!-- Data prevista -->
              <div v-if="vaga.data_prevista_preenchimento" class="flex items-center gap-2 text-sm">
                <UIcon name="i-heroicons-calendar" class="text-gray-400" />
                <span class="text-gray-600 dark:text-gray-400">
                  Preencher até: <strong>{{ formatDate(vaga.data_prevista_preenchimento) }}</strong>
                  <span 
                    v-if="!isVagaVencida(vaga) && getDiasRestantes(vaga.data_prevista_preenchimento) !== null"
                    :class="getDiasRestantes(vaga.data_prevista_preenchimento) <= 7 ? 'text-orange-600' : 'text-gray-500'"
                  >
                    ({{ getDiasRestantes(vaga.data_prevista_preenchimento) }} dias)
                  </span>
                </span>
              </div>

              <div class="grid grid-cols-3 gap-2 text-center">
                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {{ vaga.qtd_orcados }}
                  </div>
                  <div class="text-xs text-gray-600 dark:text-gray-400">Orçados</div>
                </div>
                
                <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                    {{ vaga.qtd_ativos }}
                  </div>
                  <div class="text-xs text-gray-600 dark:text-gray-400">Ativos</div>
                </div>
                
                <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                  <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {{ vaga.qtd_vagas_abertas }}
                  </div>
                  <div class="text-xs text-gray-600 dark:text-gray-400">Abertas</div>
                </div>
              </div>

              <div v-if="vaga.descricao" class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {{ vaga.descricao }}
              </div>

              <div class="text-xs text-gray-400">
                Criado em {{ formatDate(vaga.created_at) }}
              </div>
            </div>

            <template #footer>
              <div class="flex gap-2">
                <UButton 
                  icon="i-heroicons-pencil" 
                  size="sm" 
                  color="gray" 
                  variant="soft"
                  class="flex-1"
                  @click="openModal(vaga)"
                >
                  Editar
                </UButton>
                <UButton 
                  icon="i-heroicons-check-circle" 
                  size="sm" 
                  color="green" 
                  variant="soft"
                  @click="fecharVaga(vaga)"
                  :disabled="vaga.status === 'Fechada'"
                >
                  Fechar
                </UButton>
              </div>
            </template>
          </UCard>
        </div>
      </div>
    </div>

    <!-- Modal de Criação/Edição -->
    <UModal v-model="isModalOpen" :ui="{ width: 'sm:max-w-2xl' }">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              {{ formData.id ? 'Editar Vaga' : 'Nova Vaga' }}
            </h3>
            <UButton 
              color="gray" 
              variant="ghost" 
              icon="i-heroicons-x-mark-20-solid" 
              @click="isModalOpen = false" 
            />
          </div>
        </template>

        <UForm :state="formData" @submit="handleSubmit" class="space-y-4">
          <UFormGroup label="Loja" name="loja_id" required>
            <USelectMenu
              v-model="formData.loja_id"
              :options="lojas"
              placeholder="Selecione a loja"
              value-attribute="id"
              option-attribute="nome"
              searchable
            />
          </UFormGroup>

          <UFormGroup label="Cargo" name="cargo_id" required>
            <USelectMenu
              v-model="formData.cargo_id"
              :options="perfis"
              placeholder="Selecione o cargo"
              value-attribute="id"
              option-attribute="nome"
              searchable
            />
          </UFormGroup>

          <div class="grid grid-cols-3 gap-4">
            <UFormGroup label="Qtd. Orçados" name="qtd_orcados" required>
              <UInput 
                v-model.number="formData.qtd_orcados" 
                type="number" 
                min="0"
                placeholder="0" 
              />
            </UFormGroup>

            <UFormGroup label="Qtd. Ativos" name="qtd_ativos" required>
              <UInput 
                v-model.number="formData.qtd_ativos" 
                type="number" 
                min="0"
                placeholder="0" 
              />
            </UFormGroup>

            <UFormGroup label="Qtd. Vagas Abertas" name="qtd_vagas_abertas" required>
              <UInput 
                v-model.number="formData.qtd_vagas_abertas" 
                type="number" 
                min="0"
                placeholder="0" 
              />
            </UFormGroup>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Status" name="status" required>
              <USelectMenu
                v-model="formData.status"
                :options="['Aberta', 'Em Processo', 'Fechada']"
                placeholder="Selecione o status"
              />
            </UFormGroup>

            <UFormGroup label="Prioridade" name="prioridade" required>
              <USelectMenu
                v-model="formData.prioridade"
                :options="prioridadeOptions"
                placeholder="Selecione a prioridade"
              />
            </UFormGroup>
          </div>

          <UFormGroup label="Data Prevista para Preenchimento" name="data_prevista_preenchimento">
            <UInput 
              v-model="formData.data_prevista_preenchimento" 
              type="date"
              placeholder="Selecione uma data"
            />
          </UFormGroup>

          <UFormGroup label="Descrição/Observações" name="descricao">
            <UTextarea 
              v-model="formData.descricao" 
              :rows="4"
              placeholder="Descreva informações importantes sobre essa vaga, ações realizadas, etc."
            />
          </UFormGroup>

          <div class="flex justify-end gap-2 pt-4">
            <UButton 
              label="Cancelar" 
              color="gray" 
              variant="ghost" 
              @click="isModalOpen = false" 
            />
            <UButton 
              type="submit" 
              :label="formData.id ? 'Salvar Alterações' : 'Criar Vaga'" 
              :loading="saving" 
            />
          </div>
        </UForm>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
definePageMeta({ 
  middleware: 'auth', 
  profiles: ['Master', 'Diretoria', 'Gerência', 'RH'] 
});

import { ref, reactive, computed } from 'vue';

const supabase = useSupabaseClient();
const toast = useToast();

// --- ESTADO ---
const isModalOpen = ref(false);
const saving = ref(false);

const filters = reactive({
  search: '',
  lojaId: null,
  cargoId: null,
  status: null,
  prioridade: null
});

const getInitialFormData = () => ({
  id: null,
  loja_id: null,
  cargo_id: null,
  qtd_orcados: 0,
  qtd_ativos: 0,
  qtd_vagas_abertas: 0,
  status: 'Aberta',
  prioridade: 'Pode Esperar',
  data_prevista_preenchimento: null,
  descricao: ''
});

const formData = reactive(getInitialFormData());

// --- CARREGAR DADOS ---
const { data: vagas, pending, refresh } = await useAsyncData('gestao-vagas', async () => {
  const { data, error } = await supabase
    .from('gestao_vagas')
    .select(`
      *,
      lojas:loja_id(id, nome),
      perfis:cargo_id(id, nome)
    `)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Erro ao carregar vagas:', error);
    throw error;
  }
  
  if (!data) return [];
  
  return data.map(v => ({
    ...v,
    loja_nome: v.lojas?.nome || 'Loja não encontrada',
    cargo_nome: v.perfis?.nome || 'Cargo não encontrado'
  }));
});

const { data: lojas } = await useAsyncData('lojas-list', async () => {
  const { data } = await supabase
    .from('lojas')
    .select('id, nome')
    .eq('is_active', true)
    .order('nome');
  return data || [];
});

const { data: perfis } = await useAsyncData('perfis-list', async () => {
  const { data } = await supabase
    .from('perfis')
    .select('id, nome')
    .order('nome');
  return data || [];
});

// --- COMPUTED ---
const lojasOptions = computed(() => [
  { label: 'Todas as lojas', value: null },
  ...(lojas.value || []).map(l => ({ label: l.nome, value: l.id }))
]);

const cargosOptions = computed(() => [
  { label: 'Todos os cargos', value: null },
  ...(perfis.value || []).map(p => ({ label: p.nome, value: p.id }))
]);

const statusOptions = [
  'Todos os status',
  'Aberta',
  'Em Processo',
  'Fechada'
];

const prioridadeOptions = [
  'Urgente',
  'Crítica',
  'Pode Esperar',
  'Oportunidade'
];

const prioridadeInfo = {
  'Urgente': {
    color: 'red',
    bgClass: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    description: 'Vaga que precisa ser preenchida imediatamente. Alto impacto na operação.'
  },
  'Crítica': {
    color: 'orange',
    bgClass: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    description: 'Vaga importante que deve ser preenchida em breve. Impacto moderado.'
  },
  'Pode Esperar': {
    color: 'blue',
    bgClass: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    description: 'Vaga com prazo flexível. Impacto baixo na operação.'
  },
  'Oportunidade': {
    color: 'green',
    bgClass: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    description: 'Vaga para aproveitamento de bons candidatos. Não há urgência.'
  }
};

const filteredVagas = computed(() => {
  if (!vagas.value) return [];
  
  return vagas.value.filter(vaga => {
    // Filtro de busca
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matchSearch = 
        vaga.loja_nome.toLowerCase().includes(search) ||
        vaga.cargo_nome.toLowerCase().includes(search) ||
        vaga.descricao?.toLowerCase().includes(search);
      if (!matchSearch) return false;
    }
    
    // Filtro de loja
    if (filters.lojaId && vaga.loja_id !== filters.lojaId) {
      return false;
    }
    
    // Filtro de cargo
    if (filters.cargoId && vaga.cargo_id !== filters.cargoId) {
      return false;
    }
    
    // Filtro de status
    if (filters.status && filters.status !== 'Todos os status' && vaga.status !== filters.status) {
      return false;
    }
    
    // Filtro de prioridade
    if (filters.prioridade && filters.prioridade !== 'Todas' && vaga.prioridade !== filters.prioridade) {
      return false;
    }
    
    return true;
  });
});

const groupedVagas = computed(() => {
  const groups = {};
  
  filteredVagas.value.forEach(vaga => {
    if (!groups[vaga.loja_id]) {
      groups[vaga.loja_id] = {
        lojaId: vaga.loja_id,
        lojaNome: vaga.loja_nome,
        vagas: []
      };
    }
    groups[vaga.loja_id].vagas.push(vaga);
  });
  
  return Object.values(groups).sort((a, b) => 
    a.lojaNome.localeCompare(b.lojaNome)
  );
});

// --- FUNÇÕES ---
const getStatusColor = (status) => {
  const colors = {
    'Aberta': 'green',
    'Em Processo': 'orange',
    'Fechada': 'gray'
  };
  return colors[status] || 'gray';
};

const getPrioridadeColor = (prioridade) => {
  return prioridadeInfo[prioridade]?.color || 'gray';
};

const getCardBorderClass = (vaga) => {
  // Se a vaga está vencida, retorna borda vermelha independente da prioridade
  if (isVagaVencida(vaga)) {
    return 'border-2 border-red-500 shadow-red-200 dark:shadow-red-900/50';
  }
  
  // Caso contrário, usa a cor da prioridade
  const prioridade = vaga.prioridade || 'Pode Esperar';
  const info = prioridadeInfo[prioridade];
  return `border-2 ${info.bgClass}`;
};

const isVagaVencida = (vaga) => {
  if (!vaga.data_prevista_preenchimento) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataPrevista = new Date(vaga.data_prevista_preenchimento);
  return dataPrevista < hoje && vaga.status !== 'Fechada';
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const getDiasRestantes = (dataString) => {
  if (!dataString) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataPrevista = new Date(dataString);
  const diff = Math.ceil((dataPrevista - hoje) / (1000 * 60 * 60 * 24));
  return diff;
};

const openModal = (vaga = null) => {
  if (vaga) {
    Object.assign(formData, {
      id: vaga.id,
      loja_id: vaga.loja_id,
      cargo_id: vaga.cargo_id,
      qtd_orcados: vaga.qtd_orcados,
      qtd_ativos: vaga.qtd_ativos,
      qtd_vagas_abertas: vaga.qtd_vagas_abertas,
      status: vaga.status,
      prioridade: vaga.prioridade || 'Pode Esperar',
      data_prevista_preenchimento: vaga.data_prevista_preenchimento || null,
      descricao: vaga.descricao || ''
    });
  } else {
    Object.assign(formData, getInitialFormData());
  }
  isModalOpen.value = true;
};

const handleSubmit = async () => {
  saving.value = true;
  try {
    const dataToSave = {
      loja_id: formData.loja_id,
      cargo_id: formData.cargo_id,
      qtd_orcados: formData.qtd_orcados,
      qtd_ativos: formData.qtd_ativos,
      qtd_vagas_abertas: formData.qtd_vagas_abertas,
      status: formData.status,
      prioridade: formData.prioridade || 'Pode Esperar',
      data_prevista_preenchimento: formData.data_prevista_preenchimento || null,
      descricao: formData.descricao || null
    };

    console.log('Salvando vaga:', dataToSave);

    if (formData.id) {
      // Editar
      const { data, error } = await supabase
        .from('gestao_vagas')
        .update(dataToSave)
        .eq('id', formData.id)
        .select();
      
      if (error) {
        console.error('Erro ao atualizar:', error);
        throw error;
      }
      console.log('Vaga atualizada:', data);
      toast.add({ 
        title: 'Sucesso!', 
        description: 'Vaga atualizada com sucesso.' 
      });
    } else {
      // Criar
      const { data, error } = await supabase
        .from('gestao_vagas')
        .insert(dataToSave)
        .select();
      
      if (error) {
        console.error('Erro ao inserir:', error);
        throw error;
      }
      console.log('Vaga criada:', data);
      toast.add({ 
        title: 'Sucesso!', 
        description: 'Vaga criada com sucesso.' 
      });
    }

    isModalOpen.value = false;
    await refresh();
  } catch (error) {
    console.error('Erro ao salvar vaga:', error);
    toast.add({ 
      title: 'Erro!', 
      description: error.message || 'Erro ao salvar vaga', 
      color: 'red' 
    });
  } finally {
    saving.value = false;
  }
};

const fecharVaga = async (vaga) => {
  if (vaga.status === 'Fechada') return;
  
  const confirmacao = confirm(
    `Tem certeza que deseja fechar a vaga de ${vaga.cargo_nome} na loja ${vaga.loja_nome}?`
  );
  
  if (!confirmacao) return;
  
  try {
    const { error } = await supabase
      .from('gestao_vagas')
      .update({ status: 'Fechada' })
      .eq('id', vaga.id);
    
    if (error) throw error;
    
    toast.add({ 
      title: 'Vaga fechada', 
      description: 'A vaga foi marcada como fechada.' 
    });
    
    await refresh();
  } catch (error) {
    console.error('Erro ao fechar vaga:', error);
    toast.add({ 
      title: 'Erro!', 
      description: error.message, 
      color: 'red' 
    });
  }
};
</script>
