<template>
  <div>
    <slot />
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth'
});
</script>