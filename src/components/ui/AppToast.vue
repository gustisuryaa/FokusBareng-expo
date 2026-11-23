<script setup>
import { toastState } from '@/composables/useToast'

// Figma: Toast (125:236), contoh "Tautan disalin". Dipasang sekali di App.vue.
</script>

<template>
  <!-- Wilayah live selalu ada di DOM supaya pembaca layar mengumumkan pesan baru -->
  <div class="toast-region" role="status" aria-live="polite" aria-atomic="true">
    <Transition name="toast">
      <p v-if="toastState.message" :key="toastState.id" class="toast body-14-semibold">
        {{ toastState.message }}
      </p>
    </Transition>
  </div>
</template>

<style scoped>
.toast-region {
  position: fixed;
  left: 50%;
  bottom: calc(var(--space-64) * 2 + env(safe-area-inset-bottom));
  z-index: var(--z-toast);
  transform: translateX(-50%);
  pointer-events: none;
}

.toast {
  padding: var(--space-12) var(--space-16);
  background-color: var(--bg-elevated);
  border: var(--line-width) solid var(--line-subtle);
  border-radius: var(--radius-12);
  color: var(--text-primary);
  white-space: nowrap;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity var(--motion-base) var(--ease-out);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
}
</style>
