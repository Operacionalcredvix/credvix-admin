<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-clipboard-document-check" class="text-xl text-primary-500" />
        <h3 class="font-semibold">Fluxo de Aprovação</h3>
      </div>
    </template>

    <!-- Timeline de Aprovação -->
    <div class="space-y-4">
      <!-- Nível 1: Coordenador (se aplicável) -->
      <div v-if="!requisicao.requer_aprovacao_gerente" class="flex items-start gap-4">
        <div class="flex-shrink-0">
          <div 
            :class="[
              'w-10 h-10 rounded-full flex items-center justify-center',
              getStepColor('coordenador')
            ]"
          >
            <UIcon 
              :name="getStepIcon('coordenador')" 
              class="text-white text-xl"
            />
          </div>
        </div>
        <div class="flex-1 pt-1">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-semibold text-gray-900 dark:text-white">1. Coordenador</p>
              <p v-if="requisicao.coordenador_nome" class="text-sm text-gray-600 dark:text-gray-400">
                {{ requisicao.coordenador_nome }}
              </p>
              <p v-if="requisicao.data_aprovacao_coordenador" class="text-xs text-gray-500 mt-1">
                Aprovado em {{ formatarData(requisicao.data_aprovacao_coordenador) }}
              </p>
            </div>
            <UButton
              v-if="podeAprovarCoordenador"
              size="sm"
              color="primary"
              @click="$emit('aprovar-coordenador')"
            >
              Aprovar
            </UButton>
          </div>
          <p v-if="requisicao.parecer_coordenador" class="text-sm text-gray-700 dark:text-gray-300 mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
            {{ requisicao.parecer_coordenador }}
          </p>
        </div>
      </div>

      <!-- Linha conectora -->
      <div v-if="!requisicao.requer_aprovacao_gerente" class="ml-5 h-8 w-0.5 bg-gray-300 dark:bg-gray-600"></div>

      <!-- Nível 1/2: Gerente (se aplicável - quando coordenador faz requisição) -->
      <div v-if="requisicao.requer_aprovacao_gerente" class="flex items-start gap-4">
        <div class="flex-shrink-0">
          <div 
            :class="[
              'w-10 h-10 rounded-full flex items-center justify-center',
              getStepColor('gerente')
            ]"
          >
            <UIcon 
              :name="getStepIcon('gerente')" 
              class="text-white text-xl"
            />
          </div>
        </div>
        <div class="flex-1 pt-1">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-semibold text-gray-900 dark:text-white">1. Gerente</p>
              <p v-if="requisicao.gerente_nome" class="text-sm text-gray-600 dark:text-gray-400">
                {{ requisicao.gerente_nome }}
              </p>
              <p v-if="requisicao.data_aprovacao_gerente" class="text-xs text-gray-500 mt-1">
                Aprovado em {{ formatarData(requisicao.data_aprovacao_gerente) }}
              </p>
            </div>
            <UButton
              v-if="podeAprovarGerente"
              size="sm"
              color="primary"
              @click="$emit('aprovar-gerente')"
            >
              Aprovar
            </UButton>
          </div>
          <p v-if="requisicao.parecer_gerente" class="text-sm text-gray-700 dark:text-gray-300 mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
            {{ requisicao.parecer_gerente }}
          </p>
        </div>
      </div>

      <!-- Linha conectora -->
      <div v-if="requisicao.requer_aprovacao_gerente" class="ml-5 h-8 w-0.5 bg-gray-300 dark:bg-gray-600"></div>

      <!-- Nível 2/2: Setor Responsável -->
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0">
          <div 
            :class="[
              'w-10 h-10 rounded-full flex items-center justify-center',
              getStepColor('setor')
            ]"
          >
            <UIcon 
              :name="getStepIcon('setor')" 
              class="text-white text-xl"
            />
          </div>
        </div>
        <div class="flex-1 pt-1">
          <p class="font-semibold text-gray-900 dark:text-white">2. Setor Responsável</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ requisicao.setor_destino }}
          </p>
          <p v-if="requisicao.responsavel_nome" class="text-xs text-gray-500 mt-1">
            Responsável: {{ requisicao.responsavel_nome }}
          </p>
          <p v-if="requisicao.data_aceite" class="text-xs text-gray-500 mt-1">
            Aceito em {{ formatarData(requisicao.data_aceite) }}
          </p>
        </div>
      </div>

      <!-- Linha conectora -->
      <div class="ml-5 h-8 w-0.5 bg-gray-300 dark:bg-gray-600"></div>

      <!-- Nível 3: Diretoria (Aprovação Final) -->
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0">
          <div 
            :class="[
              'w-10 h-10 rounded-full flex items-center justify-center',
              getStepColor('diretoria')
            ]"
          >
            <UIcon 
              :name="getStepIcon('diretoria')" 
              class="text-white text-xl"
            />
          </div>
        </div>
        <div class="flex-1 pt-1">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-semibold text-gray-900 dark:text-white">3. Diretoria (Aprovação Final)</p>
              <p v-if="requisicao.diretor_nome" class="text-sm text-gray-600 dark:text-gray-400">
                {{ requisicao.diretor_nome }}
              </p>
              <p v-if="requisicao.data_aprovacao_diretoria" class="text-xs text-gray-500 mt-1">
                Aprovado em {{ formatarData(requisicao.data_aprovacao_diretoria) }}
              </p>
            </div>
            <UButton
              v-if="podeAprovarDiretoria"
              size="sm"
              color="primary"
              @click="$emit('aprovar-diretoria')"
            >
              Aprovar Execução
            </UButton>
          </div>
          <p v-if="requisicao.parecer_diretoria" class="text-sm text-gray-700 dark:text-gray-300 mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
            {{ requisicao.parecer_diretoria }}
          </p>
        </div>
      </div>

      <!-- Botão de Reprovar (disponível em qualquer etapa para os aprovadores) -->
      <div v-if="podeReprovar" class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <UButton
          color="red"
          variant="ghost"
          block
          icon="i-heroicons-x-circle"
          @click="$emit('reprovar')"
        >
          Reprovar Requisição
        </UButton>
      </div>

      <!-- Mensagem de Reprovação -->
      <div v-if="requisicao.status === 'Reprovada' && requisicao.motivo_reprovacao" 
           class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div class="flex items-start gap-2">
          <UIcon name="i-heroicons-exclamation-triangle" class="text-red-600 text-xl flex-shrink-0 mt-0.5" />
          <div>
            <p class="font-semibold text-red-900 dark:text-red-200">Requisição Reprovada</p>
            <p class="text-sm text-red-800 dark:text-red-300 mt-1">{{ requisicao.motivo_reprovacao }}</p>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { RequisicaoCompleta } from '~/types/requisicoes';

const props = defineProps<{
  requisicao: RequisicaoCompleta;
  perfilUsuario: string;
  usuarioId: number;
}>();

defineEmits<{
  'aprovar-coordenador': [];
  'aprovar-gerente': [];
  'aprovar-diretoria': [];
  'reprovar': [];
}>();

// Verifica se o usuário pode aprovar em cada nível
const podeAprovarCoordenador = computed(() => {
  return props.perfilUsuario === 'Coordenador' && 
         props.requisicao.status === 'Aguardando Coordenador' &&
         props.requisicao.coordenador_id === props.usuarioId;
});

const podeAprovarGerente = computed(() => {
  // Aceita ambos os nomes de perfil: 'Gerência' ou 'Gerente'
  const perfisGerencia = ['Gerência', 'Gerente'];
  return perfisGerencia.includes(props.perfilUsuario) &&
         props.requisicao.status === 'Aguardando Gerente';
});

const podeAprovarDiretoria = computed(() => {
  return props.perfilUsuario === 'Diretoria' && 
         props.requisicao.status === 'Aguardando Aprovação Final';
});

const podeReprovar = computed(() => {
  const statusPermitidos = ['Aguardando Coordenador', 'Aguardando Gerente', 'Em Análise', 'Aguardando Aprovação Final'];
  const perfisPermitidos = ['Coordenador', 'Gerência', 'Gerente', 'Diretoria', 'Master'];
  
  return perfisPermitidos.includes(props.perfilUsuario) && 
         statusPermitidos.includes(props.requisicao.status);
});

// Funções auxiliares para o visual da timeline
function getStepColor(step: 'coordenador' | 'gerente' | 'diretoria' | 'setor'): string {
  const status = props.requisicao.status;
  
  switch (step) {
    case 'coordenador':
      if (status === 'Aguardando Coordenador') return 'bg-amber-500';
      if (['Em Análise', 'Aguardando Aprovação Final', 'Aceita', 'Concluída'].includes(status)) return 'bg-green-500';
      return 'bg-gray-300 dark:bg-gray-600';
      
    case 'gerente':
      if (status === 'Aguardando Gerente') return 'bg-amber-500';
      if (['Em Análise', 'Aguardando Aprovação Final', 'Aceita', 'Concluída'].includes(status)) return 'bg-green-500';
      return 'bg-gray-300 dark:bg-gray-600';
      
    case 'setor':
      if (status === 'Em Análise') return 'bg-amber-500';
      if (['Aguardando Aprovação Final', 'Aceita', 'Concluída'].includes(status)) return 'bg-green-500';
      return 'bg-gray-300 dark:bg-gray-600';
      
    case 'diretoria':
      if (status === 'Aguardando Aprovação Final') return 'bg-amber-500';
      if (['Aceita', 'Concluída'].includes(status)) return 'bg-green-500';
      return 'bg-gray-300 dark:bg-gray-600';
  }
}

function getStepIcon(step: 'coordenador' | 'gerente' | 'diretoria' | 'setor'): string {
  const status = props.requisicao.status;
  
  switch (step) {
    case 'coordenador':
      if (['Em Análise', 'Aguardando Aprovação Final', 'Aceita', 'Concluída'].includes(status)) return 'i-heroicons-check';
      if (status === 'Aguardando Coordenador') return 'i-heroicons-clock';
      return 'i-heroicons-user';
      
    case 'gerente':
      if (['Em Análise', 'Aguardando Aprovação Final', 'Aceita', 'Concluída'].includes(status)) return 'i-heroicons-check';
      if (status === 'Aguardando Gerente') return 'i-heroicons-clock';
      return 'i-heroicons-user';
      
    case 'setor':
      if (['Aguardando Aprovação Final', 'Aceita', 'Concluída'].includes(status)) return 'i-heroicons-check';
      if (status === 'Em Análise') return 'i-heroicons-clock';
      return 'i-heroicons-building-office';
      
    case 'diretoria':
      if (['Aceita', 'Concluída'].includes(status)) return 'i-heroicons-check';
      if (status === 'Aguardando Aprovação Final') return 'i-heroicons-clock';
      return 'i-heroicons-shield-check';
  }
}

function formatarData(data: string): string {
  return format(parseISO(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}
</script>
