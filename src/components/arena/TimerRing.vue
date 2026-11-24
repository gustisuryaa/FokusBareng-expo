<script setup>
// Figma: Ring timer Arena (M03 310 px, D03 480 px). Lingkaran penuh sebagai jalur,
// busur amber = sisa waktu, dimulai dari atas searah jarum jam.
import { computed } from 'vue'

const props = defineProps({
  remainingMs: { type: Number, required: true },
  totalMs: { type: Number, required: true },
  // Belajar Mandiri memakai "FOKUS" (amber) dan "ISTIRAHAT" (hijau), M12 dan M13
  label: { type: String, default: 'SISA WAKTU' },
  tone: { type: String, default: 'neutral', validator: (value) => ['neutral', 'focus', 'break'].includes(value) },
})

const fraction = computed(() => (props.totalMs > 0 ? Math.min(1, Math.max(0, props.remainingMs / props.totalMs)) : 0))
const clock = computed(() => {
  const seconds = Math.ceil(props.remainingMs / 1000)
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
})
</script>

<template>
  <div class="timer-ring" :class="`timer-ring--${tone}`">
    <svg class="timer-ring__svg" viewBox="0 0 310 310" fill="none" aria-hidden="true" focusable="false">
      <circle cx="155" cy="155" r="150" class="timer-ring__track" stroke-width="10" />
      <circle
        v-if="fraction > 0"
        cx="155"
        cy="155"
        r="150"
        class="timer-ring__progress"
        stroke-width="10"
        stroke-linecap="round"
        pathLength="100"
        :stroke-dasharray="`${fraction * 100} 100`"
        transform="rotate(-90 155 155)"
      />
    </svg>
    <div class="timer-ring__center">
      <span class="label-12 timer-ring__label">{{ label }}</span>
      <!-- Pembaca layar mendapat sisa waktu lewat role="timer" tanpa diumumkan tiap detik -->
      <span class="angka-timer-m d-angka-timer-l" role="timer" aria-live="off">{{ clock }}</span>
      <span class="body-14-regular d-body-16-regular timer-ring__muted"><slot /></span>
    </div>
  </div>
</template>

<style scoped>
.timer-ring {
  position: relative;
  /* Menyusut di layar pendek supaya Arena tidak perlu scroll */
  width: min(var(--ring-timer-m), 42dvh);
  aspect-ratio: 1;
}

.timer-ring__svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.timer-ring__track {
  stroke: var(--bg-pressed);
}

.timer-ring__progress {
  stroke: var(--accent-amber);
}

.timer-ring__center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  color: var(--text-primary);
}

.timer-ring__muted,
.timer-ring__label {
  color: var(--text-secondary);
}

.timer-ring--focus .timer-ring__label {
  color: var(--accent-amber);
}

.timer-ring--break .timer-ring__label {
  color: var(--status-success);
}

.timer-ring--break .timer-ring__progress {
  stroke: var(--status-success);
}

@media (min-width: 1024px) {
  .timer-ring {
    width: min(var(--ring-timer-d), 52dvh, 100%);
  }

  .timer-ring__center {
    gap: var(--space-8);
  }
}
</style>
