<script setup>
// Figma: Komponen v2 > Radiogroup/Durasi (mobile 132:191, desktop 132:245).
// Satu komponen: daftar baris di ponsel dan tablet, segmented pil di desktop (>= 1024 px).
const model = defineModel({ type: [String, Number], required: true })

const props = defineProps({
  // [{ value, label, hint?, recommended? }]
  options: { type: Array, required: true },
  label: { type: String, required: true },
  disabled: { type: Boolean, default: false },
})

// Elemen tombol per opsi, untuk memindah fokus saat tombol panah ditekan
const optionEls = []

function isChecked(option) {
  return option.value === model.value
}

// Roving tabindex: hanya opsi terpilih (atau opsi pertama) yang masuk urutan Tab
function tabIndexFor(option, index) {
  const hasChecked = props.options.some(isChecked)
  const isTabStop = hasChecked ? isChecked(option) : index === 0
  return isTabStop ? 0 : -1
}

function select(index) {
  if (props.disabled) return
  model.value = props.options[index].value
  optionEls[index]?.focus()
}

function onKeydown(event, index) {
  const last = props.options.length - 1
  let next

  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      next = index === last ? 0 : index + 1
      break
    case 'ArrowUp':
    case 'ArrowLeft':
      next = index === 0 ? last : index - 1
      break
    case 'Home':
      next = 0
      break
    case 'End':
      next = last
      break
    default:
      return
  }

  event.preventDefault()
  select(next)
}
</script>

<template>
  <div
    class="radio-group"
    :class="{ 'radio-group--disabled': disabled }"
    role="radiogroup"
    :aria-label="label"
    :aria-disabled="disabled ? 'true' : undefined"
  >
    <button
      v-for="(option, index) in options"
      :key="option.value"
      :ref="(el) => { optionEls[index] = el }"
      type="button"
      role="radio"
      class="radio-group__option"
      :class="{ 'radio-group__option--checked': isChecked(option) }"
      :aria-checked="isChecked(option) ? 'true' : 'false'"
      :tabindex="tabIndexFor(option, index)"
      :disabled="disabled"
      @click="select(index)"
      @keydown="onKeydown($event, index)"
    >
      <svg class="radio-group__mark" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 5.85786 5.85786 2.5 10 2.5C14.1421 2.5 17.5 5.85786 17.5 10Z"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        />
        <path
          v-if="isChecked(option)"
          d="M10 13.3333C11.841 13.3333 13.3333 11.8409 13.3333 9.99996C13.3333 8.15901 11.841 6.66663 10 6.66663C8.15905 6.66663 6.66667 8.15901 6.66667 9.99996C6.66667 11.8409 8.15905 13.3333 10 13.3333Z"
          fill="currentColor"
        />
      </svg>
      <span
        class="radio-group__label"
        :class="isChecked(option) || option.recommended ? 'body-16-bold' : 'body-16-semibold'"
      >
        {{ option.label }}
      </span>
      <span v-if="option.hint" class="radio-group__hint caption-13-regular">{{ option.hint }}</span>
    </button>
  </div>
</template>

<style scoped>
/* Ponsel dan tablet: daftar baris di latar base */
.radio-group {
  display: flex;
  flex-direction: column;
  padding-inline: var(--space-16);
  background-color: var(--bg-base);
  border-radius: var(--radius-20);
  overflow: hidden;
}

.radio-group__option {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  width: 100%;
  min-height: var(--control-row);
  padding: 0;
  background: transparent;
  border: 0;
  color: var(--text-primary);
  text-align: left;
  -webkit-tap-highlight-color: transparent;
}

.radio-group__option + .radio-group__option {
  border-top: var(--line-width) solid var(--bg-pressed);
}

/* Cincin fokus di dalam baris karena wadah memotong isi (overflow: hidden) */
.radio-group__option:focus-visible {
  outline-offset: calc(var(--focus-ring-width) * -1);
  border-radius: var(--radius-16);
}

.radio-group__mark {
  flex-shrink: 0;
  color: var(--line-input);
}

.radio-group__option--checked .radio-group__mark {
  color: var(--accent-amber);
}

.radio-group__label {
  flex: 1;
  min-width: 0;
}

.radio-group__hint {
  flex-shrink: 0;
  color: var(--text-secondary);
}

.radio-group--disabled .radio-group__option {
  color: var(--text-disabled);
  cursor: not-allowed;
}

.radio-group--disabled .radio-group__mark,
.radio-group--disabled .radio-group__hint {
  color: var(--text-disabled);
}

/* Desktop: segmented pil, opsi terpilih berlatar amber */
@media (min-width: 1024px) {
  .radio-group {
    flex-direction: row;
    gap: var(--space-4);
    padding: var(--space-8);
    background-color: var(--bg-surface);
    border-radius: var(--radius-pill);
  }

  .radio-group__option {
    flex: 1;
    justify-content: center;
    min-height: var(--control-sm);
    border-radius: var(--radius-pill);
    transition: background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out);
  }

  .radio-group__option + .radio-group__option {
    border-top: 0;
  }

  .radio-group__option:focus-visible {
    outline-offset: var(--focus-ring-offset);
    border-radius: var(--radius-pill);
  }

  .radio-group__mark,
  .radio-group__hint {
    display: none;
  }

  .radio-group__label {
    flex: 0 1 auto;
  }

  .radio-group__option--checked {
    background-color: var(--accent-amber);
    color: var(--text-on-accent);
  }

  .radio-group--disabled .radio-group__option--checked {
    background-color: var(--bg-elevated);
    color: var(--text-disabled);
  }
}

@media (min-width: 1024px) and (hover: hover) {
  .radio-group:not(.radio-group--disabled) .radio-group__option:not(.radio-group__option--checked):hover {
    background-color: var(--bg-elevated);
  }
}
</style>
