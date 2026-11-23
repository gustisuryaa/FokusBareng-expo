<script setup>
// Figma: Jejak Check-In (6.13 di design md; M03 135:422, D03c 39:757).
// Jalur sepanjang battle, isi abu = waktu berlalu, penanda hijau = dijawab berdua,
// merah = ada yang melewatkan, titik amber = posisi sekarang.
import { computed } from 'vue'

const props = defineProps({
  startedAt: { type: Number, required: true },
  endAt: { type: Number, required: true },
  now: { type: Number, required: true },
  // [{ index, openAt, state: 'both' | 'missed' }] hanya Check-In yang sudah lewat
  marks: { type: Array, required: true },
  summary: { type: String, required: true },
  summaryTone: { type: String, default: 'success', validator: (value) => ['success', 'danger', 'muted'].includes(value) },
  totalLabel: { type: String, required: true },
})

const span = computed(() => Math.max(1, props.endAt - props.startedAt))
const percent = (time) => `${Math.min(100, Math.max(0, ((time - props.startedAt) / span.value) * 100))}%`
</script>

<template>
  <section class="trail" aria-labelledby="trail-title">
    <div class="trail__head">
      <h2 id="trail-title" class="label-12 trail__muted">JEJAK CHECK-IN</h2>
      <p class="caption-13-semibold d-body-14-semibold" :class="`trail__summary--${summaryTone}`">{{ summary }}</p>
    </div>
    <div class="trail__track" aria-hidden="true">
      <span class="trail__elapsed" :style="{ width: percent(now) }" />
      <span
        v-for="mark in marks"
        :key="mark.index"
        class="trail__tick"
        :class="`trail__tick--${mark.state}`"
        :style="{ left: percent(mark.openAt) }"
      />
      <span class="trail__now" :style="{ left: percent(now) }" />
    </div>
    <div class="trail__foot caption-12-semibold trail__muted">
      <span class="label-12">MULAI</span>
      <span>{{ totalLabel }}</span>
    </div>
  </section>
</template>

<style scoped>
.trail {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  width: 100%;
  padding: var(--space-20);
  background-color: var(--bg-surface);
  border-radius: var(--radius-24);
}

.trail__head,
.trail__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.trail__muted {
  color: var(--text-secondary);
}

.trail__summary--success {
  color: var(--status-success);
}

.trail__summary--danger {
  color: var(--status-danger);
}

.trail__summary--muted {
  color: var(--text-secondary);
}

.trail__track {
  position: relative;
  height: var(--space-24);
}

.trail__track::before,
.trail__elapsed {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  height: var(--space-4);
  border-radius: var(--radius-pill);
  transform: translateY(-50%);
}

.trail__track::before {
  right: 0;
  background-color: var(--bg-pressed);
}

.trail__elapsed {
  background-color: var(--line-input);
}

.trail__tick {
  position: absolute;
  top: 50%;
  width: var(--trail-tick-w);
  height: var(--trail-tick-h);
  border-radius: var(--radius-pill);
  transform: translate(-50%, -50%);
}

.trail__tick--both {
  background-color: var(--status-success);
}

.trail__tick--missed {
  background-color: var(--status-danger);
}

.trail__now {
  position: absolute;
  top: 50%;
  width: var(--space-12);
  height: var(--space-12);
  background-color: var(--accent-amber);
  border-radius: var(--radius-pill);
  transform: translate(-50%, -50%);
}

@media (min-width: 1024px) {
  .trail {
    padding: var(--space-24) var(--space-32);
    border-radius: var(--radius-28);
  }
}
</style>
