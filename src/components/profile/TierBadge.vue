<script setup>
import { computed } from 'vue'
import { TIERS } from '@/config/gameRules'

// Figma: Lencana v3/A+ Garis fokus (komponen 176:245). Perhatian yang berserakan makin terkumpul:
// garis menebal tiap naik gelar, lencana duduk di wadah berwarna, hanya Jawara yang berbingkai.
// Teralihkan selalu abu. Gelar lain amber (Jawara biru) bila tercapai, abu bila belum.
const props = defineProps({
  tier: {
    type: String,
    required: true,
    validator: (value) => TIERS.some((tier) => tier.id === value),
  },
  achieved: { type: Boolean, default: true },
  // Sisi wadah dalam px. Simbol di dalamnya 75% dari sisi itu, seperti di Figma (24 di dalam 32).
  size: { type: Number, default: 20, validator: (value) => [20, 22, 24, 28, 32, 40, 56].includes(value) },
  // true: lencana berdiri sendiri dan perlu nama untuk pembaca layar.
  // false (bawaan): nama gelar sudah tertulis di sebelahnya.
  labelled: { type: Boolean, default: false },
})

const tierName = computed(() => TIERS.find((tier) => tier.id === props.tier)?.name ?? '')

const tone = computed(() => {
  if (props.tier === 'teralihkan') return 'neutral'
  if (!props.achieved) return 'locked'
  return props.tier === 'jawara' ? 'jawara' : 'achieved'
})

// Satu garis = [x1, y1, x2, y2] di kanvas 24 x 24
const GLYPHS = {
  teralihkan: {
    width: 2,
    lines: [
      [3.5, 6, 8, 4.6],
      [14, 4.2, 19.5, 6.4],
      [5.5, 12.8, 9.2, 11],
      [14.6, 12.4, 20, 13.8],
      [4.5, 19.2, 9.8, 17.8],
      [15, 19, 18.6, 20.4],
    ],
  },
  terjaga: {
    width: 2.5,
    lines: [
      [3.5, 6, 9, 6],
      [13, 6, 20.5, 6],
      [3.5, 12, 14, 12],
      [17.6, 12, 20.5, 12],
      [3.5, 18, 6.2, 18],
      [10, 18, 20.5, 18],
    ],
  },
  teguh: {
    width: 2.9,
    lines: [
      [3.5, 4.8, 20.5, 8.6],
      [3.5, 12, 20.5, 12],
      [3.5, 19.2, 20.5, 15.4],
    ],
  },
  tajam: {
    width: 3.3,
    lines: [
      [3.5, 4.8, 20, 12],
      [3.5, 12, 20, 12],
      [3.5, 19.2, 20, 12],
    ],
  },
  jawara: {
    width: 3.3,
    lines: [
      [3.2, 4.8, 13.4, 12],
      [3.2, 12, 13.4, 12],
      [3.2, 19.2, 13.4, 12],
    ],
    dot: [18.2, 12, 3.6],
  },
}

const glyph = computed(() => GLYPHS[props.tier])
const glyphSize = computed(() => props.size * 0.75)
</script>

<template>
  <span
    class="tier-badge"
    :class="`tier-badge--${tone}`"
    :style="{ '--tier-badge-size': `${size}px` }"
    :role="labelled ? 'img' : undefined"
    :aria-label="labelled ? `Gelar ${tierName}` : undefined"
    :aria-hidden="labelled ? undefined : 'true'"
  >
    <svg :width="glyphSize" :height="glyphSize" viewBox="0 0 24 24" fill="none" focusable="false">
      <path
        v-for="(line, index) in glyph.lines"
        :key="index"
        :d="`M${line[0]} ${line[1]}L${line[2]} ${line[3]}`"
        stroke="currentColor"
        :stroke-width="glyph.width"
        stroke-linecap="round"
      />
      <circle v-if="glyph.dot" :cx="glyph.dot[0]" :cy="glyph.dot[1]" :r="glyph.dot[2]" fill="currentColor" />
    </svg>
  </span>
</template>

<style scoped>
.tier-badge {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: var(--tier-badge-size);
  height: var(--tier-badge-size);
  border-radius: calc(var(--tier-badge-size) * 0.3);
}

.tier-badge--neutral {
  background-color: var(--bg-pressed);
  color: var(--text-secondary);
}

.tier-badge--achieved {
  background-color: var(--accent-amber-tint);
  color: var(--accent-amber);
}

.tier-badge--locked {
  background-color: var(--bg-elevated);
  color: var(--line-input);
}

/* Puncak tangga: satu-satunya lencana berbingkai */
.tier-badge--jawara {
  background-color: color-mix(in srgb, var(--accent-jawara) 16%, transparent);
  box-shadow: inset 0 0 0 max(1px, calc(var(--tier-badge-size) * 0.0375)) var(--accent-jawara);
  color: var(--accent-jawara);
}
</style>
