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
          <UAvatar 
            :key="profile.avatar_url"
            :src="profile.avatar_url" 
            :alt="profile.nome_completo" 
            icon="i-heroicons-user-circle"
            size="3xl" 
          />
          <div>
            <p class="text-2xl font-bold">{{ profile.nome_completo }}</p>
            <p class="text-gray-500">{{ profile.perfis?.nome }}</p>
          </div>
        </div>

        <div class="mt-6">
          <label for="avatar-upload" class="block text-sm font-medium text-gray-700 mb-2">
            Trocar foto de perfil
          </label>
          <UInput
            id="avatar-upload"
            type="file"
            accept="image/*"
            @change="onFileChange"
            :loading="uploading"
          />
          <p v-if="uploadError" class="text-red-500 text-sm mt-2">{{ uploadError }}</p>
        </div>
      </UCard>
    </div>
    <div v-else>
        <p>A carregar perfil...</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const { profile, fetchProfile } = useProfile();
const client = useSupabaseClient();
const toast = useToast();
const user = useSupabaseUser(); // Pega o utilizador autenticado
const uploading = ref(false);
const uploadError = ref(null);

const onFileChange = async (event) => {
  const file = event.target.files[0];
  // Garante que temos um utilizador e um perfil antes de continuar
  if (!file || !user.value || !profile.value) return;

  uploading.value = true;
  uploadError.value = null;

  try {
    const fileExt = file.name.split('.').pop();
    // CORREÇÃO 2: O nome do ficheiro agora é o ID do utilizador (mais seguro)
    const fileName = `${user.value.id}.${fileExt}`;
    // O caminho inclui o ID do utilizador como "pasta" para corresponder à policy
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
    const publicUrl = data.publicUrl;

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