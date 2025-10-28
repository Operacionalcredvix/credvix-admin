<template>
  <div>
    <header class="mb-8">
      <h1 class="text-primary-500 text-3xl font-bold">Dashboard de Produção</h1>
      <p class="mt-1 text-gray-500">Olá, {{ profile?.nome_completo }}! Aqui está um resumo da atividade.</p>
    </header>
    <!-- Renderiza o dashboard correto com base no perfil do usuário -->
    <component :is="activeDashboard" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useProfile } from '~/composables/useProfile';

const { profile } = useProfile();

// Mapeia o nome do perfil para o componente de dashboard correspondente
// O Nuxt auto-importa os componentes do diretório /components
const dashboardMap = {
  Master: resolveComponent('DashboardMaster'),
  Backoffice: resolveComponent('DashboardBackoffice'),
  Coordenador: resolveComponent('DashboardCoordenador'),
  Supervisor: resolveComponent('DashboardSupervisor'),
  Consultor: resolveComponent('DashboardConsultor'),
  RH: resolveComponent('DashboardRH')
};

const activeDashboard = computed(() => {
  const profileName = profile.value?.perfis?.nome;
  // Retorna o componente do perfil ou um dashboard padrão/vazio se não houver correspondência
  return dashboardMap[profileName] || null;
});

// A página principal (/) precisa estar protegida
definePageMeta({
  middleware: 'auth'
});
</script>