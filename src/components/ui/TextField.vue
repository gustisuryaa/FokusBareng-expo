<script setup>
import { computed, ref, useId } from 'vue'

// Figma: Komponen v2 > Input/Teks (126:119)
defineOptions({ inheritAttrs: false })

const model = defineModel({ type: String, default: '' })

const props = defineProps({
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
})

const id = useId()
const input = ref(null)

const describedBy = computed(() => {
  const ids = []
  if (props.error) ids.push(`${id}-error`)
  else if (props.hint) ids.push(`${id}-hint`)
  return ids.join(' ') || undefined
})

defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <div
    class="text-field"
    :class="{ 'text-field--error': error, 'text-field--disabled': disabled, 'text-field--trailing': $slots.trailing }"
  >
    <label :for="id" class="text-field__label body-14-semibold">{{ label }}</label>
    <div class="text-field__control">
      <!-- $attrs (name, autocomplete, placeholder, maxlength, dll.) diteruskan ke input -->
      <input
        :id="id"
        ref="input"
        v-model="model"
        v-bind="$attrs"
        :type="type"
        :disabled="disabled"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="describedBy"
        class="text-field__input body-16-regular"
      />
      <slot name="trailing" />
    </div>
    <p v-if="error" :id="`${id}-error`" class="text-field__message text-field__message--error caption-13-semibold">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="`${id}-hint`" class="text-field__message caption-13-regular">
      {{ hint }}
    </p>
  </div>
</template>

<style scoped>
.text-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  width: 100%;
}

.text-field__label {
  color: var(--text-primary);
}

.text-field__control {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  height: var(--control-md);
  padding-inline: var(--space-20);
  background-color: var(--bg-surface);
  border: var(--line-width) solid var(--line-input);
  border-radius: var(--radius-16);
  transition: border-color var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) var(--ease-out);
}

.text-field--trailing .text-field__control {
  padding-right: var(--space-8);
}

/* Aktif: garis amber 2 px. Garis 1 px + bayangan dalam 1 px supaya ukuran tidak bergeser. */
.text-field__control:focus-within {
  border-color: var(--accent-amber);
  box-shadow: inset 0 0 0 var(--line-width) var(--accent-amber);
}

.text-field__input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0;
  background: transparent;
  border: 0;
  outline: none;
  color: var(--text-primary);
}

.text-field__input::placeholder {
  color: var(--text-secondary);
  opacity: 1;
}

.text-field__message {
  color: var(--text-secondary);
}

.text-field__message--error {
  color: var(--status-danger);
}

.text-field--error .text-field__control {
  border-color: var(--status-danger-line);
}

.text-field--error .text-field__control:focus-within {
  box-shadow: inset 0 0 0 var(--line-width) var(--status-danger-line);
}

.text-field--disabled .text-field__label,
.text-field--disabled .text-field__input,
.text-field--disabled .text-field__input::placeholder {
  color: var(--text-disabled);
}

.text-field--disabled .text-field__control {
  border-color: var(--bg-pressed);
}

.text-field--disabled .text-field__input {
  cursor: not-allowed;
}
</style>
