<template>
  <div>
    <header class="mb-8">
      <h1 class="text-primary-500 text-3xl font-bold">Dashboard RH</h1>
      <p class="text-gray-500 mt-1">Bem-vindo ao painel de Recursos Humanos</p>
    </header>

    <!-- Placeholder para conteúdo futuro -->
    <UCard>
      <div class="flex flex-col items-center justify-center py-16 gap-4">
        <UIcon name="i-heroicons-briefcase" class="text-6xl text-primary-500" />
        <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-300">Dashboard em Desenvolvimento</h3>
        <p class="text-gray-500 text-center max-w-md">
          O dashboard de RH está sendo construído. Em breve você terá acesso a estatísticas e ferramentas completas de gestão de recursos humanos.
        </p>
        <div class="flex gap-4 mt-4">
          <UButton to="/rh/vagas" color="primary" icon="i-heroicons-megaphone">
            Ver Vagas
          </UButton>
          <UButton to="/rh/curriculos" color="gray" variant="ghost" icon="i-heroicons-document-text">
            Ver Currículos
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Seção de Atalhos -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <UIcon name="i-heroicons-map-pin" class="text-2xl text-blue-600 dark:text-blue-400" />
          </div>
          <div class="flex-1">
            <p class="text-sm text-gray-500">Cadastros</p>
            <p class="text-lg font-semibold">Regionais</p>
          </div>
          <UButton to="/cadastros/regionais" icon="i-heroicons-arrow-right" size="sm" color="gray" variant="ghost" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
            <UIcon name="i-heroicons-users" class="text-2xl text-green-600 dark:text-green-400" />
          </div>
          <div class="flex-1">
            <p class="text-sm text-gray-500">Cadastros</p>
            <p class="text-lg font-semibold">Funcionários</p>
          </div>
          <UButton to="/funcionarios" icon="i-heroicons-arrow-right" size="sm" color="gray" variant="ghost" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <UIcon name="i-heroicons-building-storefront" class="text-2xl text-purple-600 dark:text-purple-400" />
          </div>
          <div class="flex-1">
            <p class="text-sm text-gray-500">Cadastros</p>
            <p class="text-lg font-semibold">Lojas</p>
          </div>
          <UButton to="/lojas" icon="i-heroicons-arrow-right" size="sm" color="gray" variant="ghost" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-amber-100 dark:bg-amber-900 rounded-lg">
            <UIcon name="i-heroicons-megaphone" class="text-2xl text-amber-600 dark:text-amber-400" />
          </div>
          <div class="flex-1">
            <p class="text-sm text-gray-500">RH</p>
            <p class="text-lg font-semibold">Vagas</p>
          </div>
          <UButton to="/rh/vagas" icon="i-heroicons-arrow-right" size="sm" color="gray" variant="ghost" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-rose-100 dark:bg-rose-900 rounded-lg">
            <UIcon name="i-heroicons-document-text" class="text-2xl text-rose-600 dark:text-rose-400" />
          </div>
          <div class="flex-1">
            <p class="text-sm text-gray-500">RH</p>
            <p class="text-lg font-semibold">Currículos</p>
          </div>
          <UButton to="/rh/curriculos" icon="i-heroicons-arrow-right" size="sm" color="gray" variant="ghost" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
            <UIcon name="i-heroicons-folder-open" class="text-2xl text-cyan-600 dark:text-cyan-400" />
          </div>
          <div class="flex-1">
            <p class="text-sm text-gray-500">RH</p>
            <p class="text-lg font-semibold">Histórico de Alocações</p>
          </div>
          <UButton to="/rh/historico-alocacoes" icon="i-heroicons-arrow-right" size="sm" color="gray" variant="ghost" />
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup>
defineProps({
  // Futuras props podem ser adicionadas aqui
})
</script>
