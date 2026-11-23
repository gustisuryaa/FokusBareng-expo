<script setup>
// Figma: Lobi gagal M26·D26 (tautan tidak berlaku) dan M27·D27 (room penuh)
import AppButton from '@/components/ui/AppButton.vue'

defineProps({
  label: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  // Aksi utama opsional, misalnya "Buat room sendiri"
  primaryLabel: { type: String, default: '' },
  busy: { type: Boolean, default: false },
})
defineEmits(['primary'])
</script>

<template>
  <div class="room-status">
    <p class="title-20 d-heading-24">FokusBareng</p>
    <main class="room-status__body">
      <p class="label-12 room-status__muted">{{ label }}</p>
      <h1 class="heading-28 d-heading-48">{{ title }}</h1>
      <p class="body-16-regular room-status__muted">{{ description }}</p>
    </main>
    <div class="room-status__actions">
      <AppButton v-if="primaryLabel" :disabled="busy" @click="$emit('primary')">{{ primaryLabel }}</AppButton>
      <AppButton variant="secondary" :to="{ name: 'dashboard' }">Ke Dasbor</AppButton>
    </div>
  </div>
</template>

<style scoped>
.room-status {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: var(--container-tablet);
  min-height: 100dvh;
  margin-inline: auto;
  padding: var(--space-56) var(--space-20) var(--space-28);
}

.room-status__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  gap: var(--space-8);
}

.room-status__muted {
  color: var(--text-secondary);
}

.room-status__actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

@media (min-width: 1024px) {
  .room-status {
    max-width: none;
    padding: var(--space-32) var(--space-40);
  }

  .room-status__body {
    align-items: center;
    max-width: var(--form-width);
    margin-inline: auto;
    text-align: center;
  }

  .room-status__actions {
    flex-direction: row;
    justify-content: center;
    margin-bottom: auto;
    padding-bottom: 20dvh;
  }

  .room-status__body {
    flex: 0 1 auto;
    margin-top: auto;
    margin-bottom: var(--space-24);
  }
}
</style>
