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
  coordenadores_ids: [],
  lojas_ids: [],
});
const formData = reactive(getInitialFormData());

// --- DEFINIÇÃO DAS COLUNAS DA TABELA ---
const columns = [
  { key: 'nome_regional', label: 'Nome da Regional', sortable: true },
  { key: 'coordenadores', label: 'Coordenadores' },
  { key: 'lojas', label: 'Qtd. Lojas' },
  { key: 'actions', label: 'Ações' }
];

// --- CARREGAMENTO DE DADOS (LÓGICA CORRIGIDA) ---
const { data: regionais, pending, refresh } = await useAsyncData('regionais', async () => {
  const { data, error } = await supabase
    .from('regionais')
    .select(`
      *,
      lojas(id),
      coordenador_regionais(coordenador_id, funcionarios(nome_completo))
    `);
  if (error) {
    console.error("Erro ao buscar regionais:", error);
    return [];
  }
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
  const { data: perfilCoordenador, error: perfilError } = await supabase.from('perfis').select('id').eq('nome', 'Coordenador').single();
  if (perfilError || !perfilCoordenador) return [];

  const { data, error: funcError } = await supabase.from('funcionarios').select('id, nome_completo').eq('perfil_id', perfilCoordenador.id);
  if (funcError) return [];

  return data;
});

// --- LÓGICA DO FORMULÁRIO (COM MAIS SEGURANÇA) ---
const openModal = (regional = null) => {
  if (regional) {
    formData.id = regional.id;
    formData.nome_regional = regional.nome_regional;
    // Adicionamos '|| []' para garantir que nunca falhe
    formData.coordenadores_ids = (regional.coordenador_regionais || []).map(item => item.coordenador_id);
    formData.lojas_ids = (regional.lojas || []).map(loja => loja.id);
  } else {
    Object.assign(formData, getInitialFormData());
  }
  isModalOpen.value = true;
};

const handleFormSubmit = async () => {
  saving.value = true;
  try {
    const { id, nome_regional, coordenadores_ids, lojas_ids } = formData;

    if (id) { // Modo de Edição
      // 1. Atualiza o nome da regional
      const { error: regionalError } = await supabase.from('regionais').update({ nome_regional }).eq('id', id);
      if (regionalError) throw regionalError;

      // 2. Sincroniza Coordenadores
      await supabase.from('coordenador_regionais').delete().eq('regional_id', id);
      if (coordenadores_ids.length > 0) {
        const coordLinks = coordenadores_ids.map(coord_id => ({ regional_id: id, coordenador_id: coord_id }));
        await supabase.from('coordenador_regionais').insert(coordLinks);
      }

      // 3. Sincroniza Lojas
      await supabase.from('lojas').update({ regional_id: null }).eq('regional_id', id);
      if (lojas_ids.length > 0) {
        await supabase.from('lojas').update({ regional_id: id }).in('id', lojas_ids);
      }
      toast.add({ title: 'Sucesso!', description: 'Regional atualizada.' });
    } else { // Modo de Criação
      // ... (lógica de criação)
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
  if (confirm(`Tem a certeza que quer excluir a regional "${regional.nome_regional}"?`)) {
    try {
      await supabase.from('coordenador_regionais').delete().eq('regional_id', regional.id);
      await supabase.from('lojas').update({ regional_id: null }).eq('regional_id', regional.id);

      const { error } = await supabase.from('regionais').delete().eq('id', regional.id);
      if (error) throw error;
      toast.add({ title: 'Sucesso!', description: 'Regional excluída.' });
      await refresh();
    } catch (error) {
      toast.add({ title: 'Erro!', description: 'Não foi possível excluir.', color: 'red' });
    }
  }
};
</script>