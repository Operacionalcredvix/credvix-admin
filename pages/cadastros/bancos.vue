<template>
    <div>
        <header class="mb-8 flex justify-between items-center">
            <h1 class="text-primary-500 text-3xl font-bold">Gestão de Bancos</h1>
            <UButton icon="i-heroicons-plus-circle" size="lg" @click="openModal()">
                Adicionar Novo Banco
            </UButton>
        </header>

        <UCard>
            <UTable :rows="bancos || []" :columns="columns" :loading="pending">
                <template #actions-data="{ row }">
                    <UButton icon="i-heroicons-pencil" size="sm" color="gray" variant="ghost" @click="openModal(row)" />
                    <UButton icon="i-heroicons-trash" size="sm" color="red" variant="ghost"
                        @click="handleDelete(row)" />
                </template>
            </UTable>
        </UCard>

        <USlideover v-model="isModalOpen">
            <UCard class="flex flex-col flex-1"
                :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
                <template #header>
                    <h3 class="text-base font-semibold">
                        {{ formData.id ? 'Editar Banco' : 'Adicionar Novo Banco' }}
                    </h3>
                </template>

                <UForm :state="formData" @submit="handleFormSubmit" class="p-4 space-y-4">
                    <UFormGroup label="Nome da Instituição" name="nome_instituicao" required>
                        <UInput v-model="formData.nome_instituicao" placeholder="Ex: Banco do Brasil" />
                    </UFormGroup>

                    <UFormGroup label="Código do Banco" name="codigo_banco">
                        <UInput v-model="formData.codigo_banco" placeholder="Ex: 001" />
                    </UFormGroup>

                    <div class="flex justify-end space-x-2 pt-4">
                        <UButton label="Cancelar" color="gray" variant="ghost" @click="isModalOpen = false" />
                        <UButton type="submit" :label="formData.id ? 'Salvar Alterações' : 'Criar Banco'"
                            :loading="saving" />
                    </div>
                </UForm>
            </UCard>
        </USlideover>
    </div>
</template>

<script setup>
const supabase = useSupabaseClient();
const toast = useToast(); // <--- Adiciona o sistema de notificações

// --- ESTADO DA PÁGINA ---
const isModalOpen = ref(false);
const saving = ref(false);
const getInitialFormData = () => ({
    id: null,
    nome_instituicao: '',
    codigo_banco: ''
});
const formData = reactive(getInitialFormData());

// --- DEFINIÇÃO DAS COLUNAS DA TABELA ---
const columns = [
    { key: 'nome_instituicao', label: 'Nome da Instituição', sortable: true },
    { key: 'codigo_banco', label: 'Código', sortable: true },
    { key: 'actions', label: 'Ações' }
];

// --- CARREGAMENTO DE DADOS ---
const { data: bancos, pending, refresh } = await useAsyncData('bancos', async () => {
    const { data } = await supabase.from('bancos').select('*').order('nome_instituicao');
    return data;
});

// --- LÓGICA DO FORMULÁRIO ---
const openModal = (banco = null) => {
    if (banco) {
        Object.assign(formData, banco);
    } else {
        Object.assign(formData, getInitialFormData());
    }
    isModalOpen.value = true;
};

const handleFormSubmit = async () => {
    saving.value = true;
    try {
        const dataToSave = { ...formData };

        if (dataToSave.id) { // Modo de Edição
            // Cria uma cópia dos dados e remove o 'id' antes de enviar para o update
            const { id, ...updateData } = dataToSave;

            const { error } = await supabase.from('bancos').update(updateData).eq('id', id);
            if (error) throw error;
            toast.add({ title: 'Sucesso!', description: 'Banco atualizado.' });
        } else {
            delete dataToSave.id;
            const { error } = await supabase.from('bancos').insert(dataToSave);
            if (error) throw error;
            // --- MENSAGEM DE SUCESSO ---
            toast.add({ title: 'Sucesso!', description: 'Novo banco criado.' });
        }
        isModalOpen.value = false;
        await refresh();
    } catch (error) {
        // --- MENSAGEM DE ERRO ---
        toast.add({ title: 'Erro!', description: error.message, color: 'red' });
    } finally {
        saving.value = false;
    }
};

const handleDelete = async (banco) => {
    if (confirm(`Tem a certeza que quer excluir o banco "${banco.nome_instituicao}"?`)) {
        try {
            const { error } = await supabase.from('bancos').delete().eq('id', banco.id);
            if (error) throw error;
            // --- MENSAGEM DE SUCESSO ---
            toast.add({ title: 'Sucesso!', description: 'Banco excluído.' });
            await refresh();
        } catch (error) {
            // --- MENSAGEM DE ERRO ---
            toast.add({ title: 'Erro!', description: 'Não foi possível excluir. Verifique se este banco está a ser usado em alguma tabela.', color: 'red' });
        }
    }
};
</script>