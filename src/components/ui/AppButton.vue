<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

// Figma: Komponen v2 > Button (126:97)
const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary'].includes(value),
  },
  // md = 56 px (standar), lg = 64 px (aksi utama di dialog dan Arena)
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['md', 'lg'].includes(value),
  },
  danger: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  type: { type: String, default: 'button' },
  to: { type: [String, Object], default: null },
})

const isLink = computed(() => props.to !== null && !props.disabled)
</script>

<template>
  <RouterLink
    v-if="isLink"
    :to="to"
    class="app-button body-16-bold"
    :class="[`app-button--${variant}`, `app-button--${size}`, { 'app-button--danger': danger, 'app-button--block': block }]"
  >
    <slot />
  </RouterLink>
  <button
    v-else
    :type="type"
    :disabled="disabled"
    class="app-button body-16-bold"
    :class="[`app-button--${variant}`, `app-button--${size}`, { 'app-button--danger': danger, 'app-button--block': block }]"
  >
    <slot />
  </button>
</template>

<style scoped>
.app-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-8);
  height: var(--control-md);
  min-width: var(--tap-min);
  padding-inline: var(--space-24);
  border: var(--line-width) solid transparent;
  border-radius: var(--radius-pill);
  text-decoration: none;
  white-space: nowrap;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition:
    background-color var(--motion-fast) var(--ease-out),
    border-color var(--motion-fast) var(--ease-out),
    color var(--motion-fast) var(--ease-out);
}

.app-button--lg {
  height: var(--control-lg);
  padding-inline: var(--space-28);
}

.app-button--block {
  width: 100%;
}

/* Fokus: cincin 2 px warna teks utama di luar tombol (catatan state di Figma) */
.app-button:focus-visible {
  outline: var(--focus-ring-width) solid var(--text-primary);
  outline-offset: var(--focus-ring-offset);
}

.app-button--primary {
  background-color: var(--accent-amber);
  color: var(--text-on-accent);
}

.app-button--primary:active {
  background-color: var(--accent-amber-pressed);
}

.app-button--secondary {
  background-color: var(--bg-surface);
  border-color: var(--line-subtle);
  color: var(--text-primary);
}

.app-button--secondary:active {
  background-color: var(--bg-pressed);
  border-color: var(--line-input);
}

.app-button--danger {
  color: var(--status-danger);
}

/* Hover hanya untuk perangkat dengan pointer. Di HP yang terlihat adalah Pressed. */
@media (hover: hover) {
  .app-button--primary:not(:disabled):hover {
    background-color: var(--accent-amber-hover);
  }

  .app-button--primary:not(:disabled):active {
    background-color: var(--accent-amber-pressed);
  }

  .app-button--secondary:not(:disabled):hover {
    background-color: var(--bg-elevated);
    border-color: var(--line-input);
  }

  .app-button--secondary:not(:disabled):active {
    background-color: var(--bg-pressed);
  }
}

.app-button:disabled {
  cursor: not-allowed;
  color: var(--text-disabled);
}

.app-button--primary:disabled {
  background-color: var(--bg-elevated);
}

.app-button--secondary:disabled {
  background-color: var(--bg-surface);
  border-color: var(--bg-pressed);
}
</style>
