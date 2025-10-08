<template>
  <div>
    <header class="mb-8">
      <h1 class="text-primary-500 text-3xl font-bold">Dashboard de Produção</h1>
      <p class="mt-1 text-gray-500">
        Olá, {{ profile?.nome_completo }}! Aqui está um resumo da atividade.
      </p>
    </header>

    <!-- Dashboard para Master -->
    <DashboardMaster v-if="profile?.perfis?.nome === 'Master'"/>

    <!-- Dashboard para Coordenador -->
    <DashboardCoordenador v-if="profile?.perfis?.nome === 'Coordenador'"/>

    <!-- Dashboard para Supervisor -->
    <DashboardSupervisor v-if="profile?.perfis?.nome === 'Supervisor'"/>

    <!-- Dashboard para Consultor -->
    <DashboardConsultor v-if="profile?.perfis?.nome === 'Consultor'" />
  </div>
</template>

<script setup>
const { profile } = useProfile();
</script>