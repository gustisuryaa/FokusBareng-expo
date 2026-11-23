<script setup>
import { ref } from 'vue'
import TextField from './TextField.vue'

// Figma: Komponen v2 > Input/Kata sandi (125:20)
defineOptions({ inheritAttrs: false })

const model = defineModel({ type: String, default: '' })

defineProps({
  label: { type: String, default: 'Kata sandi' },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
})

const visible = ref(false)
</script>

<template>
  <TextField
    v-model="model"
    v-bind="$attrs"
    :label="label"
    :error="error"
    :hint="hint"
    :disabled="disabled"
    :type="visible ? 'text' : 'password'"
  >
    <template #trailing>
      <button
        type="button"
        class="password-toggle"
        aria-label="Tampilkan kata sandi"
        :aria-pressed="visible"
        :disabled="disabled"
        @click="visible = !visible"
      >
        <svg v-if="!visible" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M1.71835 10.2901C1.6489 10.103 1.6489 9.89715 1.71835 9.71006C2.39476 8.06993 3.54294 6.66759 5.01732 5.6808C6.4917 4.69402 8.22588 4.16724 10 4.16724C11.7741 4.16724 13.5083 4.69402 14.9827 5.6808C16.4571 6.66759 17.6053 8.06993 18.2817 9.71006C18.3511 9.89715 18.3511 10.103 18.2817 10.2901C17.6053 11.9302 16.4571 13.3325 14.9827 14.3193C13.5083 15.3061 11.7741 15.8329 10 15.8329C8.22588 15.8329 6.4917 15.3061 5.01732 14.3193C3.54294 13.3325 2.39476 11.9302 1.71835 10.2901Z"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          />
          <path
            d="M12.5 10C12.5 11.3807 11.3807 12.5 10 12.5C8.61929 12.5 7.5 11.3807 7.5 10C7.5 8.61929 8.61929 7.5 10 7.5C11.3807 7.5 12.5 8.61929 12.5 10Z"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          />
        </svg>
        <svg v-else width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M1.66669 9.99996C1.66669 9.99996 4.58335 4.16663 10 4.16663C15.4167 4.16663 18.3334 9.99996 18.3334 9.99996C18.3334 9.99996 15.4167 15.8333 10 15.8333C4.58335 15.8333 1.66669 9.99996 1.66669 9.99996Z"
            stroke="currentColor" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"
          />
          <path d="M12.5 10C12.5 11.3807 11.3807 12.5 10 12.5C8.61929 12.5 7.5 11.3807 7.5 10C7.5 8.61929 8.61929 7.5 10 7.5C11.3807 7.5 12.5 8.61929 12.5 10Z" stroke="currentColor" stroke-width="1.66667" />
          <path d="M3.33331 3.33337L16.6666 16.6667" stroke="currentColor" stroke-width="1.66667" stroke-linecap="round" />
        </svg>
      </button>
    </template>
  </TextField>
</template>

<style scoped>
.password-toggle {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: var(--tap-min);
  height: var(--tap-min);
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: var(--radius-pill);
  color: var(--text-secondary);
  transition: color var(--motion-fast) var(--ease-out), background-color var(--motion-fast) var(--ease-out);
}

.password-toggle:disabled {
  color: var(--text-disabled);
  cursor: not-allowed;
}

@media (hover: hover) {
  .password-toggle:not(:disabled):hover {
    color: var(--text-primary);
    background-color: var(--bg-elevated);
  }
}
</style>
