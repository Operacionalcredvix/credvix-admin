<template>
  <div>
    <header class="mb-8">
      <h1 class="text-primary-500 text-3xl font-bold">Meu Perfil</h1>
    </header>

    <div v-if="profile" class="max-w-2xl">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Informações da Conta</h3>
        </template>
        <div class="flex items-center gap-6">
          <UAvatar :key="profile.avatar_url" :src="profile.avatar_url" :alt="profile.nome_completo"
            icon="i-heroicons-user-circle" size="3xl" />
          <div>
            <p class="text-2xl font-bold">{{ profile.nome_completo }}</p>
            <p class="text-gray-500">{{ profile.perfis?.nome }}</p>
          </div>
        </div>
        <div class="mt-6">
          <label for="avatar-upload" class="block text-sm font-medium text-gray-700 mb-2">
            Trocar foto de perfil
          </label>
          <UInput id="avatar-upload" type="file" accept="image/*" @change="onFileChange" :loading="uploading" />
          <p v-if="uploadError" class="text-red-500 text-sm mt-2">{{ uploadError }}</p>
        </div>
      </UCard>

      <UCard class="mt-8">
        <template #header>
          <h3 class="text-lg font-semibold">Informações de Vínculo</h3>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div v-if="profile.lider">
            <p class="text-sm font-medium text-gray-500">Líder Direto</p>
            <p class="font-semibold">{{ profile.lider.nome_completo }}</p>
          </div>
          <div v-if="profile.lojas">
            <p class="text-sm font-medium text-gray-500">Loja</p>
            <p class="font-semibold">{{ profile.lojas.nome }}</p>
          </div>
          <div v-if="profile.lojas?.regionais">
            <p class="text-sm font-medium text-gray-500">Regional</p>
            <p class="font-semibold">{{ profile.lojas.regionais.nome_regional }}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Data de Admissão</p>
            <p class="font-semibold">{{ vinculo ? new Date(vinculo.data_admissao).toLocaleDateString('pt-BR', {
              timeZone: 'UTC'
            }) : 'Não disponível' }}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Tempo de Empresa</p>
            <p class="font-semibold">{{ tempoDeEmpresa }}</p>
          </div>
        </div>
      </UCard>

      <UCard class="mt-8">
        <template #header>
          <h3 class="text-lg font-semibold">Histórico de Alocações</h3>
        </template>
        <UTable :rows="historicoAlocacoes" :columns="alocacoesColumns"
          :empty-state="{ icon: 'i-heroicons-archive-box-x-mark', label: 'Nenhum histórico encontrado.' }">
          <template #perfis-data="{ row }">
            <span>{{ row.perfis?.nome || 'N/A' }}</span>
          </template>
          <template #lojas-data="{ row }">
            <span>{{ row.lojas?.nome || 'N/A' }}</span>
          </template>
          <template #data_inicio-data="{ row }">
            <span>{{ new Date(row.data_inicio).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) }}</span>
          </template>
          <template #data_fim-data="{ row }">
            <span v-if="row.data_fim">{{ new Date(row.data_fim).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
            }}</span>
            <UBadge v-else color="green" variant="subtle" label="Atual" />
          </template>
        </UTable>
      </UCard>

      <UCard class="mt-8">
        <template #header>
          <h3 class="text-lg font-semibold">Segurança da Conta</h3>
        </template>
        <UButton label="Alterar Senha" @click="isPasswordModalOpen = true" />
      </UCard>

    </div>    <div v-else>
      <p>A carregar perfil...</p>
    </div>

    <UModal v-model="isPasswordModalOpen">
      <UCard>
        <template #header>
          <h3 class="text-base font-semibold">Alterar Senha</h3>
        </template>
        <UForm :state="passwordFormData" @submit="handlePasswordUpdate" class="space-y-4">
          <UFormGroup label="Nova Senha" name="password" required>
            <UInput v-model="passwordFormData.password" type="password" placeholder="Mínimo de 6 caracteres" />
          </UFormGroup>
          <UFormGroup label="Confirmar Nova Senha" name="confirmPassword" required>
            <UInput v-model="passwordFormData.confirmPassword" type="password" placeholder="Repita a nova senha" />
          </UFormGroup>
          <div class="flex justify-end space-x-2 pt-4">
            <UButton label="Cancelar" color="gray" variant="ghost" @click="isPasswordModalOpen = false" />
            <UButton type="submit" label="Salvar Nova Senha" :loading="savingPassword" />
          </div>
        </UForm>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';

const { profile, fetchProfile } = useProfile();
const client = useSupabaseClient();
const toast = useToast();
const user = useSupabaseUser(); // Pega o utilizador autenticado
const uploading = ref(false);
const uploadError = ref(null);

// --- LÓGICA DE ALTERAÇÃO DE SENHA ---
const isPasswordModalOpen = ref(false);
const savingPassword = ref(false);
const passwordFormData = reactive({
  password: '',
  confirmPassword: ''
});

const handlePasswordUpdate = async () => {
  if (passwordFormData.password.length < 6) {
    toast.add({ title: 'Senha muito curta', description: 'A nova senha deve ter no mínimo 6 caracteres.', color: 'red' });
    return;
  }
  if (passwordFormData.password !== passwordFormData.confirmPassword) {
    toast.add({ title: 'Senhas não coincidem', description: 'Os campos "Nova Senha" e "Confirmar Nova Senha" devem ser iguais.', color: 'red' });
    return;
  }

  savingPassword.value = true;
  try {
    const { error } = await client.auth.updateUser({
      password: passwordFormData.password
    });
    if (error) throw error;

    toast.add({ title: 'Sucesso!', description: 'A sua senha foi alterada.' });
    isPasswordModalOpen.value = false;
    passwordFormData.password = '';
    passwordFormData.confirmPassword = '';
  } catch (error) {
    toast.add({ title: 'Erro!', description: 'Não foi possível alterar a sua senha. Tente novamente.', color: 'red' });
    console.error('Erro ao alterar senha:', error);
  } finally {
    savingPassword.value = false;
  }
};

// --- BUSCA DO VÍNCULO DE TRABALHO ---
const { data: vinculo } = await useAsyncData(
  `vinculo-perfil-${profile.value?.id}`,
  async () => {
    if (!profile.value?.id) return {}; // CORREÇÃO: Retorna um objeto vazio em vez de null
    const { data, error } = await client
      .from('historico_vinculos')
      .select('data_admissao')
      .eq('funcionario_id', profile.value.id)
      .order('data_admissao', { ascending: false }) // Pega o mais recente
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') console.error('Erro ao buscar vínculo:', error);
    return data;
  },
  { watch: [profile] }
);

// --- CÁLCULO DO TEMPO DE EMPRESA ---
const tempoDeEmpresa = computed(() => {
  if (!vinculo.value?.data_admissao) return 'Não disponível';
  const admissao = new Date(vinculo.value.data_admissao);
  const hoje = new Date();
  const diffTime = Math.abs(hoje - admissao);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return `${diffDays} dia(s)`;
});

// --- BUSCA DO HISTÓRICO DE ALOCAÇÕES ---
const { data: historicoAlocacoes } = await useAsyncData(
  `historico-alocacoes-${profile.value?.id}`,
  async () => {
    if (!profile.value?.id) return [];
    const { data, error } = await client
      .from('historico_alocacoes')
      .select(`id, data_inicio, data_fim, perfis (nome), lojas (nome)`)
      .eq('funcionario_id', profile.value.id)
      .order('data_inicio', { ascending: false }); // Mais recentes primeiro

    if (error) {
      console.error('Erro ao buscar histórico de alocações:', error);
      return [];
    }
    return data;
  },
  { watch: [profile] }
);

// Colunas para a tabela de histórico
const alocacoesColumns = [
  { key: 'perfis', label: 'Perfil' },
  { key: 'lojas', label: 'Loja' },
  { key: 'data_inicio', label: 'Data de Início' },
  { key: 'data_fim', label: 'Data de Fim' },
];

const onFileChange = async (event) => {
  const file = event.target.files[0];
  // Garante que temos um utilizador e um perfil antes de continuar
  if (!file || !user.value || !profile.value) return;

  uploading.value = true;
  uploadError.value = null;

  try {
    const fileExt = file.name.split('.').pop();
    // CORREÇÃO: O nome do ficheiro pode ser aleatório para evitar problemas de cache.
    // O importante é que ele esteja dentro da pasta com o ID do utilizador.
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${user.value.id}/${fileName}`;

    // Faz o upload para o bucket 'avatars'
    const { error: uploadErr } = await client.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadErr) throw uploadErr;

    // Obtém o URL público da nova imagem
    const { data } = client.storage.from('avatars').getPublicUrl(filePath);
    const publicUrl = `${data.publicUrl}?t=${new Date().getTime()}`;

    // Atualiza a tabela 'funcionarios' com o novo URL
    const { error: updateErr } = await client
      .from('funcionarios')
      .update({ avatar_url: publicUrl })
      .eq('id', profile.value.id);

    if (updateErr) throw updateErr;

    // Força a atualização dos dados do perfil localmente
    await fetchProfile();
    
    toast.add({ title: 'Sucesso!', description: 'Foto de perfil atualizada.' });

  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    uploadError.value = 'Não foi possível enviar a imagem. Tente novamente.';
    toast.add({ title: 'Erro!', description: error.message, color: 'red' });
  } finally {
    uploading.value = false;
  }
};
</script>