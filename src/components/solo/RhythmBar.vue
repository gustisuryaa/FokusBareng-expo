<script setup>
// Figma: Ritme teknik (kartu M11/D07) dan Ritme sesi (M12, M13, D08).
// Lebar tiap bagian sebanding dengan durasinya. Tanpa penanda = pratinjau rencana.
import { computed } from 'vue'

const props = defineProps({
  // [{ kind: 'focus' | 'break', ms, state?: 'done' | 'current' | 'future' }]
  items: { type: Array, required: true },
  // Pratinjau: fokus amber bila teknik dipilih, abu-abu bila tidak
  highlight: { type: Boolean, default: false },
  // Posisi sekarang 0..1 sepanjang sesi, null untuk pratinjau
  marker: { type: Number, default: null },
})

function toneOf(item) {
  if (props.marker === null) return item.kind === 'focus' ? (props.highlight ? 'focus' : 'idle') : 'gap'
  if (item.state === 'future') return item.kind === 'focus' ? 'future' : 'gap'
  return item.kind
}

const markerLeft = computed(() => `${Math.min(1, Math.max(0, props.marker ?? 0)) * 100}%`)
</script>

<template>
  <div class="rhythm" :class="{ 'rhythm--session': marker !== null }" aria-hidden="true">
    <div class="rhythm__track">
      <span
        v-for="(item, index) in items"
        :key="index"
        class="rhythm__part"
        :class="`rhythm__part--${toneOf(item)}`"
        :style="{ flexGrow: item.ms }"
      />
    </div>
    <span v-if="marker !== null" class="rhythm__marker" :style="{ left: markerLeft }" />
  </div>
</template>

<style scoped>
.rhythm {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.rhythm--session {
  height: var(--rhythm-marker-height);
}

.rhythm__track {
  display: flex;
  gap: var(--space-4);
  width: 100%;
  height: var(--rhythm-height);
}

.rhythm__part {
  flex-basis: 0;
  min-width: var(--space-4);
  border-radius: var(--radius-pill);
}

.rhythm__part--focus {
  background-color: var(--accent-amber);
}

.rhythm__part--break {
  background-color: var(--status-success);
}

.rhythm__part--idle {
  background-color: var(--line-input);
}

.rhythm__part--future {
  background-color: var(--line-subtle);
}

.rhythm__part--gap {
  background-color: var(--bg-pressed);
}

.rhythm__marker {
  position: absolute;
  top: 0;
  width: var(--focus-ring-width);
  height: 100%;
  background-color: var(--text-primary);
  border-radius: var(--radius-pill);
  transform: translateX(-50%);
}
</style>
