<script setup>
import AppIcon from '@/components/ui/AppIcon.vue'
import { roomTag } from '@/lib/roomLabel'

// Figma: Status/Undangan (M08 38:140, D16)
defineProps({
  roomId: { type: String, required: true },
})
</script>

<template>
  <div class="invite-banner" role="status">
    <AppIcon name="link" class="invite-banner__icon" />
    <div class="invite-banner__text">
      <p class="body-16-bold invite-banner__title">Kamu diundang ke Room {{ roomTag(roomId) }}</p>
      <p class="caption-13-regular">Masuk dulu, lalu kamu langsung ke lobi.</p>
    </div>
  </div>
</template>

<style scoped>
.invite-banner {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  width: 100%;
  padding: var(--space-16);
  background-color: var(--accent-amber-tint);
  border-radius: var(--radius-20);
  color: var(--text-primary);
}

.invite-banner__icon,
.invite-banner__title {
  color: var(--accent-amber);
}

.invite-banner__text {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
}
</style>
