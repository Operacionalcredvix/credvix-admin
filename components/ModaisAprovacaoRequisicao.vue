<template>
  <!-- Modal Aprovar Coordenador -->
  <UModal v-model="isOpenAprovarCoordenador">
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Aprovar como Coordenador</h3>
      </template>
      
      <UForm :state="formAprovarCoordenador" @submit="confirmarAprovacaoCoordenador" class="space-y-4">
        <UFormGroup label="Parecer (opcional)" name="parecer">
          <UTextarea 
            v-model="formAprovarCoordenador.parecer" 
            placeholder="Adicione observações sobre a aprovação..."
            :rows="4"
          />
        </UFormGroup>

        <div class="flex justify-end gap-3 mt-6">
          <UButton color="gray" variant="ghost" @click="isOpenAprovarCoordenador = false">
            Cancelar
          </UButton>
          <UButton type="submit" color="primary" :loading="processando">
            Aprovar
          </UButton>
        </div>
      </UForm>
    </UCard>
  </UModal>

  <!-- Modal Aprovar Gerente -->
  <UModal v-model="isOpenAprovarGerente">
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Aprovar como Gerente</h3>
      </template>
      
      <UForm :state="formAprovarGerente" @submit="confirmarAprovacaoGerente" class="space-y-4">
        <UFormGroup label="Parecer (opcional)" name="parecer">
          <UTextarea 
            v-model="formAprovarGerente.parecer" 
            placeholder="Adicione observações sobre a aprovação..."
            :rows="4"
          />
        </UFormGroup>

        <div class="flex justify-end gap-3 mt-6">
          <UButton color="gray" variant="ghost" @click="isOpenAprovarGerente = false">
            Cancelar
          </UButton>
          <UButton type="submit" color="primary" :loading="processando">
            Aprovar
          </UButton>
        </div>
      </UForm>
    </UCard>
  </UModal>

  <!-- Modal Aprovar Diretoria -->
  <UModal v-model="isOpenAprovarDiretoria">
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Aprovar como Diretoria</h3>
      </template>
      
      <UForm :state="formAprovarDiretoria" @submit="confirmarAprovacaoDiretoria" class="space-y-4">
        <UFormGroup label="Parecer (opcional)" name="parecer">
          <UTextarea 
            v-model="formAprovarDiretoria.parecer" 
            placeholder="Adicione observações sobre a aprovação..."
            :rows="4"
          />
        </UFormGroup>

        <div class="flex justify-end gap-3 mt-6">
          <UButton color="gray" variant="ghost" @click="isOpenAprovarDiretoria = false">
            Cancelar
          </UButton>
          <UButton type="submit" color="primary" :loading="processando">
            Aprovar e Enviar ao Setor
          </UButton>
        </div>
      </UForm>
    </UCard>
  </UModal>

  <!-- Modal Reprovar -->
  <UModal v-model="isOpenReprovar">
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold text-red-600">Reprovar Requisição</h3>
      </template>
      
      <UForm :state="formReprovar" @submit="confirmarReprovacao" class="space-y-4">
        <UFormGroup label="Motivo da Reprovação (opcional)" name="motivo">
          <UTextarea 
            v-model="formReprovar.motivo" 
            placeholder="Descreva o motivo da reprovação (opcional)..."
            :rows="5"
          />
        </UFormGroup>

        <UAlert 
          icon="i-heroicons-exclamation-triangle"
          color="red"
          variant="subtle"
          title="Atenção"
          description="Esta ação não pode ser desfeita. A requisição será marcada como reprovada."
        />

        <div class="flex justify-end gap-3 mt-6">
          <UButton color="gray" variant="ghost" @click="isOpenReprovar = false">
            Cancelar
          </UButton>
          <UButton type="submit" color="red" :loading="processando">
            Reprovar
          </UButton>
        </div>
      </UForm>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  requisicaoId: number;
  funcionarioId: number;
}>();

const emit = defineEmits<{
  'aprovacao-sucesso': [];
  'reprovacao-sucesso': [];
}>();

// @ts-ignore - Nuxt auto-imports
const supabase = useSupabaseClient();
// @ts-ignore - Nuxt auto-imports
const toast = useToast();

// Estados dos modais
const isOpenAprovarCoordenador = ref(false);
const isOpenAprovarGerente = ref(false);
const isOpenAprovarDiretoria = ref(false);
const isOpenReprovar = ref(false);
const processando = ref(false);

// Formulários
const formAprovarCoordenador = ref({ parecer: '' });
const formAprovarGerente = ref({ parecer: '' });
const formAprovarDiretoria = ref({ parecer: '' });
const formReprovar = ref({ motivo: '' });

// Métodos públicos para abrir modais
function abrirModalAprovarCoordenador() {
  formAprovarCoordenador.value = { parecer: '' };
  isOpenAprovarCoordenador.value = true;
}

function abrirModalAprovarGerente() {
  formAprovarGerente.value = { parecer: '' };
  isOpenAprovarGerente.value = true;
}

function abrirModalAprovarDiretoria() {
  formAprovarDiretoria.value = { parecer: '' };
  isOpenAprovarDiretoria.value = true;
}

function abrirModalReprovar() {
  formReprovar.value = { motivo: '' };
  isOpenReprovar.value = true;
}

// Funções de aprovação
async function confirmarAprovacaoCoordenador() {
  processando.value = true;
  try {
    const { data, error } = await supabase.rpc('aprovar_coordenador', {
      p_requisicao_id: props.requisicaoId,
      p_coordenador_id: props.funcionarioId,
      p_parecer: formAprovarCoordenador.value.parecer || null
    });

    if (error) throw error;

    const result = data as { success: boolean; error?: string; message?: string };
    
    if (!result.success) {
      throw new Error(result.error || 'Erro ao aprovar requisição');
    }

    toast.add({
      title: 'Sucesso',
      description: 'Requisição aprovada pelo coordenador',
      color: 'green'
    });

    isOpenAprovarCoordenador.value = false;
    emit('aprovacao-sucesso');
  } catch (err: any) {
    toast.add({
      title: 'Erro',
      description: err.message || 'Não foi possível aprovar a requisição',
      color: 'red'
    });
  } finally {
    processando.value = false;
  }
}

async function confirmarAprovacaoGerente() {
  processando.value = true;
  try {
    const { data, error } = await supabase.rpc('aprovar_gerente', {
      p_requisicao_id: props.requisicaoId,
      p_gerente_id: props.funcionarioId,
      p_parecer: formAprovarGerente.value.parecer || null
    });

    if (error) throw error;

    const result = data as { success: boolean; error?: string; message?: string };
    
    if (!result.success) {
      throw new Error(result.error || 'Erro ao aprovar requisição');
    }

    toast.add({
      title: 'Sucesso',
      description: 'Requisição aprovada pelo gerente',
      color: 'green'
    });

    isOpenAprovarGerente.value = false;
    emit('aprovacao-sucesso');
  } catch (err: any) {
    toast.add({
      title: 'Erro',
      description: err.message || 'Não foi possível aprovar a requisição',
      color: 'red'
    });
  } finally {
    processando.value = false;
  }
}

async function confirmarAprovacaoDiretoria() {
  processando.value = true;
  try {
    const { data, error } = await supabase.rpc('aprovar_diretoria', {
      p_requisicao_id: props.requisicaoId,
      p_diretor_id: props.funcionarioId,
      p_parecer: formAprovarDiretoria.value.parecer || null
    });

    if (error) throw error;

    const result = data as { success: boolean; error?: string; message?: string };
    
    if (!result.success) {
      throw new Error(result.error || 'Erro ao aprovar requisição');
    }

    toast.add({
      title: 'Sucesso',
      description: 'Requisição aprovada pela diretoria e enviada ao setor responsável',
      color: 'green'
    });

    isOpenAprovarDiretoria.value = false;
    emit('aprovacao-sucesso');
  } catch (err: any) {
    toast.add({
      title: 'Erro',
      description: err.message || 'Não foi possível aprovar a requisição',
      color: 'red'
    });
  } finally {
    processando.value = false;
  }
}

async function confirmarReprovacao() {
  if (!formReprovar.value.motivo.trim()) {
    toast.add({
      title: 'Atenção',
      description: 'Por favor, informe o motivo da reprovação',
      color: 'orange'
    });
    return;
  }

  processando.value = true;
  try {
    const { data, error } = await supabase.rpc('reprovar_requisicao', {
      p_requisicao_id: props.requisicaoId,
      p_usuario_id: props.funcionarioId,
      p_motivo: formReprovar.value.motivo
    });

    if (error) throw error;

    const result = data as { success: boolean; error?: string; message?: string };
    
    if (!result.success) {
      throw new Error(result.error || 'Erro ao reprovar requisição');
    }

    toast.add({
      title: 'Requisição Reprovada',
      description: 'A requisição foi reprovada com sucesso',
      color: 'red'
    });

    isOpenReprovar.value = false;
    emit('reprovacao-sucesso');
  } catch (err: any) {
    toast.add({
      title: 'Erro',
      description: err.message || 'Não foi possível reprovar a requisição',
      color: 'red'
    });
  } finally {
    processando.value = false;
  }
}

// Expor métodos para o componente pai
defineExpose({
  abrirModalAprovarCoordenador,
  abrirModalAprovarGerente,
  abrirModalAprovarDiretoria,
  abrirModalReprovar
});
</script>
