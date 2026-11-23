<script setup>
import { computed } from 'vue'
import { TIERS } from '@/config/gameRules'

// Figma: Tier/teralih, Tier/terjaga, Tier/teguh, Tier/tajam, Tier/jawara (sheet Tangga gelar 133:288).
// Warna mengikuti pemakaian di Redesign v2:
// Teralihkan selalu abu sekunder, Jawara selalu biru,
// Terjaga/Teguh/Tajam amber bila sudah tercapai dan abu garis bila belum.
const props = defineProps({
  tier: {
    type: String,
    required: true,
    validator: (value) => TIERS.some((tier) => tier.id === value),
  },
  achieved: { type: Boolean, default: true },
  // Ukuran yang dipakai di Figma: 14, 16, 20, 22, 28
  size: { type: Number, default: 20, validator: (value) => [14, 16, 20, 22, 28].includes(value) },
  // true: lencana berdiri sendiri dan perlu nama untuk pembaca layar.
  // false (bawaan): nama gelar sudah tertulis di sebelahnya.
  labelled: { type: Boolean, default: false },
})

const tierName = computed(() => TIERS.find((tier) => tier.id === props.tier)?.name ?? '')

const tone = computed(() => {
  if (props.tier === 'teralihkan') return 'neutral'
  if (props.tier === 'jawara') return 'jawara'
  return props.achieved ? 'achieved' : 'locked'
})
</script>

<template>
  <svg
    class="tier-badge"
    :class="`tier-badge--${tone}`"
    :width="size"
    :height="size"
    viewBox="0 0 20 20"
    fill="none"
    focusable="false"
    :role="labelled ? 'img' : undefined"
    :aria-label="labelled ? `Gelar ${tierName}` : undefined"
    :aria-hidden="labelled ? undefined : 'true'"
  >
    <!-- Teralihkan: lingkaran putus-putus -->
    <path
      v-if="tier === 'teralihkan'"
      d="M18.3382 8.34112C18.4444 8.87765 18.5 9.43232 18.5 10C18.5 10.5677 18.4444 11.1224 18.3382 11.6589M17.0683 5.27727C16.4477 4.35033 15.6497 3.55226 14.7227 2.93169M11.6589 1.66179C11.1224 1.55565 10.5677 1.5 10 1.5C9.43232 1.5 8.87765 1.55565 8.34112 1.66179M5.27727 2.93169C4.35033 3.55226 3.55226 4.35033 2.93169 5.27727M1.66179 8.34112C1.55565 8.87765 1.5 9.43232 1.5 10C1.5 10.5677 1.55565 11.1224 1.66179 11.6589M2.93169 14.7227C3.55226 15.6497 4.35033 16.4477 5.27727 17.0683M8.34112 18.3382C8.87765 18.4444 9.43232 18.5 10 18.5C10.5677 18.5 11.1224 18.4444 11.6589 18.3382M14.7227 17.0683C15.6497 16.4477 16.4477 15.6497 17.0683 14.7227"
      stroke="currentColor"
      stroke-width="2"
    />
    <!-- Terjaga: cincin dengan titik -->
    <template v-else-if="tier === 'terjaga'">
      <path
        d="M18.5 10C18.5 14.6944 14.6944 18.5 10 18.5C5.30558 18.5 1.5 14.6944 1.5 10C1.5 5.30558 5.30558 1.5 10 1.5C14.6944 1.5 18.5 5.30558 18.5 10Z"
        stroke="currentColor"
        stroke-width="2"
      />
      <path
        d="M10 13.5984C11.9882 13.5984 13.6 11.9867 13.6 9.99844C13.6 8.01021 11.9882 6.39844 10 6.39844C8.01178 6.39844 6.4 8.01021 6.4 9.99844C6.4 11.9867 8.01178 13.5984 10 13.5984Z"
        fill="currentColor"
      />
    </template>
    <!-- Teguh: segi enam -->
    <path
      v-else-if="tier === 'teguh'"
      d="M10 1.5L18 5.4V14.6L10 18.5L2 14.6V5.4L10 1.5Z"
      stroke="currentColor"
      stroke-width="2"
      stroke-linejoin="round"
    />
    <!-- Tajam: belah ketupat bergaris dalam -->
    <template v-else-if="tier === 'tajam'">
      <path d="M10 1.5L18.5 10L10 18.5L1.5 10L10 1.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
      <path d="M10 6L14 10L10 14L6 10L10 6Z" stroke="currentColor" stroke-width="1.5" />
    </template>
    <!-- Jawara: perisai bertingkat -->
    <template v-else>
      <path
        d="M10 1.5L18 4V10C18 15 10 18.5 10 18.5C10 18.5 2 15 2 10V4L10 1.5Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <path d="M6 9L10 12L14 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    </template>
  </svg>
</template>

<style scoped>
.tier-badge {
  flex-shrink: 0;
  overflow: hidden;
}

.tier-badge--neutral {
  color: var(--text-secondary);
}

.tier-badge--achieved {
  color: var(--accent-amber);
}

.tier-badge--locked {
  color: var(--line-input);
}

.tier-badge--jawara {
  color: var(--accent-jawara);
}
</style>
