<script setup>
defineProps({
  mode: { type: String, required: true },
})
</script>

<template>
  <main class="placeholder">
    <p class="label-12">{{ mode === 'register' ? 'Daftar' : 'Masuk' }}</p>
    <h1 class="heading-24">AuthView</h1>
  </main>
</template>

<style scoped>
.placeholder {
  display: grid;
  gap: var(--space-8);
  padding: var(--space-24) var(--space-16);
  color: var(--text-secondary);
}
</style>
