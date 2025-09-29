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

        <template #coordenadores-data="{ row }">
          <div class="flex flex-wrap gap-1">
            <UBadge v-if="row.coordenador_regionais.length === 0" label="Nenhum" color="gray" variant="soft" />
            <UBadge v-for="item in row.coordenador_regionais" :key="item.coordenador_id"
              :label="item.funcionarios.nome_completo" color="gray" variant="soft" />
          </div>
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

          <UFormGroup label="Coordenadores Responsáveis" name="coordenadores_ids">
            <USelectMenu v-model="formData.coordenadores_ids" :options="coordenadores" value-attribute="id"
              option-attribute="nome_completo" multiple placeholder="Selecione...">
              <template #label>
                <span v-if="formData.coordenadores_ids.length" class="truncate">{{ formData.coordenadores_ids.length }}
                  coordenador(es) selecionado(s)</span>
                <span v-else>Selecione um ou mais coordenadores</span>
              </template>
            </USelectMenu>
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
import { ref, reactive, computed } from 'vue';

const supabase = useSupabaseClient();
const toast = useToast();

// --- ESTADO DA PÁGINA ---
const isModalOpen = ref(false);
const saving = ref(false);
const getInitialFormData = () => ({
  id: null,
  nome_regional: '',
  coordenador_id: null, // Agora é um único ID 
});
const formData = reactive(getInitialFormData());

// --- COLUNAS ATUALIZADAS ---
const columns = [
  { key: 'nome_regional', label: 'Nome da Regional', sortable: true },
  { key: 'coordenador', label: 'Coordenador' },
  { key: 'lojas', label: 'Qtd. Lojas' },
  { key: 'actions', label: 'Ações' }
];

// --- CARREGAMENTO DE DADOS (CONSULTA CORRIGIDA) ---
const { data: regionais, pending, refresh } = await useAsyncData('regionais', async () => {
  const { data } = await supabase
    .from('regionais')
    .select(`
      *,
      lojas(id),
      funcionarios (nome_completo)
    `);
  return data;
});

const { data: todasLojas } = await useAsyncData('todasLojas', async () => {
  const { data, error } = await supabase.from('lojas').select('id, nome').order('nome');
  if (error) {
    console.error("Erro ao buscar todas as lojas:", error);
    return [];
  }
  return data;
});

const { data: coordenadores } = await useAsyncData('coordenadores', async () => {
    // Busca o ID do perfil "Coordenador"
  const { data: perfilCoordenador } = await supabase.from('perfis').select('id').eq('nome', 'Coordenador').single();
  if (!perfilCoordenador) return [];
    // Busca os funcionários com esse perfil
  const { data } = await supabase.from('funcionarios').select('id, nome_completo').eq('perfil_id', perfilCoordenador.id);
  return data;
});

// --- LÓGICA DO FORMULÁRIO (SIMPLIFICADA) ---
const openModal = (regional = null) => {
  if (regional) {
    formData.id = regional.id;
    formData.nome_regional = regional.nome_regional;
    formData.coordenador_id = regional.coordenador_id;
  } else {
    Object.assign(formData, getInitialFormData());
  }
  isModalOpen.value = true;
};

const handleFormSubmit = async () => {
  saving.value = true;
  try {
    const dataToSave = {
        nome_regional: formData.nome_regional,
        coordenador_id: formData.coordenador_id
    };

    if (formData.id) { // Edição
      const { error } = await supabase.from('regionais').update(dataToSave).eq('id', formData.id);
      if (error) throw error;
      toast.add({ title: 'Sucesso!', description: 'Regional atualizada.' });
    } else { // Criação
      const { error } = await supabase.from('regionais').insert(dataToSave);
      if (error) throw error;
      toast.add({ title: 'Sucesso!', description: 'Nova regional criada.' });
    }
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