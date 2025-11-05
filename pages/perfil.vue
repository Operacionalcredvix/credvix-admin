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
          <UAvatar :key="profile.avatar_url" :src="previewUrl || profile.avatar_url" :alt="profile.nome_completo"
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
import { ref, reactive, computed, onUnmounted } from 'vue';

const { profile, fetchProfile } = useProfile();
const client = useSupabaseClient();
const toast = useToast();
const user = useSupabaseUser(); // Pega o utilizador autenticado
const uploading = ref(false);
const uploadError = ref(null);
const previewUrl = ref(null);

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
  // O componente de input pode emitir diferentes payloads dependendo da implementação
  // - event.target.files (nativo)
  // - event.files (alguns componentes custom)
  // - receber um File diretamente
  let file = null
  try {
    if (!event) {
      uploadError.value = 'Arquivo inválido.'
      return
    }
    if (event.target && event.target.files) file = event.target.files[0]
    else if (event.files) file = event.files[0]
    else if (Array.isArray(event) && event[0]) file = event[0]
    else if (event instanceof File) file = event
    else if (event[0] && event[0] instanceof File) file = event[0]
  } catch (err) {
    console.warn('onFileChange: payload parsing failed', err)
  }

  // Garante que temos um utilizador e um perfil antes de continuar
  if (!file) {
    uploadError.value = 'Nenhum ficheiro selecionado.'
    return
  }
  if (!user.value || !profile.value) {
    uploadError.value = 'Utilizador não autenticado.'
    return
  }

  // Validações básicas do ficheiro
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (file.size > maxSize) {
    uploadError.value = 'O ficheiro é demasiado grande (max 5MB).'
    return
  }
  if (file.type && !allowedTypes.includes(file.type)) {
    uploadError.value = 'Tipo de ficheiro não suportado. Use JPG/PNG/WEBP.'
    return
  }

  uploading.value = true;
  uploadError.value = null;

  try {
    // mostra preview instantâneo enquanto acontece o upload
    try { previewUrl.value = URL.createObjectURL(file) } catch(e) { /* ignore */ }

    const fileExt = (file.name || 'img').split('.').pop();
    // Nome aleatório para evitar problemas de cache
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${user.value.id}/${fileName}`;

    // Faz upload via endpoint server que usa a service role (fallback/solução robusta)
    const toBase64 = (f) => new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result
        if (!result || typeof result !== 'string') return resolve(null)
        const parts = result.split(',')
        resolve(parts[1])
      }
      reader.onerror = reject
      reader.readAsDataURL(f)
    })

    const base64 = await toBase64(file)
    if (!base64) throw new Error('Falha ao converter ficheiro para base64')

    const sessionToken = (await client.auth.getSession())?.data?.session?.access_token || null
    const headers = sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}

    const res = await $fetch('/api/profile/upload', {
      method: 'POST',
      headers,
      body: {
        filePath,
        fileName,
        contentType: file.type,
        base64
      }
    })
    if (!res || res.success === false) throw new Error(res?.error || 'Falha ao atualizar avatar')

    // Força a atualização dos dados do perfil localmente
    await fetchProfile()

    // limpa preview temporário (será substituído pelo avatar do profile atual)
    try { if (previewUrl.value) { URL.revokeObjectURL(previewUrl.value); previewUrl.value = null } } catch (e) {}

    toast.add({ title: 'Sucesso!', description: 'Foto de perfil atualizada.' });

  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    // Mensagem amigável quando bucket não existe
    const msg = String(error?.message || error || '')
    if (msg.toLowerCase().includes('bucket not found') || msg.toLowerCase().includes('bucket não encontrado') || msg.includes('404')) {
      uploadError.value = 'Bucket "avatars" não encontrado no Supabase Storage. Verifique a configuração do bucket.'
    } else {
      uploadError.value = 'Não foi possível enviar a imagem. Tente novamente.';
    }
    toast.add({ title: 'Erro!', description: msg, color: 'red' });
  } finally {
    uploading.value = false;
  }
}

// cleanup preview URL when component unmounts
onUnmounted(() => {
  try { if (previewUrl.value) { URL.revokeObjectURL(previewUrl.value); previewUrl.value = null } } catch (e) {}
})
</script>