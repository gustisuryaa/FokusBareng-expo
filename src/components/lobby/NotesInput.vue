<script setup>
// Figma: Textarea/Notes (sheet M02n 96:228, panel desktop D02 96:1092)
import { computed } from 'vue'
import { getRules } from '@/config/gameRules'

const model = defineModel({ type: String, default: '' })

const props = defineProps({
  id: { type: String, required: true },
  labelledby: { type: String, required: true },
  disabled: { type: Boolean, default: false },
  // Teks bantu kiri bawah, misalnya "Lawan baru bisa membaca setelah hasil keluar."
  hint: { type: String, default: '' },
  showCounter: { type: Boolean, default: true },
})
defineEmits(['blur'])

const maxLength = getRules().notes.maxLength
const counter = computed(() => `${model.value.length}/${maxLength}`)
</script>

<template>
  <div class="notes-input">
    <textarea
      :id="id"
      v-model="model"
      class="notes-input__field body-16-regular"
      :aria-labelledby="labelledby"
      :aria-describedby="`${id}-meta`"
      :maxlength="maxLength"
      :disabled="disabled"
      placeholder="Tulis tantangan untuk yang kalah, misalnya traktir es teh."
      @blur="$emit('blur')"
    />
    <div v-if="hint || showCounter" :id="`${id}-meta`" class="notes-input__meta caption-13-regular">
      <span>{{ hint }}</span>
      <span v-if="showCounter" aria-live="polite">{{ counter }}</span>
    </div>
  </div>
</template>

<style scoped>
.notes-input {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.notes-input__field {
  width: 100%;
  min-height: var(--notes-height-m);
  padding: var(--space-20);
  background-color: var(--bg-base);
  border: var(--line-width) solid var(--line-input);
  border-radius: var(--radius-20);
  color: var(--text-primary);
  resize: none;
  transition: border-color var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) var(--ease-out);
}

.notes-input__field::placeholder {
  color: var(--text-secondary);
}

.notes-input__field:focus-visible,
.notes-input__field:focus {
  outline: none;
  border-color: var(--accent-amber);
  box-shadow: inset 0 0 0 var(--line-width) var(--accent-amber);
}

.notes-input__field:disabled {
  border-color: var(--bg-pressed);
  color: var(--text-disabled);
}

.notes-input__meta {
  display: flex;
  justify-content: space-between;
  gap: var(--space-12);
  color: var(--text-secondary);
}

@media (min-width: 1024px) {
  .notes-input__field {
    min-height: var(--notes-height-d);
    background-color: var(--bg-surface);
  }
}
</style>
