<template>
  <div>
    <header class="mb-8 flex justify-between items-center">
      <h1 class="text-primary-500 text-3xl font-bold">Gestão de Regionais</h1>
      <UButton icon="i-heroicons-plus-circle" size="lg" @click="openModal()">
        Adicionar Nova Regional
      </UButton>
    </header>

    <UCard>
      <UTable :rows="regionais || []" :columns="columns" :loading="pending">
        <template #lojas-data="{ row }">
          <UBadge :label="row.lojas.length" variant="subtle" />
        </template>

        <template #coordenador-data="{ row }">
          <UBadge v-if="!row.coordenador" label="Nenhum" color="gray" variant="soft" />
          <UBadge v-else :label="row.coordenador.nome_completo" color="gray" variant="soft" />
        </template>

        <template #actions-data="{ row }">
          <UButton icon="i-heroicons-pencil" size="sm" color="gray" variant="ghost" @click="openModal(row)" />
          <UButton icon="i-heroicons-trash" size="sm" color="red" variant="ghost" @click="handleDelete(row)" />
        </template>
      </UTable>
    </UCard>

    <USlideover v-model="isModalOpen">
      <UCard class="flex flex-col flex-1" :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <h3 class="text-base font-semibold">
            {{ formData.id ? 'Editar Regional' : 'Adicionar Nova Regional' }}
          </h3>
        </template>

        <UForm :state="formData" @submit="handleFormSubmit" class="p-4 space-y-6">
          <UFormGroup label="Nome da Regional" name="nome_regional" required>
            <UInput v-model="formData.nome_regional" placeholder="Ex: Regional Sudeste" />
          </UFormGroup>

          <UFormGroup label="Coordenador Responsável" name="coordenador_id">
            <USelectMenu v-model="formData.coordenador_id" :options="coordenadores" value-attribute="id"
              option-attribute="nome_completo" placeholder="Selecione..." clearable />
          </UFormGroup>

          <UFormGroup label="Lojas nesta Regional" name="lojas_ids">
            <USelectMenu v-model="formData.lojas_ids" :options="todasLojas" value-attribute="id" option-attribute="nome"
              multiple placeholder="Selecione...">
              <template #label>
                <span v-if="formData.lojas_ids.length" class="truncate">{{ formData.lojas_ids.length }} loja(s)
                  selecionada(s)</span>
                <span v-else>Selecione as lojas</span>
              </template>
            </USelectMenu>
          </UFormGroup>
          <div class="flex justify-end space-x-2 pt-4">
            <UButton label="Cancelar" color="gray" variant="ghost" @click="isModalOpen = false" />
            <UButton type="submit" :label="formData.id ? 'Salvar Alterações' : 'Criar Regional'" :loading="saving" />
          </div>
        </UForm>
      </UCard>
    </USlideover>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

const supabase = useSupabaseClient();
const toast = useToast();

// --- ESTADO DA PÁGINA ---
const isModalOpen = ref(false);
const saving = ref(false);

// CORREÇÃO: O estado inicial agora reflete a estrutura correta com um único `coordenador_id`
const getInitialFormData = () => ({
  id: null,
  nome_regional: '',
  coordenador_id: null,
  lojas_ids: []
});

const formData = reactive(getInitialFormData());

// --- COLUNAS DA TABELA ---
// CORREÇÃO: A chave da coluna de coordenador foi ajustada
const columns = [
  { key: 'nome_regional', label: 'Nome da Regional', sortable: true },
  { key: 'coordenador', label: 'Coordenador' },
  { key: 'lojas', label: 'Qtd. Lojas' },
  { key: 'actions', label: 'Ações' }
];

// --- CARREGAMENTO DE DADOS ---
// A query foi ajustada para buscar o nome do coordenador corretamente
const { data: regionais, pending, refresh } = await useAsyncData('regionais', async () => {
  const { data, error } = await supabase
    .from('regionais')
    .select(`
      id,
      nome_regional,
      coordenador_id,
      lojas(id),
      coordenador:funcionarios(nome_completo)
    `);
  if (error) console.error('Erro ao carregar regionais:', error);
  return data;
});

const { data: todasLojas } = await useAsyncData('todasLojas', async () => {
  const { data } = await supabase.from('lojas').select('id, nome').order('nome');
  return data || [];
});

const { data: coordenadores } = await useAsyncData('coordenadores', async () => {
  const { data: perfilCoordenador } = await supabase.from('perfis').select('id').eq('nome', 'Coordenador').single();
  if (!perfilCoordenador) return [];
  const { data } = await supabase.from('funcionarios').select('id, nome_completo').eq('perfil_id', perfilCoordenador.id);
  return data || [];
});

// --- LÓGICA DO FORMULÁRIO---
// A lógica de abrir o modal foi ajustada para a nova estrutura de dados
const openModal = (regional = null) => {
  if (regional) {
    formData.id = regional.id;
    formData.nome_regional = regional.nome_regional;
    formData.coordenador_id = regional.coordenador_id;
    formData.lojas_ids = regional.lojas.map(l => l.id);
  } else {
    Object.assign(formData, getInitialFormData());
  }
  isModalOpen.value = true;
};

// A lógica de submissão foi simplificada e corrigida
const handleFormSubmit = async () => {
  saving.value = true;
  try {
    const { id, nome_regional, coordenador_id, lojas_ids } = formData;
    let regionalId = id;

    // 1. Salva ou atualiza a regional com o ID do coordenador
    const dataToSave = {
      nome_regional,
      coordenador_id
    };

    if (id) { // Edição
      const { error } = await supabase.from('regionais').update(dataToSave).eq('id', id);
      if (error) throw error;
    } else { // Criação
      const { data, error } = await supabase.from('regionais').insert(dataToSave).select('id').single();
      if (error) throw error;
      regionalId = data.id;
    }

    // 2. Sincroniza as lojas
    // Remove o vínculo de todas as lojas que possam estar associadas a esta regional
    await supabase.from('lojas').update({ regional_id: null }).eq('regional_id', regionalId);
    
    // Adiciona o novo vínculo para as lojas selecionadas
    if (lojas_ids && lojas_ids.length > 0) {
        const { error: updateLojasError } = await supabase.from('lojas').update({ regional_id: regionalId }).in('id', lojas_ids);
        if (updateLojasError) throw updateLojasError;
    }

    toast.add({ title: 'Sucesso!', description: `Regional ${id ? 'atualizada' : 'criada'} com sucesso.` });
    isModalOpen.value = false;
    await refresh();

  } catch (error) {
    toast.add({ title: 'Erro!', description: error.message, color: 'red' });
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (regional) => {
  if (confirm(`Tem a certeza de que quer excluir a regional "${regional.nome_regional}"? Esta ação não pode ser desfeita.`)) {
    try {
      // Desvincula as lojas da regional antes de apagar
      await supabase.from('lojas').update({ regional_id: null }).eq('regional_id', regional.id);
      
      // Apaga a regional
      const { error } = await supabase.from('regionais').delete().eq('id', regional.id);
      if (error) throw error;

      toast.add({ title: 'Sucesso!', description: 'Regional excluída.' });
      await refresh();
    } catch (error) {
      toast.add({ title: 'Erro!', description: error.message, color: 'red' });
    }
  }
};
</script>