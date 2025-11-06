<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <UButton
        icon="i-heroicons-arrow-left"
        color="gray"
        variant="ghost"
        @click="router.back()"
      />
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Nova Requisição
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          Preencha os campos abaixo para criar uma nova requisição
        </p>
      </div>
    </div>

    <!-- Debug (remover depois) -->
    <UAlert v-if="salvando || carregandoFuncionariosSetor" color="orange" variant="soft" class="mb-4">
      Estado: salvando={{ salvando }}, carregandoSetor={{ carregandoFuncionariosSetor }}
      <UButton size="xs" @click="salvando = false; carregandoFuncionariosSetor = false">Resetar</UButton>
    </UAlert>

    <!-- Formulário -->
    <form @submit.prevent="salvarRequisicao">
      <UCard>
        <div class="space-y-6">
          <!-- Título -->
          <UFormGroup label="Título da Requisição" required>
            <UInput
              v-model="formData.titulo"
              placeholder="Ex: Solicitar Material de Escritório"
              :disabled="salvando"
            />
          </UFormGroup>

          <!-- Setor Destino e Destinatário -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormGroup label="Setor Destino" required>
              <USelectMenu
                v-model="formData.setor_destino"
                :options="setoresOptions"
                placeholder="Selecione o setor"
                :disabled="salvando"
                @change="onSetorChange"
              >
                <template #label="{ selected }">
                  <div class="flex items-center gap-2">
                    <UIcon v-if="selected?.icon" :name="selected.icon" />
                    <span v-if="selected">{{ selected.label }}</span>
                    <span v-else class="text-gray-400">Selecione o setor</span>
                  </div>
                </template>
              </USelectMenu>
            </UFormGroup>

            <!-- Destinatário específico (TODOS os setores) -->
            <UFormGroup 
              v-if="setorSelecionado" 
              :label="`Responsável no ${setorSelecionado}`" 
              required
            >
              <USelectMenu
                v-model="formData.destinatario_id"
                :options="funcionariosSetorOptions"
                placeholder="Selecione o responsável"
                :disabled="salvando || carregandoFuncionariosSetor"
                :loading="carregandoFuncionariosSetor"
              >
                <template #label="{ selected }">
                  <span>{{ selected?.label || 'Selecione o responsável' }}</span>
                </template>
              </USelectMenu>
            </UFormGroup>
          </div>

          <!-- Categoria e Prioridade -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormGroup label="Categoria" required>
              <USelectMenu
                v-model="formData.categoria"
                :options="categoriasOptions"
                placeholder="Selecione a categoria"
                :disabled="salvando"
              >
                <template #label="{ selected }">
                  <span>{{ selected?.label || 'Selecione a categoria' }}</span>
                </template>
              </USelectMenu>
            </UFormGroup>

            <UFormGroup label="Prioridade Sugerida" required>
              <USelectMenu
                v-model="formData.prioridade_sugerida"
                :options="prioridadesOptions"
                placeholder="Selecione a prioridade"
                :disabled="salvando"
              >
                <template #label="{ selected }">
                  <UBadge v-if="selected" :color="getPrioridadeColor(selected.value)" variant="solid">
                    {{ selected.label }}
                  </UBadge>
                  <span v-else class="text-gray-400">Selecione a prioridade</span>
                </template>
              </USelectMenu>
            </UFormGroup>
          </div>

          <!-- Descrição -->
          <UFormGroup label="Descrição Detalhada" required>
            <UTextarea
              v-model="formData.descricao"
              :rows="6"
              placeholder="Descreva sua solicitação de forma detalhada. Inclua o motivo, a urgência e o que é esperado como solução..."
              :disabled="salvando"
            />
            <template #hint>
              <span class="text-sm text-gray-500">
                Seja o mais específico possível para agilizar o atendimento
              </span>
            </template>
          </UFormGroup>

          <!-- Anexos -->
          <UFormGroup label="Anexos" hint="Notas fiscais, orçamentos, fotos ou documentos">
            <div class="space-y-3">
              <!-- Input de arquivo -->
              <input
                ref="fileInput"
                type="file"
                multiple
                class="hidden"
                @change="onFilesSelected"
              />
              
              <UButton
                icon="i-heroicons-paper-clip"
                color="gray"
                variant="ghost"
                :disabled="salvando"
                @click="$refs.fileInput.click()"
              >
                Adicionar Arquivos
              </UButton>

              <!-- Lista de arquivos selecionados -->
              <div v-if="arquivosSelecionados.length > 0" class="space-y-2">
                <div
                  v-for="(arquivo, index) in arquivosSelecionados"
                  :key="index"
                  class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div class="flex items-center gap-3">
                    <UIcon name="i-heroicons-document" class="w-5 h-5 text-gray-400" />
                    <div>
                      <p class="text-sm font-medium">{{ arquivo.name }}</p>
                      <p class="text-xs text-gray-500">{{ formatarTamanho(arquivo.size) }}</p>
                    </div>
                  </div>
                  <UButton
                    icon="i-heroicons-x-mark"
                    size="xs"
                    color="red"
                    variant="ghost"
                    @click="removerArquivo(index)"
                  />
                </div>
              </div>
            </div>
          </UFormGroup>

          <!-- Informações Adicionais -->
          <UAlert
            icon="i-heroicons-information-circle"
            color="blue"
            variant="soft"
            title="Informações Importantes"
          >
            <template #description>
              <ul class="list-disc list-inside space-y-1 text-sm">
                <li>Sua requisição será enviada para o setor selecionado</li>
                <li>Você receberá notificações sobre o andamento</li>
                <li>O prazo de atendimento (SLA) será definido pelo setor responsável</li>
              </ul>
            </template>
          </UAlert>
        </div>

        <!-- Ações -->
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              color="gray"
              variant="ghost"
              :disabled="salvando"
              @click="router.back()"
            >
              Cancelar
            </UButton>
            <UButton
              type="submit"
              icon="i-heroicons-paper-airplane"
              :loading="salvando"
              :disabled="!formularioValido"
            >
              Enviar Requisição
            </UButton>
          </div>
        </template>
      </UCard>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { 
  SETORES_DESTINO,
  CATEGORIAS_REQUISICAO,
  PRIORIDADES,
  SETOR_ICONS,
  PRIORIDADE_COLORS
} from '~/types/requisicoes';

definePageMeta({
  middleware: 'auth'
});

const supabase = useSupabaseClient();
const toast = useToast();
const router = useRouter();
const { profile } = useProfile();

// --- ESTADO ---
const salvando = ref(false);
const carregandoFuncionariosSetor = ref(false);
const funcionariosSetor = ref([]);
const arquivosSelecionados = ref([]);

const formData = ref({
  titulo: '',
  setor_destino: null,
  destinatario_id: null,
  categoria: null,
  descricao: '',
  prioridade_sugerida: null
});

// --- OPTIONS ---
// Alguns componentes do Nuxt UI tentam renderizar um ícone do option.icon automaticamente.
// Para evitar warnings de ícone nulo, garantimos sempre um ícone string válido.
const setoresOptions = SETORES_DESTINO.map(s => ({ 
  label: s, 
  value: s,
  icon: SETOR_ICONS[s] || 'i-heroicons-building-office'
}));

const categoriasOptions = CATEGORIAS_REQUISICAO.map(c => ({ 
  label: c, 
  value: c,
  icon: 'i-heroicons-tag'
}));

const prioridadeToIcon = (p) => ({
  'Baixa': 'i-heroicons-arrow-down',
  'Média': 'i-heroicons-adjustments-horizontal',
  'Alta': 'i-heroicons-arrow-up',
  'Crítica': 'i-heroicons-exclamation-triangle'
})[p] || 'i-heroicons-bolt';

const prioridadesOptions = PRIORIDADES.map(p => ({ 
  label: p, 
  value: p,
  icon: prioridadeToIcon(p)
}));

const funcionariosSetorOptions = computed(() => 
  funcionariosSetor.value.map(f => ({
    label: f.nome_completo,
    value: f.id,
    icon: 'i-heroicons-user'
  }))
);

// Computed para obter valor do setor selecionado
const setorSelecionado = computed(() => {
  if (!formData.value.setor_destino) return null;
  return typeof formData.value.setor_destino === 'object' 
    ? formData.value.setor_destino?.value 
    : formData.value.setor_destino;
});

// --- VALIDAÇÃO ---
const formularioValido = computed(() => {
  // Helper para verificar se campo tem valor
  const temValor = (campo) => {
    if (!campo) return false;
    if (typeof campo === 'object') return !!campo.value;
    return !!campo;
  };

  const tituloValido = !!(formData.value.titulo?.trim());
  const setorValido = temValor(formData.value.setor_destino);
  const categoriaValida = temValor(formData.value.categoria);
  const descricaoValida = !!(formData.value.descricao?.trim() && formData.value.descricao.trim().length >= 10);
  const prioridadeValida = temValor(formData.value.prioridade_sugerida);

  const baseValido = tituloValido && setorValido && categoriaValida && descricaoValida && prioridadeValida;

  // Se setor está selecionado, destinatario_id é SEMPRE obrigatório
  const setorValue = typeof formData.value.setor_destino === 'object' 
    ? formData.value.setor_destino?.value 
    : formData.value.setor_destino;
    
  if (setorValue) {
    return baseValido && temValor(formData.value.destinatario_id);
  }

  return baseValido;
});

// --- FUNÇÕES ---
// Mapeia setores de destino para setores de trabalho dos funcionários
function mapearSetorTrabalho(setorDestino) {
  const mapeamento = {
    'Operacional': 'Administrativo',
    'Marketing': 'Administrativo',
    'Endomarketing': 'Administrativo',
    'Backoffice': 'Backoffice',
    // Demais setores mantêm o mesmo nome
    'Administrativo': 'Administrativo',
    'Financeiro': 'Financeiro',
    'RH': 'RH',
    'TI': 'TI'
  };
  
  return mapeamento[setorDestino] || setorDestino;
}

async function carregarFuncionariosSetor(setor) {
  if (!setor) return;
  
  carregandoFuncionariosSetor.value = true;
  try {
    // Mapeia o setor de destino para o setor de trabalho dos funcionários
    const setorTrabalho = mapearSetorTrabalho(setor);
    
    // Busca funcionários do setor usando a view
    const { data, error } = await supabase
      .from('vw_funcionarios_por_setor')
      .select('id, nome_completo, perfil_nome')
      .eq('setor', setorTrabalho)
      .order('nome_completo');

    if (error) throw error;

    funcionariosSetor.value = data || [];
    
    console.log(`[Nova Requisição] Setor destino: ${setor} → Setor trabalho: ${setorTrabalho} → Funcionários:`, data);
  } catch (error) {
    console.error('[Nova Requisição] Erro ao carregar funcionários do setor:', error);
    toast.add({
      title: `Erro ao carregar funcionários do ${setor}`,
      description: error.message,
      color: 'red'
    });
  } finally {
    carregandoFuncionariosSetor.value = false;
  }
}

function onSetorChange() {
  // Limpa destinatário ao mudar setor
  formData.value.destinatario_id = null;
  funcionariosSetor.value = [];

  // Carrega funcionários do setor selecionado
  const setorValue = typeof formData.value.setor_destino === 'object' 
    ? formData.value.setor_destino?.value 
    : formData.value.setor_destino;
    
  if (setorValue) {
    carregarFuncionariosSetor(setorValue);
  }
}

function onFilesSelected(event) {
  const files = Array.from(event.target.files);
  arquivosSelecionados.value.push(...files);
}

function removerArquivo(index) {
  arquivosSelecionados.value.splice(index, 1);
}

async function uploadArquivos(requisicaoId) {
  if (arquivosSelecionados.value.length === 0) return;

  const uploads = arquivosSelecionados.value.map(async (file) => {
    const fileName = `${requisicaoId}/${Date.now()}_${file.name}`;
    
    // Upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('requisicoes-anexos')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Pega URL pública
    const { data: urlData } = supabase.storage
      .from('requisicoes-anexos')
      .getPublicUrl(fileName);

    // Insere registro na tabela
    const { error: insertError } = await supabase
      .from('requisicoes_anexos')
      .insert({
        requisicao_id: requisicaoId,
        nome_arquivo: file.name,
        url_arquivo: urlData.publicUrl,
        tamanho_bytes: file.size,
        tipo_mime: file.type,
        uploaded_by: profile.value.id
      });

    if (insertError) throw insertError;
  });

  await Promise.all(uploads);
}

async function salvarRequisicao() {
  salvando.value = true;
  try {
    // Extrai valores (USelectMenu pode retornar objeto ou string)
    const getValor = (campo) => {
      if (!campo) return null;
      return typeof campo === 'object' ? campo.value : campo;
    };

    // Verifica se tem loja vinculada
    if (!profile.value.loja_id) {
      toast.add({
        title: 'Atenção',
        description: 'Seu usuário não está vinculado a uma loja. Entre em contato com o administrador.',
        color: 'orange',
        timeout: 5000
      });
      return;
    }

    // Insere requisição
    const { data: requisicao, error: reqError } = await supabase
      .from('requisicoes')
      .insert({
        titulo: formData.value.titulo,
        solicitante_id: profile.value.id,
        loja_id: profile.value.loja_id,
        regional_id: profile.value.regional_id,
        setor_destino: getValor(formData.value.setor_destino),
        destinatario_id: getValor(formData.value.destinatario_id),
        categoria: getValor(formData.value.categoria),
        descricao: formData.value.descricao,
        prioridade_sugerida: getValor(formData.value.prioridade_sugerida)
      })
      .select()
      .single();

    if (reqError) throw reqError;

    // Upload de anexos
    if (arquivosSelecionados.value.length > 0) {
      await uploadArquivos(requisicao.id);
    }

    toast.add({
      title: 'Requisição criada com sucesso!',
      description: `Número: ${requisicao.numero_requisicao}`,
      color: 'green'
    });

    router.push(`/requisicoes/${requisicao.id}`);

  } catch (error) {
    console.error('[Nova Requisição] Erro ao salvar:', error);
    toast.add({
      title: 'Erro ao criar requisição',
      description: error.message,
      color: 'red'
    });
  } finally {
    salvando.value = false;
  }
}

// --- HELPERS ---
function getSetorIcon(setor) {
  return SETOR_ICONS[setor] || 'i-heroicons-building-office';
}

function getPrioridadeColor(prioridade) {
  return PRIORIDADE_COLORS[prioridade] || 'gray';
}

function formatarTamanho(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// --- LIFECYCLE ---
onMounted(() => {
  // Verifica se perfil está carregado
  if (!profile.value) {
    toast.add({
      title: 'Erro',
      description: 'Perfil não encontrado',
      color: 'red'
    });
    router.push('/');
  }
});
</script>
