<script setup>
// Figma: Switch/Check-In acak (M11 47:99, D07 47:274), 52 x 32.
// Label dihubungkan lewat labelledby supaya seluruh baris pengaturan terbaca pembaca layar.
const model = defineModel({ type: Boolean, required: true })

defineProps({
  labelledby: { type: String, required: true },
  describedby: { type: String, default: undefined },
})
</script>

<template>
  <button
    type="button"
    role="switch"
    class="app-switch"
    :class="{ 'app-switch--on': model }"
    :aria-checked="model ? 'true' : 'false'"
    :aria-labelledby="labelledby"
    :aria-describedby="describedby"
    @click="model = !model"
  >
    <span class="app-switch__track" aria-hidden="true">
      <span class="app-switch__knob" />
    </span>
  </button>
</template>

<style scoped>
/* Area sentuh 44 px, tampilan track 52 x 32 */
.app-switch {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  min-width: var(--tap-min);
  min-height: var(--tap-min);
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: var(--radius-pill);
}

.app-switch__track {
  display: flex;
  align-items: center;
  width: var(--switch-width);
  height: var(--switch-height);
  padding: var(--space-4);
  background-color: var(--bg-pressed);
  border: var(--line-width) solid var(--line-input);
  border-radius: var(--radius-pill);
  transition: background-color var(--motion-fast) var(--ease-out);
}

.app-switch__knob {
  width: calc(var(--switch-height) - var(--space-8) - 2 * var(--line-width));
  aspect-ratio: 1;
  background-color: var(--text-secondary);
  border-radius: var(--radius-pill);
  transition: transform var(--motion-fast) var(--ease-out);
}

.app-switch--on .app-switch__track {
  background-color: var(--accent-amber);
  border-color: var(--accent-amber);
}

/* Status juga terbaca dari posisi bulatan, bukan hanya warna */
.app-switch--on .app-switch__knob {
  background-color: var(--text-on-accent);
  transform: translateX(calc(var(--switch-width) - var(--switch-height)));
}
</style>
