<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
      <img src="/apis-preto.png" alt="Logo Apis Grupo" class="w-20 mx-auto" />

      <h2 class="text-2xl font-bold text-center text-gray-800">
        Acesso ao Painel
      </h2>
      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
          <UInput
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="Digite seu e-mail"
            size="xl"
          />
        </div>
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">Senha</label>
          <UInput
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="Digite sua senha"
            size="xl"
          />
        </div>
        <UButton
          type="submit"
          label="Entrar"
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
</template>

<script setup>
// Define que esta página não usará nenhum layout principal (como a sidebar)
definePageMeta({
  layout: 'empty' // Criaremos este layout em branco a seguir
});

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

// Obtém o cliente Supabase e o router do Nuxt
const supabase = useSupabaseClient();
const router = useRouter();

const handleLogin = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });
    if (error) throw error;
    // Se o login for bem-sucedido, redireciona para a página principal
    router.push('/');
  } catch (error) {
    errorMessage.value = 'E-mail ou senha inválidos. Tente novamente.';
    console.error('Erro de login:', error);
  } finally {
    loading.value = false;
  }
};

// Adiciona as imagens que o formulário usa
// Crie uma pasta 'public' na raiz e coloque as imagens lá
</script>