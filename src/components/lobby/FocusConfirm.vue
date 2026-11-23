<script setup>
// Figma: Alertdialog/Konfirmasi Kefokusan (M20 host, M20g tamu, D15, D20g). WBS 2.3.4.
import AppButton from '@/components/ui/AppButton.vue'
import SheetDialog from '@/components/ui/SheetDialog.vue'

defineProps({
  open: { type: Boolean, default: false },
  durationMin: { type: Number, required: true },
  responseWindowSec: { type: Number, required: true },
  // Sudah menekan "Aku siap", menunggu lawan
  confirmed: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
})
defineEmits(['confirm', 'cancel'])
</script>

<template>
  <SheetDialog
    :open="open"
    role="alertdialog"
    labelledby="focus-confirm-title"
    describedby="focus-confirm-rules"
    @close="$emit('cancel')"
  >
    <div class="focus-confirm">
      <p class="label-12 focus-confirm__label">KONFIRMASI KEFOKUSAN</p>
      <h2 id="focus-confirm-title" class="heading-28">Siap fokus {{ durationMin }} menit?</h2>
      <ul id="focus-confirm-rules" class="focus-confirm__rules body-16-semibold">
        <li>Tetap di tab ini sampai timer habis.</li>
        <li>Jawab Check-In acak dalam {{ responseWindowSec }} detik.</li>
        <li>Keluar dari Arena dihitung kalah.</li>
      </ul>
      <p class="body-16-regular focus-confirm__muted">Lawan juga mengonfirmasi di perangkatnya.</p>
      <div class="focus-confirm__actions">
        <AppButton size="lg" block :disabled="confirmed || busy" data-autofocus @click="$emit('confirm')">
          {{ confirmed ? 'Menunggu lawan siap' : 'Aku siap' }}
        </AppButton>
        <AppButton size="lg" variant="secondary" block @click="$emit('cancel')">Batal</AppButton>
      </div>
      <p class="body-14-regular focus-confirm__muted only-desktop">Enter untuk mulai, Esc untuk batal</p>
    </div>
  </SheetDialog>
</template>

<style scoped>
.focus-confirm {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-8);
  text-align: center;
}

.focus-confirm__label {
  color: var(--accent-amber);
}

.focus-confirm__rules {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  width: 100%;
  margin: var(--space-8) 0 0;
  padding: var(--space-20);
  background-color: var(--bg-elevated);
  border-radius: var(--radius-20);
  color: var(--text-primary);
  list-style: none;
  text-align: left;
}

.focus-confirm__muted {
  color: var(--text-secondary);
}

.focus-confirm__actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  width: 100%;
  margin-top: var(--space-16);
}
</style>
