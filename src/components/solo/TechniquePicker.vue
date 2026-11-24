<script setup>
// Figma: Radiogroup/Teknik (mobile 132:298, desktop 132:465). Satu komponen untuk semua ukuran.
// Durasi Satu blok tidak ada di Figma: memakai RadioGroup durasi yang sama dengan Lobi.
import { computed } from 'vue'
import RadioGroup from '@/components/ui/RadioGroup.vue'
import RhythmBar from '@/components/solo/RhythmBar.vue'
import { SOLO_RULES } from '@/config/gameRules'
import { buildSegments, describeTechnique } from '@/domain/solo'

const techniqueId = defineModel({ type: String, required: true })
const blockMin = defineModel('blockMin', { type: Number, required: true })

const options = computed(() =>
  SOLO_RULES.techniques.map((technique) => ({
    ...technique,
    description: describeTechnique(technique),
    segments: buildSegments(technique, blockMin.value),
  })),
)

const blockOptions = SOLO_RULES.blockOptionsMin.map((minutes) => ({ value: minutes, label: `${minutes} menit` }))

// Roving tabindex, sama seperti RadioGroup
const optionEls = []

function select(index) {
  techniqueId.value = options.value[index].id
  optionEls[index]?.focus()
}

function onKeydown(event, index) {
  const last = options.value.length - 1
  const keys = { ArrowDown: index === last ? 0 : index + 1, ArrowRight: index === last ? 0 : index + 1, ArrowUp: index === 0 ? last : index - 1, ArrowLeft: index === 0 ? last : index - 1, Home: 0, End: last }
  if (!(event.key in keys)) return
  event.preventDefault()
  select(keys[event.key])
}
</script>

<template>
  <div class="technique" role="radiogroup" aria-label="Teknik belajar">
    <div v-for="(option, index) in options" :key="option.id" class="technique__item">
      <button
        :ref="(el) => { optionEls[index] = el }"
        type="button"
        role="radio"
        class="technique__option"
        :class="{ 'technique__option--checked': option.id === techniqueId }"
        :aria-checked="option.id === techniqueId ? 'true' : 'false'"
        :tabindex="option.id === techniqueId ? 0 : -1"
        @click="select(index)"
        @keydown="onKeydown($event, index)"
      >
        <span class="technique__head">
          <svg class="technique__mark" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 5.85786 5.85786 2.5 10 2.5C14.1421 2.5 17.5 5.85786 17.5 10Z"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            />
            <path
              v-if="option.id === techniqueId"
              d="M10 13.3333C11.841 13.3333 13.3333 11.8409 13.3333 9.99996C13.3333 8.15901 11.841 6.66663 10 6.66663C8.15905 6.66663 6.66667 8.15901 6.66667 9.99996C6.66667 11.8409 8.15905 13.3333 10 13.3333Z"
              fill="currentColor"
            />
          </svg>
          <span class="technique__text">
            <span class="body-16-bold">{{ option.name }}</span>
            <span class="caption-13-regular technique__muted">{{ option.description }}</span>
          </span>
        </span>
        <RhythmBar :items="option.segments" :highlight="option.id === techniqueId" />
      </button>

      <div v-if="option.focusMin === null && option.id === techniqueId" class="technique__block">
        <RadioGroup v-model="blockMin" :options="blockOptions" label="Durasi Satu blok" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.technique {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  width: 100%;
}

.technique__item {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.technique__option {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  width: 100%;
  padding: var(--space-16);
  background-color: var(--bg-surface);
  border: var(--line-width-strong) solid transparent;
  border-radius: var(--radius-20);
  color: var(--text-primary);
  text-align: left;
  -webkit-tap-highlight-color: transparent;
}

.technique__option--checked {
  background-color: var(--accent-amber-tint);
  border-color: var(--accent-amber);
}

.technique__head {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  width: 100%;
}

.technique__mark {
  flex-shrink: 0;
  color: var(--line-input);
}

.technique__option--checked .technique__mark {
  color: var(--accent-amber);
}

.technique__text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
}

.technique__muted {
  color: var(--text-secondary);
}

@media (hover: hover) {
  .technique__option:not(.technique__option--checked):hover {
    background-color: var(--bg-elevated);
  }
}
</style>
