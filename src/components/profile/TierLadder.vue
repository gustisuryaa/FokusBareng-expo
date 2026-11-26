<script setup>
// Tangga gelar: list = sheet mobile (Figma 133:288), track = panel desktop dengan titik di satu garis (99:444).
import { TIERS } from '@/config/gameRules'
import TierBadge from './TierBadge.vue'

defineProps({
  currentId: { type: String, required: true },
  reachedIds: { type: Array, required: true },
  variant: { type: String, default: 'list', validator: (value) => ['list', 'track'].includes(value) },
})
</script>

<template>
  <ol v-if="variant === 'list'" class="ladder-list">
    <li
      v-for="tier in TIERS"
      :key="tier.id"
      class="ladder-list__row"
      :class="{ 'ladder-list__row--current': tier.id === currentId }"
      :aria-current="tier.id === currentId ? 'step' : undefined"
    >
      <TierBadge :tier="tier.id" :achieved="reachedIds.includes(tier.id)" />
      <span class="ladder-list__name" :class="tier.id === currentId ? 'body-16-semibold' : 'body-16-regular'">
        {{ tier.name }}
      </span>
      <span class="caption-13-regular ladder-list__points">{{ tier.minPoints }} poin</span>
    </li>
  </ol>

  <div v-else class="ladder-track">
    <div class="ladder-track__line" aria-hidden="true">
      <span
        v-for="tier in TIERS"
        :key="tier.id"
        class="ladder-track__dot"
        :class="reachedIds.includes(tier.id) ? `ladder-track__dot--${tier.id}` : ''"
      />
    </div>
    <ol class="ladder-track__labels">
      <li v-for="tier in TIERS" :key="tier.id" :aria-current="tier.id === currentId ? 'step' : undefined">
        <span class="ladder-track__name">
          <TierBadge :tier="tier.id" :achieved="reachedIds.includes(tier.id)" />
          <span class="body-16-semibold" :class="{ 'ladder-track__name--current': tier.id === currentId }">{{ tier.name }}</span>
        </span>
        <span class="caption-13-regular ladder-track__points">{{ tier.minPoints }} poin</span>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.ladder-list {
  display: flex;
  flex-direction: column;
  padding: 0;
  list-style: none;
  background-color: var(--bg-base);
  border-radius: var(--radius-20);
  overflow: hidden;
}

.ladder-list__row {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  min-height: var(--control-row);
  padding-inline: var(--space-16);
  border-radius: var(--radius-16);
  color: var(--text-primary);
}

.ladder-list__row--current {
  background-color: var(--accent-amber-tint);
}

.ladder-list__row--current .ladder-list__name {
  color: var(--accent-amber);
}

.ladder-list__name {
  flex: 1;
}

.ladder-list__points,
.ladder-track__points {
  color: var(--text-secondary);
}

.ladder-track {
  display: flex;
  flex-direction: column;
  gap: var(--space-20);
}

.ladder-track__line {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--space-12);
}

.ladder-track__line::before {
  content: '';
  position: absolute;
  inset-inline: 0;
  height: var(--space-4);
  background-color: var(--bg-pressed);
  border-radius: var(--radius-pill);
}

.ladder-track__dot {
  position: relative;
  width: var(--space-12);
  height: var(--space-12);
  background-color: var(--line-subtle);
  border-radius: var(--radius-pill);
}

.ladder-track__dot--teralihkan {
  background-color: var(--text-secondary);
}

.ladder-track__dot--terjaga,
.ladder-track__dot--teguh,
.ladder-track__dot--tajam {
  background-color: var(--accent-amber);
}

.ladder-track__dot--jawara {
  background-color: var(--accent-jawara);
}

.ladder-track__labels {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--space-8);
  padding: 0;
  list-style: none;
}

.ladder-track__labels li {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-8);
}

.ladder-track__labels li:first-child {
  align-items: flex-start;
}

.ladder-track__labels li:last-child {
  align-items: flex-end;
}

.ladder-track__name {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: inherit;
  gap: var(--space-4) var(--space-8);
  max-width: 100%;
  color: var(--text-secondary);
}

.ladder-track__labels li {
  min-width: 0;
  text-align: center;
}

.ladder-track__labels li:first-child {
  text-align: left;
}

.ladder-track__labels li:last-child {
  text-align: right;
}

.ladder-track__name--current {
  color: var(--text-primary);
}
</style>
