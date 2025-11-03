<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">Histórico de Ações</h3>
      <UButton icon="i-heroicons-arrow-path" size="xs" color="gray" @click="carregarLogs" :loading="carregando">
        Atualizar
      </UButton>
    </div>

    <UCard v-if="carregando" class="p-8">
      <div class="flex items-center justify-center">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-primary-500" />
        <span class="ml-2 text-gray-500">Carregando logs...</span>
      </div>
    </UCard>

    <div v-else-if="logs.length === 0" class="text-center py-8">
      <UIcon name="i-heroicons-document-text" class="w-12 h-12 mx-auto text-gray-400 mb-2" />
      <p class="text-gray-500">Nenhuma ação registrada ainda</p>
    </div>

    <div v-else class="space-y-2">
      <div v-for="log in logs" :key="log.id" class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
        <div class="flex items-start justify-between gap-4">
          <!-- Ícone e Ação -->
          <div class="flex items-start gap-3 flex-1">
            <div class="mt-1">
              <UIcon :name="getAcaoInfo(log.acao).icon" class="w-5 h-5" :class="`text-${getAcaoInfo(log.acao).color}-600`" />
            </div>
            <div class="flex-1 min-w-0">
              <!-- Header: usuário e ação -->
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-semibold">{{ log.usuario?.nome_completo || 'Usuário Desconhecido' }}</span>
                <UBadge :color="getAcaoInfo(log.acao).color" size="xs" variant="subtle">
                  {{ getAcaoInfo(log.acao).label }}
                </UBadge>
                <span class="text-xs text-gray-500">{{ log.usuario?.perfil }}</span>
              </div>
              
              <!-- Data e hora -->
              <div class="text-xs text-gray-500 mt-1">
                {{ formatarData(log.created_at) }}
              </div>

              <!-- IP e User Agent (se disponível) -->
              <div v-if="log.ip_address || log.user_agent" class="text-xs text-gray-400 mt-1 flex items-center gap-3">
                <span v-if="log.ip_address" class="flex items-center gap-1">
                  <UIcon name="i-heroicons-globe-alt" class="w-3 h-3" />
                  {{ log.ip_address }}
                </span>
                <span v-if="log.user_agent" class="flex items-center gap-1 truncate max-w-md">
                  <UIcon name="i-heroicons-device-phone-mobile" class="w-3 h-3" />
                  {{ truncarUserAgent(log.user_agent) }}
                </span>
              </div>

              <!-- Detalhes (expandível) -->
              <div v-if="log.detalhes && Object.keys(log.detalhes).length > 0" class="mt-2">
                <UButton 
                  size="xs" 
                  variant="ghost" 
                  color="gray"
                  @click="toggleDetalhes(log.id)"
                  :icon="detalhesExpandidos.has(log.id) ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                >
                  {{ detalhesExpandidos.has(log.id) ? 'Ocultar' : 'Ver' }} Detalhes
                </UButton>
                
                <div v-if="detalhesExpandidos.has(log.id)" class="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto max-h-64">
                  <!-- Formatação amigável para alterações tipo { de: 'X', para: 'Y', campo: 'status' } -->
                  <div v-if="isChangeObject(log.detalhes)" class="flex items-center gap-3 text-sm font-medium">
                    <span class="font-mono text-sm text-gray-600">{{ humanizeFieldName(log.detalhes.campo) }}</span>
                    <span class="text-sm text-gray-500">{{ log.detalhes.de }}</span>
                    <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 text-gray-400" />
                    <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">{{ log.detalhes.para }}</span>
                  </div>

                  <!-- Lista de pares chave:valor para objetos simples -->
                  <div v-else-if="isPlainObject(log.detalhes)" class="text-sm space-y-1">
                    <div v-for="(v, k) in log.detalhes" :key="k" class="flex items-start gap-2">
                      <span class="font-mono text-xs text-gray-500 w-32">{{ humanizeFieldName(k) }}:</span>
                      <span class="break-words">{{ formatValue(v) }}</span>
                    </div>
                  </div>

                  <!-- Fallback: raw JSON -->
                  <div v-else class="text-xs font-mono whitespace-pre-wrap">
                    <pre class="whitespace-pre-wrap">{{ JSON.stringify(log.detalhes, null, 2) }}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ACOES_AUDITORIA } from '~/types/requisicoes'

const props = defineProps({
  requisicaoId: {
    type: String,
    required: true
  }
})

const supabase = useSupabaseClient()
const toast = useToast()

const carregando = ref(false)
const logs = ref([])
const detalhesExpandidos = ref(new Set())

function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

function isChangeObject(v) {
  return isPlainObject(v) && (('de' in v && 'para' in v) || ('from' in v && 'to' in v));
}

function humanizeFieldName(field) {
  if (!field) return '';
  // mapeamentos simples para campos comuns
  const map = {
    status: 'Status',
    responsavel_id: 'Responsável',
    solicitante_id: 'Solicitante',
    prazo_final: 'Prazo Final',
    titulo: 'Título',
    descricao: 'Descrição',
    departamento: 'Setor'
  };
  return map[field] || String(field).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatValue(v) {
  if (v === null || v === undefined) return '-';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function getAcaoInfo(acao) {
  return ACOES_AUDITORIA[acao] || { label: acao, icon: 'i-heroicons-document', color: 'gray' }
}

function formatarData(data) {
  return data ? format(new Date(data), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR }) : '-'
}

function truncarUserAgent(ua) {
  if (!ua) return ''
  // Extrai navegador e SO de forma simplificada
  const match = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/)
  return match ? match[0] : ua.substring(0, 50) + '...'
}

function toggleDetalhes(logId) {
  if (detalhesExpandidos.value.has(logId)) {
    detalhesExpandidos.value.delete(logId)
  } else {
    detalhesExpandidos.value.add(logId)
  }
}

async function carregarLogs() {
  carregando.value = true
  try {
    const { data, error } = await supabase
      .from('auditoria')
      .select(`
        *,
        usuario:funcionarios!auditoria_autor_id_fkey(nome_completo, email, perfis(nome))
      `)
      .eq('entidade', 'requisicao')
      .eq('entidade_id', props.requisicaoId)
      .order('created_at', { ascending: false })

    if (error) throw error

    logs.value = (data || []).map(log => ({
      ...log,
      usuario: log.usuario ? {
        nome_completo: log.usuario.nome_completo,
        email: log.usuario.email,
        perfil: log.usuario.perfis?.nome || 'N/A'
      } : null
    }))
  } catch (err) {
    console.error('[AuditoriaLog] Erro ao carregar:', err)
    toast.add({ title: 'Erro ao carregar logs de auditoria', description: err.message, color: 'red' })
  } finally {
    carregando.value = false
  }
}

onMounted(() => {
  carregarLogs()
})
</script>
