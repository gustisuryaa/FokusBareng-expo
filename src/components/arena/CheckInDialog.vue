<script setup>
// Figma: Alertdialog/Check-In (M04 sheet, D03c dialog) dan versi waktu habis (M14, D09).
// Tidak bisa ditutup dengan Esc atau klik latar.
import AppButton from '@/components/ui/AppButton.vue'
import SheetDialog from '@/components/ui/SheetDialog.vue'

defineProps({
  open: { type: Boolean, default: false },
  // 'ask' = minta jawaban, 'missed' = waktu habis
  mode: { type: String, default: 'ask', validator: (value) => ['ask', 'missed'].includes(value) },
  secondsLeft: { type: Number, default: 0 },
  // Nomor Check-In untuk ditampilkan (mulai dari 1)
  number: { type: Number, default: 1 },
  busy: { type: Boolean, default: false },
})
defineEmits(['answer', 'see-result'])
</script>

<template>
  <SheetDialog
    :open="open"
    role="alertdialog"
    labelledby="checkin-title"
    describedby="checkin-desc"
    :dismissible="false"
  >
    <div class="checkin">
      <p class="label-12 checkin__label">CHECK-IN</p>
      <h2 id="checkin-title" class="heading-28 d-heading-40">{{ mode === 'ask' ? 'Masih fokus?' : 'Waktu habis' }}</h2>
      <p
        class="angka-hero-m checkin__count"
        :class="{ 'checkin__count--missed': mode === 'missed' }"
        aria-hidden="true"
      >
        {{ mode === 'ask' ? secondsLeft : 0 }}
      </p>
      <p id="checkin-desc" class="body-16-regular checkin__muted">
        <template v-if="mode === 'ask'">
          <span class="visually-hidden">{{ secondsLeft }} </span>detik untuk menjawab
        </template>
        <template v-else>Check-In ke-{{ number }} tidak dijawab.</template>
      </p>
      <AppButton
        v-if="mode === 'ask'"
        size="lg"
        block
        class="checkin__action"
        :disabled="busy"
        data-autofocus
        @click="$emit('answer')"
      >
        Masih fokus
      </AppButton>
      <AppButton v-else size="lg" block class="checkin__action" data-autofocus @click="$emit('see-result')">
        Lihat hasil
      </AppButton>
      <p class="body-14-regular checkin__muted only-desktop">Tekan Enter atau klik tombol</p>
    </div>
  </SheetDialog>
</template>

<style scoped>
.checkin {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-8);
  text-align: center;
  color: var(--text-primary);
}

.checkin__label {
  color: var(--accent-amber);
}

.checkin__count {
  margin-top: var(--space-8);
  color: var(--accent-amber);
}

.checkin__count--missed {
  color: var(--status-danger);
}

.checkin__muted {
  color: var(--text-secondary);
}

.checkin__action {
  margin-top: var(--space-16);
}
</style>
