<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
      <img src="/apis-preto.png" alt="Logo Apis Grupo" class="w-20 mx-auto" />

      <div v-if="successMessage" class="text-center">
        <h2 class=" text-primary-500 text-2xl font-bold text-gray-800">Senha Alterada!</h2>
        <p class="mt-4 text-green-600">{{ successMessage }}</p>
        <UButton to="/login" label="Ir para o Login" class="mt-6" size="xl" block />
      </div>

      <div v-else>
        <h2 class="text-2xl font-bold text-center text-gray-800">
          Crie sua Nova Senha
        </h2>
        <form @submit.prevent="handleUpdatePassword" class="space-y-6 mt-6">
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">Nova Senha</label>
            <UInput
              id="password"
              v-model="password"
              type="password"
              required
              placeholder="Digite sua nova senha"
              size="xl"
            />
          </div>
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirme a Nova Senha</label>
            <UInput
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              required
              placeholder="Digite a nova senha novamente"
              size="xl"
            />
          </div>
          <UButton
            type="submit"
            label="Salvar Nova Senha"
            color="primary"
            size="xl"
            :loading="loading"
            block
          />
          <p v-if="errorMessage" class="text-sm text-red-600 text-center">
            {{ errorMessage }}
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
// Usa o layout 'empty' para não mostrar a barra lateral
definePageMeta({
  layout: 'empty'
});

const supabase = useSupabaseClient();
const router = useRouter();

const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const handleUpdatePassword = async () => {
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'As senhas não coincidem. Por favor, tente novamente.';
    return;
  }
  if (password.value.length < 6) {
    errorMessage.value = 'A senha deve ter pelo menos 6 caracteres.';
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    // A biblioteca do Supabase detecta automaticamente o token de acesso da URL
    const { error } = await supabase.auth.updateUser({
      password: password.value
    });

    if (error) throw error;

    // Exibe a mensagem de sucesso
    successMessage.value = 'Sua senha foi atualizada com sucesso. Você já pode fazer o login.';

  } catch (error) {
    errorMessage.value = error.message || 'Ocorreu um erro ao atualizar a senha.';
    console.error('Erro ao atualizar senha:', error);
  } finally {
    loading.value = false;
  }
};
</script>