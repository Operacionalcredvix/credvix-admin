<template>
  <div v-if="carregando" class="flex justify-center items-center h-64">
    <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin" />
  </div>

  <div v-else-if="requisicao" class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <UButton
          icon="i-heroicons-arrow-left"
          color="gray"
          variant="ghost"
          @click="router.back()"
        />
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ requisicao.numero_requisicao }}
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            {{ requisicao.titulo }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <UBadge :color="getStatusColor(requisicao.status)" variant="subtle" size="lg">
          {{ requisicao.status }}
        </UBadge>
        <UBadge 
          :color="getPrioridadeColor(requisicao.prioridade_final || requisicao.prioridade_sugerida)"
          variant="solid"
        >
          {{ requisicao.prioridade_final || requisicao.prioridade_sugerida }}
        </UBadge>

        <!-- Ações -->
        <div class="flex items-center gap-2 ml-4" v-if="mostrarAcoes">
          <UButton
            v-if="podeAceitar"
            size="sm"
            color="primary"
            icon="i-heroicons-check-circle"
            @click="abrirModalAceitar"
          >
            Aceitar
          </UButton>

          <UButton
            v-if="podeSolicitarInfo"
            size="sm"
            color="amber"
            icon="i-heroicons-question-mark-circle"
            @click="abrirModalSolicitarInfo"
          >
            Solicitar Informação
          </UButton>

          <UButton
            v-if="podeEnviarInformacoes"
            size="sm"
            color="cyan"
            icon="i-heroicons-arrow-uturn-left"
            @click="abrirModalEnviarInfo"
          >
            Enviar Informações
          </UButton>

          <UButton
            v-if="podeConcluir"
            size="sm"
            color="green"
            icon="i-heroicons-check"
            @click="abrirModalConcluir"
          >
            Concluir
          </UButton>

          <UButton
            v-if="podeCancelar"
            size="sm"
            color="red"
            variant="outline"
            icon="i-heroicons-x-mark"
            @click="abrirModalCancelar"
          >
            Cancelar
          </UButton>

          <UButton
            v-if="podeReatribuir"
            size="sm"
            color="violet"
            icon="i-heroicons-user-plus"
            @click="abrirModalReatribuir"
          >
            Reatribuir
          </UButton>
        </div>
      </div>
    </div>

    <!-- Grid Principal -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Coluna Principal (2/3) -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Detalhes -->
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Detalhes da Requisição</h3>
          </template>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
              <p class="mt-1 text-gray-900 dark:text-white whitespace-pre-wrap">{{ requisicao.descricao }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</label>
                <p class="mt-1">{{ requisicao.categoria }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Setor Destino</label>
                <div class="flex items-center gap-2 mt-1">
                  <UIcon :name="getSetorIcon(requisicao.setor_destino)" />
                  <span>{{ requisicao.setor_destino }}</span>
                </div>
              </div>
            </div>

            <div v-if="requisicao.parecer_resposta && requisicao.parecer_resposta.trim()">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Parecer/Resposta</label>
              <UAlert color="blue" variant="soft" class="mt-2">
                {{ requisicao.parecer_resposta }}
              </UAlert>
            </div>

            <div v-if="requisicao.detalhamento_execucao && requisicao.detalhamento_execucao.trim()">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Detalhamento da Execução</label>
              <UAlert color="green" variant="soft" class="mt-2">
                {{ requisicao.detalhamento_execucao }}
              </UAlert>
            </div>
          </div>
        </UCard>

        <!-- Anexos -->
        <UCard v-if="anexos.length > 0">
          <template #header>
            <h3 class="text-lg font-semibold">Anexos ({{ anexos.length }})</h3>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <a
              v-for="anexo in anexos"
              :key="anexo.id"
              :href="anexo.url_arquivo"
              target="_blank"
              class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <UIcon name="i-heroicons-document" class="w-5 h-5 text-gray-400" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ anexo.nome_arquivo }}</p>
                <p class="text-xs text-gray-500">{{ formatarTamanho(anexo.tamanho_bytes) }}</p>
              </div>
              <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4 text-gray-400" />
            </a>
          </div>
        </UCard>
      </div>

      <!-- Sidebar (1/3) -->
      <div class="space-y-6">
        <!-- Informações -->
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Informações</h3>
          </template>

          <div class="space-y-3 text-sm">
            <div>
              <label class="text-gray-600 dark:text-gray-400">Solicitante</label>
              <p class="font-medium">{{ requisicao.solicitante_nome }}</p>
              <p class="text-xs text-gray-500">{{ requisicao.solicitante_perfil }}</p>
            </div>

            <div>
              <label class="text-gray-600 dark:text-gray-400">Loja</label>
              <p class="font-medium">{{ requisicao.loja_nome }}</p>
              <p class="text-xs text-gray-500">{{ requisicao.nome_regional }}</p>
            </div>

            <div v-if="requisicao.responsavel_nome">
              <label class="text-gray-600 dark:text-gray-400">Responsável</label>
              <p class="font-medium">{{ requisicao.responsavel_nome }}</p>
            </div>

            <div>
              <label class="text-gray-600 dark:text-gray-400">Criada em</label>
              <p>{{ formatarData(requisicao.data_criacao) }}</p>
            </div>

            <div v-if="requisicao.prazo_final">
              <label class="text-gray-600 dark:text-gray-400">Prazo (SLA)</label>
              <p :class="requisicao.em_atraso ? 'text-red-600 font-semibold' : ''">
                {{ formatarData(requisicao.prazo_final) }}
              </p>
            </div>

            <div v-if="requisicao.data_conclusao">
              <label class="text-gray-600 dark:text-gray-400">Concluída em</label>
              <p>{{ formatarData(requisicao.data_conclusao) }}</p>
            </div>
          </div>
        </UCard>

        <!-- Fluxo de Aprovação Hierárquico -->
        <FluxoAprovacaoCard
          v-if="requisicao && ['Aguardando Coordenador', 'Aguardando Gerente', 'Em Análise', 'Aguardando Aprovação Final', 'Aceita', 'Concluída'].includes(requisicao.status)"
          :requisicao="requisicao"
          :perfil-usuario="profile?.perfis?.nome || ''"
          :usuario-id="meuFuncionario?.id || 0"
          @aprovar-coordenador="abrirModalAprovarCoordenador"
          @aprovar-gerente="abrirModalAprovarGerente"
          @aprovar-diretoria="abrirModalAprovarDiretoria"
          @reprovar="abrirModalReprovar"
        />

        <!-- Linha do Tempo -->
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Linha do Tempo</h3>
          </template>
          <TimelineRequisicao :items="historico" />
        </UCard>

        <!-- Auditoria -->
        <UCard v-if="podeVerAuditoria">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-shield-check" class="w-5 h-5" />
              <h3 class="text-lg font-semibold">Auditoria</h3>
            </div>
          </template>
          <AuditoriaLog :requisicao-id="requisicao.id" />
        </UCard>
      </div>
    </div>
  </div>

  <div v-else class="text-center py-12">
    <UIcon name="i-heroicons-exclamation-circle" class="w-12 h-12 text-red-500 mx-auto" />
    <p class="mt-4 text-lg">Requisição não encontrada</p>
  </div>

  <!-- Modais de Ações -->
  <UModal v-model="modalAceitarAberto">
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-check-circle" />
          <span class="font-semibold">Aceitar Requisição</span>
        </div>
      </template>
      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium">Prioridade</label>
          <USelectMenu v-model="aceitarForm.prioridade_final" :options="PRIORIDADES" />
        </div>
        <div>
          <label class="text-sm font-medium">Parecer/Resposta (opcional)</label>
          <UTextarea v-model="aceitarForm.parecer_resposta" :rows="3" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="gray" variant="ghost" @click="modalAceitarAberto = false">Cancelar</UButton>
          <UButton icon="i-heroicons-check" @click="confirmarAceitar">Confirmar</UButton>
        </div>
      </template>
    </UCard>
  </UModal>

  <UModal v-model="modalSolicitarInfoAberto">
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-question-mark-circle" />
          <span class="font-semibold">Solicitar Informação</span>
        </div>
      </template>
      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium">Parecer (obrigatório)</label>
          <UTextarea v-model="solicitarInfoForm.parecer_resposta" :rows="4" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="gray" variant="ghost" @click="modalSolicitarInfoAberto = false">Cancelar</UButton>
          <UButton color="amber" icon="i-heroicons-paper-airplane" @click="confirmarSolicitarInfo">Enviar</UButton>
        </div>
      </template>
    </UCard>
  </UModal>

  <UModal v-model="modalConcluirAberto">
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-check" />
          <span class="font-semibold">Concluir Requisição</span>
        </div>
      </template>
      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium">Detalhamento da Execução (obrigatório)</label>
          <UTextarea v-model="concluirForm.detalhamento_execucao" :rows="5" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="gray" variant="ghost" @click="modalConcluirAberto = false">Cancelar</UButton>
          <UButton color="green" icon="i-heroicons-check-circle" @click="confirmarConcluir">Concluir</UButton>
        </div>
      </template>
    </UCard>
  </UModal>

  <UModal v-model="modalCancelarAberto">
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-x-mark" />
          <span class="font-semibold">Cancelar Requisição</span>
        </div>
      </template>
      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium">Motivo do Cancelamento (obrigatório)</label>
          <UTextarea v-model="cancelarForm.motivo_cancelamento" :rows="4" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="gray" variant="ghost" @click="modalCancelarAberto = false">Voltar</UButton>
          <UButton color="red" variant="outline" icon="i-heroicons-x-mark" @click="confirmarCancelar">Cancelar Requisição</UButton>
        </div>
      </template>
    </UCard>
  </UModal>

  <UModal v-model="modalEnviarInfoAberto">
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-arrow-uturn-left" />
          <span class="font-semibold">Enviar Informações</span>
        </div>
      </template>
      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium">Resposta ao Setor (obrigatório)</label>
          <UTextarea v-model="enviarInfoForm.parecer_resposta" :rows="4" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="gray" variant="ghost" @click="modalEnviarInfoAberto = false">Cancelar</UButton>
          <UButton color="cyan" icon="i-heroicons-paper-airplane" @click="confirmarEnviarInformacoes">Enviar</UButton>
        </div>
      </template>
    </UCard>
  </UModal>

  <!-- Modal Reatribuir -->
  <UModal v-model="modalReatribuirAberto">
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-user-plus" />
          <span class="font-semibold">Reatribuir Responsável</span>
        </div>
      </template>
      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium">Novo Responsável ({{ requisicao?.setor_destino }})</label>
          <USelectMenu
            v-model="reatribuirForm.novo_responsavel_id"
            :options="opcoesResponsaveis"
            option-attribute="label"
            value-attribute="value"
            placeholder="Selecione o novo responsável"
            searchable
            :loading="carregandoResponsaveis"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Motivo (opcional, mas recomendado)</label>
          <UTextarea v-model="reatribuirForm.motivo" :rows="3" placeholder="Explique o motivo da reatribuição" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="gray" variant="ghost" @click="modalReatribuirAberto = false">Cancelar</UButton>
          <UButton :disabled="!reatribuirForm.novo_responsavel_id" :loading="salvandoReatribuicao" color="violet" icon="i-heroicons-arrow-path" @click="confirmarReatribuir">Reatribuir</UButton>
        </div>
      </template>
    </UCard>
  </UModal>

  <!-- Modais de Aprovação Hierárquica -->
  <ModaisAprovacaoRequisicao
    ref="modaisAprovacao"
    :requisicao-id="requisicao?.id || 0"
    :funcionario-id="meuFuncionario?.id || 0"
    @aprovacao-sucesso="carregarRequisicao"
  />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { STATUS_COLORS, PRIORIDADE_COLORS, SETOR_ICONS, PRIORIDADES } from '~/types/requisicoes';
import { useRequisicoesRealtime } from '~/composables/useRequisicoesRealtime';

definePageMeta({
  middleware: 'auth'
});

const route = useRoute();
const router = useRouter();
const supabase = useSupabaseClient();
const toast = useToast();
const user = useSupabaseUser();
const { profile } = useProfile();

const carregando = ref(true);
const requisicao = ref(null);
const anexos = ref([]);
const historico = ref([]);
const reatribuicoes = ref([]);

// Estado do usuário atual
const meuFuncionario = ref(null);

// Ref para o componente de modais de aprovação
const modaisAprovacao = ref(null);

// Modais de ação
const modalAceitarAberto = ref(false);
const modalSolicitarInfoAberto = ref(false);
const modalConcluirAberto = ref(false);
const modalCancelarAberto = ref(false);
const modalEnviarInfoAberto = ref(false);
const modalReatribuirAberto = ref(false);

// Form states
const aceitarForm = ref({ prioridade_final: null, parecer_resposta: '' });
const solicitarInfoForm = ref({ parecer_resposta: '' });
const concluirForm = ref({ detalhamento_execucao: '' });
const cancelarForm = ref({ motivo_cancelamento: '' });
const enviarInfoForm = ref({ parecer_resposta: '' });
const reatribuirForm = ref({ novo_responsavel_id: null, motivo: '' });
const opcoesResponsaveis = ref([]);
const carregandoResponsaveis = ref(false);
const salvandoReatribuicao = ref(false);

async function carregarRequisicao() {
  try {
    const { data, error } = await supabase
      .from('vw_requisicoes_completas')
      .select('*')
      .eq('id', route.params.id)
      .single();

    if (error) throw error;

    console.log('[Requisições] Dados carregados:', {
      id: data.id,
      status: data.status,
      parecer_resposta: data.parecer_resposta,
      detalhamento_execucao: data.detalhamento_execucao
    });

    requisicao.value = data;

    // Carrega anexos
    const { data: anexosData, error: anexosError } = await supabase
      .from('requisicoes_anexos')
      .select('*')
      .eq('requisicao_id', route.params.id);

    if (!anexosError) {
      anexos.value = anexosData || [];
    }

    // Carrega histórico
    const { data: hist, error: histErr } = await supabase
      .from('requisicoes_historico')
      .select('*')
      .eq('requisicao_id', route.params.id)
      .order('created_at', { ascending: false });

    if (!histErr) {
      historico.value = hist || [];
    }

    // Carrega reatribuições via view e mescla na timeline
    const { data: reatrs, error: rErr } = await supabase
      .from('vw_requisicoes_reatribuicoes')
      .select('id, requisicao_id, responsavel_anterior_id, responsavel_anterior_nome, novo_responsavel_id, novo_responsavel_nome, reatribuido_por_id, reatribuido_por_nome, motivo, created_at')
      .eq('requisicao_id', route.params.id)
      .order('created_at', { ascending: false });

    if (!rErr) {
      reatribuicoes.value = reatrs || [];
      const eventosReatr = (reatrs || []).map(r => ({
        id: `reat-${r.id}`,
        status_novo: 'Reatribuída',
        status_anterior: null,
        comentario: `Responsável alterado de ${r.responsavel_anterior_nome || '-'} para ${r.novo_responsavel_nome || '-'}${r.motivo ? `. Motivo: ${r.motivo}` : ''}`,
        created_at: r.created_at
      }));
      historico.value = [...historico.value, ...eventosReatr].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    }

  } catch (error) {
    console.error('[Detalhes Requisição] Erro:', error);
    toast.add({
      title: 'Erro ao carregar requisição',
      description: error.message,
      color: 'red'
    });
  } finally {
    carregando.value = false;
  }
}

function getStatusColor(status) {
  return STATUS_COLORS[status] || 'gray';
}

function getPrioridadeColor(prioridade) {
  return PRIORIDADE_COLORS[prioridade] || 'gray';
}

function getSetorIcon(setor) {
  return SETOR_ICONS[setor] || 'i-heroicons-building-office';
}

function formatarData(data) {
  if (!data) return '-';
  return format(new Date(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

function formatarTamanho(bytes) {
  if (!bytes) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getStatusIcon(status) {
  switch (status) {
    case 'Nova': return 'i-heroicons-sparkles';
    case 'Aguardando Coordenador': return 'i-heroicons-user';
    case 'Aguardando Gerente': return 'i-heroicons-user-group';
    case 'Aguardando Aprovação Final': return 'i-heroicons-shield-check';
    case 'Em Análise': return 'i-heroicons-eye';
    case 'Aceita': return 'i-heroicons-check-circle';
    case 'Necessita Informação': return 'i-heroicons-question-mark-circle';
    case 'Devolvida': return 'i-heroicons-arrow-uturn-left';
    case 'Concluída': return 'i-heroicons-check';
    case 'Cancelada': return 'i-heroicons-x-mark';
    default: return 'i-heroicons-information-circle';
  }
}

// Carrega o funcionário atual (para autorias e ações)
async function carregarMeuFuncionario() {
  try {
    if (!user?.value?.id) return;
    const { data, error } = await supabase
      .from('funcionarios')
      .select('id, nome_completo, perfil_id, perfis(nome)')
      .eq('user_id', user.value.id)
      .maybeSingle();
    if (error) throw error;
    meuFuncionario.value = data;
    console.log('[Requisições] Meu funcionário carregado:', data);
  } catch (err) {
    console.error('[Requisições] Falha ao carregar funcionário atual:', err);
  }
}

import { isMasterPerfil } from '~/composables/usePermissions';
// Ações - condições de exibição (UI; RLS faz a segurança)
const isMaster = computed(() => isMasterPerfil(profile.value?.perfis?.nome));
const isSectorMember = computed(() => {
  if (!profile.value?.perfis?.nome || !requisicao.value?.setor_destino) return false;
  const perfilNome = profile.value.perfis.nome;
  return perfilNome === requisicao.value.setor_destino || isMaster.value;
});
const isSolicitante = computed(() => !!(meuFuncionario.value?.id && requisicao.value?.solicitante_id && meuFuncionario.value.id === requisicao.value.solicitante_id));

// Permissão para ver auditoria: Master ou Solicitante
const podeVerAuditoria = computed(() => isMaster.value || isSolicitante.value);

const mostrarAcoes = computed(() => requisicao.value && !['Concluída', 'Cancelada'].includes(requisicao.value.status));
const podeAceitar = computed(() => requisicao.value && isSectorMember.value && requisicao.value.status === 'Em Análise');
const podeSolicitarInfo = computed(() => requisicao.value && isSectorMember.value && !['Concluída', 'Cancelada'].includes(requisicao.value.status));
const podeConcluir = computed(() => requisicao.value && isSectorMember.value && requisicao.value.status === 'Aceita');
const podeCancelar = computed(() => {
  if (!requisicao.value) return false;
  if (['Concluída', 'Cancelada'].includes(requisicao.value.status)) return false;
  const solicitantePode = isSolicitante.value && ['Nova','Em Análise','Necessita Informação','Devolvida'].includes(requisicao.value.status);
  return isSectorMember.value || solicitantePode;
});
const podeEnviarInformacoes = computed(() => requisicao.value && isSolicitante.value && requisicao.value.status === 'Necessita Informação');
const podeReatribuir = computed(() => requisicao.value && isSectorMember.value && !['Concluída','Cancelada'].includes(requisicao.value.status));

function abrirModalAceitar() {
  aceitarForm.value = {
    prioridade_final: requisicao.value.prioridade_final || requisicao.value.prioridade_sugerida,
    parecer_resposta: ''
  };
  modalAceitarAberto.value = true;
}
function abrirModalSolicitarInfo() {
  solicitarInfoForm.value = { parecer_resposta: '' };
  modalSolicitarInfoAberto.value = true;
}
function abrirModalConcluir() {
  concluirForm.value = { detalhamento_execucao: '' };
  modalConcluirAberto.value = true;
}
function abrirModalCancelar() {
  cancelarForm.value = { motivo_cancelamento: '' };
  modalCancelarAberto.value = true;
}
function abrirModalEnviarInfo() {
  enviarInfoForm.value = { parecer_resposta: '' };
  modalEnviarInfoAberto.value = true;
}

// Funções para abrir modais de aprovação hierárquica
function abrirModalAprovarCoordenador() {
  modaisAprovacao.value?.abrirModalAprovarCoordenador();
}

function abrirModalAprovarGerente() {
  modaisAprovacao.value?.abrirModalAprovarGerente();
}

function abrirModalAprovarDiretoria() {
  modaisAprovacao.value?.abrirModalAprovarDiretoria();
}

function abrirModalReprovar() {
  modaisAprovacao.value?.abrirModalReprovar();
}

async function carregarResponsaveisDoSetor() {
  if (!requisicao.value?.setor_destino) return;
  try {
    carregandoResponsaveis.value = true;
    // Busca perfil do setor
    const { data: perfis } = await supabase
      .from('perfis')
      .select('id')
      .eq('nome', requisicao.value.setor_destino)
      .limit(1);
    const perfilId = perfis?.[0]?.id;
    if (!perfilId) {
      opcoesResponsaveis.value = [];
      return;
    }
    const { data: funcs } = await supabase
      .from('funcionarios')
      .select('id, nome_completo')
      .eq('perfil_id', perfilId)
      .order('nome_completo');
    opcoesResponsaveis.value = (funcs || [])
      .filter(f => f.id !== requisicao.value.responsavel_id)
      .map(f => ({ value: f.id, label: f.nome_completo }));
  } finally {
    carregandoResponsaveis.value = false;
  }
}

function abrirModalReatribuir() {
  reatribuirForm.value = { novo_responsavel_id: null, motivo: '' };
  modalReatribuirAberto.value = true;
  carregarResponsaveisDoSetor();
}

async function confirmarReatribuir() {
  try {
    salvandoReatribuicao.value = true;
    await supabase.rpc('reatribuir_requisicao', {
      p_requisicao_id: Number(route.params.id),
      p_novo_responsavel_id: Number(reatribuirForm.value.novo_responsavel_id),
      p_motivo: reatribuirForm.value.motivo || null
    });
    toast.add({ title: 'Responsável reatribuído', color: 'violet' });
    modalReatribuirAberto.value = false;
    await carregarRequisicao();
  } catch (err) {
    console.error('[Requisições] Reatribuir erro:', err);
    toast.add({ title: 'Falha ao reatribuir', description: err.message, color: 'red' });
  } finally {
    salvandoReatribuicao.value = false;
  }
}

async function obterSlaSugerido(categoria, prioridade) {
  const { data, error } = await supabase.rpc('obter_sla_sugerido', {
    p_categoria: categoria,
    p_prioridade: prioridade
  });
  if (error) throw error;
  return data;
}

async function atualizarRequisicao(update) {
  console.log('[Requisições] Atualizando com:', update);
  const { error } = await supabase
    .from('requisicoes')
    .update(update)
    .eq('id', route.params.id);
  if (error) throw error;
}

async function confirmarAceitar() {
  try {
    // Garante que temos o funcionário carregado
    if (!meuFuncionario.value?.id) {
      await carregarMeuFuncionario();
    }
    
    // Valida se conseguimos o ID do funcionário
    if (!meuFuncionario.value?.id) {
      throw new Error('Não foi possível identificar seu funcionário. Verifique se você possui cadastro ativo.');
    }
    
    const prioridade = aceitarForm.value.prioridade_final || requisicao.value.prioridade_sugerida;
    const prazo_final = await obterSlaSugerido(requisicao.value.categoria, prioridade);
    
    const parecer = aceitarForm.value.parecer_resposta?.trim();

    console.log('[Requisições] Aceitando (setor) com responsavel_id:', meuFuncionario.value.id);
    console.log('[Requisições] Parecer/Resposta:', parecer);

    const { data, error } = await supabase.rpc('aceitar_requisicao_setor', {
      p_requisicao_id: Number(route.params.id),
      p_responsavel_id: Number(meuFuncionario.value.id),
      p_prazo_final: prazo_final,
      p_prioridade_final: prioridade,
      p_parecer_resposta: parecer || null
    });
    if (error) throw error;
    const result = data || { success: true };
    if (result.success === false) {
      throw new Error(result.error || 'Falha ao aceitar requisição');
    }

    toast.add({ title: 'Requisição aceita e enviada para Aprovação Final', color: 'green' });
    modalAceitarAberto.value = false;
    await carregarRequisicao();
  } catch (err) {
    console.error('[Requisições] Aceitar erro:', err);
    toast.add({ title: 'Falha ao aceitar', description: err.message, color: 'red' });
  }
}

async function confirmarSolicitarInfo() {
  try {
    const parecer = solicitarInfoForm.value.parecer_resposta?.trim();
    console.log('[Requisições] Solicitando info com parecer:', parecer);

    // Garante que temos o funcionário carregado
    if (!meuFuncionario.value?.id) {
      await carregarMeuFuncionario();
    }

    if (!meuFuncionario.value?.id) {
      throw new Error('Não foi possível identificar seu funcionário. Verifique se você possui cadastro ativo.');
    }

    // Chama RPC server-side (SECURITY DEFINER) para contornar RLS/permissões do cliente
    const { data, error } = await supabase.rpc('solicitar_informacao_requisicao', {
      p_requisicao_id: Number(route.params.id),
      p_autor_id: Number(meuFuncionario.value.id),
      p_parecer: parecer || null
    });

    if (error) throw error;
    const result = data || { success: true };
    if (result.success === false) {
      throw new Error(result.error || 'Falha ao solicitar informação');
    }

    toast.add({ title: 'Solicitação enviada ao solicitante', color: 'amber' });
    modalSolicitarInfoAberto.value = false;
    await carregarRequisicao();
  } catch (err) {
    console.error('[Requisições] Solicitar info erro:', err);
    toast.add({ title: 'Falha ao solicitar informação', description: err.message, color: 'red' });
  }
}

async function confirmarConcluir() {
  try {
    const detalhamento = concluirForm.value.detalhamento_execucao?.trim();
    console.log('[Requisições] Concluindo com detalhamento:', detalhamento);
    
    if (!detalhamento) {
      throw new Error('O detalhamento da execução é obrigatório para concluir a requisição');
    }
    
    await atualizarRequisicao({
      status: 'Concluída',
      detalhamento_execucao: detalhamento
    });
    toast.add({ title: 'Requisição concluída', color: 'green' });
    modalConcluirAberto.value = false;
    await carregarRequisicao();
  } catch (err) {
    console.error('[Requisições] Concluir erro:', err);
    toast.add({ title: 'Falha ao concluir', description: err.message, color: 'red' });
  }
}

async function confirmarCancelar() {
  try {
    await atualizarRequisicao({
      status: 'Cancelada',
      motivo_cancelamento: cancelarForm.value.motivo_cancelamento
    });
    toast.add({ title: 'Requisição cancelada', color: 'red' });
    modalCancelarAberto.value = false;
    await carregarRequisicao();
  } catch (err) {
    console.error('[Requisições] Cancelar erro:', err);
    toast.add({ title: 'Falha ao cancelar', description: err.message, color: 'red' });
  }
}

async function confirmarEnviarInformacoes() {
  try {
    const parecer = enviarInfoForm.value.parecer_resposta?.trim();
    console.log('[Requisições] Enviando informações com parecer:', parecer);
    
    await atualizarRequisicao({
      status: 'Devolvida',
      parecer_resposta: parecer || null
    });
    toast.add({ title: 'Informações enviadas ao setor', color: 'cyan' });
    modalEnviarInfoAberto.value = false;
    await carregarRequisicao();
  } catch (err) {
    console.error('[Requisições] Enviar informações erro:', err);
    toast.add({ title: 'Falha ao enviar informações', description: err.message, color: 'red' });
  }
}

onMounted(() => {
  carregarRequisicao();
  carregarMeuFuncionario();
  // Realtime para esta requisição
  const { subscribe } = useRequisicoesRealtime();
  const unsubscribe = subscribe(async (payload) => {
    try {
      const table = payload.table || payload?.ids?.table;
      if (table === 'requisicoes' && payload.new?.id == route.params.id) {
        await carregarRequisicao();
        if (payload.old?.status !== payload.new.status) {
          toast.add({ title: `Status atualizado para ${payload.new.status}`, color: 'blue' });
        }
      }
    } catch {}
  });
  onUnmounted(() => unsubscribe && unsubscribe());
});
</script>

