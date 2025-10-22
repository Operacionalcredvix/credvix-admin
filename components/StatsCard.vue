<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon :name="icon" class="text-xl" :class="[colorClass]" />
        <h3 class="font-semibold">{{ title }}</h3>
      </div>
    </template>
    <p class="text-2xl font-bold text-center" :class="[colorClass]">{{ value }}</p>
  </UCard>
</template>

<script setup lang="ts">
defineProps({
  title: { type: String, required: true },
  value: { type: [String, Number], required: true },
  icon: { type: String, required: true },
  colorClass: {
    type: String,
    default: 'text-gray-900 dark:text-white'
  }
})
</script>