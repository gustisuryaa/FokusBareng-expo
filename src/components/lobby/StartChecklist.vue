<script setup>
// Figma: Syarat mulai (M02 96:209, D02 96:1095)
import AppIcon from '@/components/ui/AppIcon.vue'

defineProps({
  // [{ label, done }]
  items: { type: Array, required: true },
})
</script>

<template>
  <ul class="start-checklist" aria-label="Syarat mulai">
    <li v-for="item in items" :key="item.label" class="start-checklist__item caption-13-regular d-body-16-regular">
      <AppIcon v-if="item.done" name="check" class="start-checklist__check" />
      <svg v-else class="start-checklist__circle" width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 5.85786 5.85786 2.5 10 2.5C14.1421 2.5 17.5 5.85786 17.5 10Z"
          stroke="currentColor"
          stroke-width="2"
        />
      </svg>
      <span>{{ item.label }}</span>
      <span class="visually-hidden">{{ item.done ? '(terpenuhi)' : '(belum)' }}</span>
    </li>
  </ul>
</template>

<style scoped>
.start-checklist {
  display: flex;
  justify-content: center;
  gap: var(--space-16);
  padding: 0;
  list-style: none;
}

.start-checklist__item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  color: var(--text-primary);
}

.start-checklist__check {
  color: var(--status-success);
}

.start-checklist__circle {
  color: var(--line-input);
}

@media (min-width: 1024px) {
  .start-checklist {
    justify-content: flex-start;
    gap: var(--space-20);
  }

  .start-checklist__item {
    gap: var(--space-8);
  }
}
</style>
