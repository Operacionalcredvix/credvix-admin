<template>
  <div>
    <header class="mb-8 flex justify-between items-center">
      <h1 class=" text-primary-500 text-3xl font-bold">Gestão de Regionais</h1>
      <UButton icon="i-heroicons-plus-circle" size="lg" @click="openModal()">
        Adicionar Nova Regional
      </UButton>
    </header>

    <UCard>
      <UTable :rows="regionaisComDados || []" :columns="columns" :loading="pending">
        <template #lojas-data="{ row }">
          <UBadge :label="row.lojas.length" variant="subtle" />
        </template>
        
        <template #coordenador-data="{ row }">
          <span v-if="row.funcionarios.length > 0">{{ row.funcionarios[0].nome_completo }}</span>
          <span v-else class="text-gray-500">Nenhum</span>
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
            <USelectMenu v-model="formData.coordenador_id" :options="coordenadores" value-attribute="id" option-attribute="nome_completo" placeholder="Selecione um coordenador" clearable />
          </UFormGroup>

          <UFormGroup label="Lojas nesta Regional" name="lojas_ids">
             <USelectMenu v-model="formData.lojas_ids" :options="todasLojas" value-attribute="id" option-attribute="nome" multiple placeholder="Selecione as lojas" />
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
const supabase = useSupabaseClient();
const toast = useToast();

// --- ESTADO DA PÁGINA ---
const isModalOpen = ref(false);
const saving = ref(false);
const getInitialFormData = () => ({
  id: null,
  nome_regional: '',
  coordenador_id: null,
  lojas_ids: [],
});
const formData = reactive(getInitialFormData());

// --- DEFINIÇÃO DAS COLUNAS DA TABELA ---
const columns = [
  { key: 'nome_regional', label: 'Nome da Regional', sortable: true },
  { key: 'coordenador', label: 'Coordenador' },
  { key: 'lojas', label: 'Qtd. Lojas' },
  { key: 'actions', label: 'Ações' }
];

// --- CARREGAMENTO DE DADOS ---
const { data: regionais, pending, refresh } = await useAsyncData('regionais', async () => {
  // Agora buscamos as regionais com as lojas e coordenadores relacionados
  const { data } = await supabase
    .from('regionais')
    .select(`
      *,
      lojas(id),
      funcionarios(id, nome_completo)
    `)
    .order('nome_regional');
  return data;
});

const { data: todasLojas } = await useAsyncData('todasLojas', () => 
  supabase.from('lojas').select('id, nome').order('nome')
);

const { data: coordenadores } = await useAsyncData('coordenadores', async () => {
  const { data: perfilCoordenador } = await supabase.from('perfis').select('id').eq('nome', 'Coordenador').single();
  if (!perfilCoordenador) return [];
  const { data } = await supabase.from('funcionarios').select('id, nome_completo').eq('perfil_id', perfilCoordenador.id);
  return data || [];
});

// --- LÓGICA COMPUTADA E DO FORMULÁRIO ---
const regionaisComDados = computed(() => {
  return regionais.value?.map(r => ({ ...r })) || [];
});

const openModal = (regional = null) => {
  if (regional) {
    formData.id = regional.id;
    formData.nome_regional = regional.nome_regional;
    formData.coordenador_id = regional.funcionarios.length > 0 ? regional.funcionarios[0].id : null;
    formData.lojas_ids = regional.lojas.map(loja => loja.id);
  } else {
    Object.assign(formData, getInitialFormData());
  }
  isModalOpen.value = true;
};

const handleFormSubmit = async () => {
  saving.value = true;
  try {
    const { id, nome_regional, coordenador_id, lojas_ids } = formData;

    if (id) { // Modo de Edição
      // 1. Atualiza o nome da regional
      const { error: regionalError } = await supabase.from('regionais').update({ nome_regional }).eq('id', id);
      if (regionalError) throw regionalError;

      // 2. Desvincula o coordenador antigo (se houver)
      await supabase.from('funcionarios').update({ regional_id: null }).eq('regional_id', id);
      // 3. Vincula o novo coordenador
      if (coordenador_id) {
        await supabase.from('funcionarios').update({ regional_id: id }).eq('id', coordenador_id);
      }
      
      // 4. Desvincula todas as lojas antigas
      await supabase.from('lojas').update({ regional_id: null }).eq('regional_id', id);
      // 5. Vincula as novas lojas
      if (lojas_ids.length > 0) {
        await supabase.from('lojas').update({ regional_id: id }).in('id', lojas_ids);
      }
      toast.add({ title: 'Sucesso!', description: 'Regional atualizada.' });
    } else { // Modo de Criação
      // 1. Cria a nova regional
      const { data: newRegional, error: regionalError } = await supabase.from('regionais').insert({ nome_regional }).select().single();
      if (regionalError) throw regionalError;

      const newRegionalId = newRegional.id;
      // 2. Vincula o coordenador
      if (coordenador_id) {
        await supabase.from('funcionarios').update({ regional_id: newRegionalId }).eq('id', coordenador_id);
      }
      // 3. Vincula as lojas
      if (lojas_ids.length > 0) {
        await supabase.from('lojas').update({ regional_id: newRegionalId }).in('id', lojas_ids);
      }
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

const handleDelete = async (regional) => { /* ... (sem alterações) ... */ };
</script>