<script setup>
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import TextField from '@/components/ui/TextField.vue'
import PasswordField from '@/components/ui/PasswordField.vue'
import RadioGroup from '@/components/ui/RadioGroup.vue'
import SheetDialog from '@/components/ui/SheetDialog.vue'
import TierBadge from '@/components/profile/TierBadge.vue'
import PresenceChip from '@/components/arena/PresenceChip.vue'
import { showToast } from '@/composables/useToast'
import { NORMAL_RULES, TIERS } from '@/config/gameRules'

// Halaman pajangan komponen, hanya ada saat `npm run dev`. Bandingkan dengan section "Komponen v2".

const email = ref('')
const emailFocusSample = ref('gusti@students.uii.ac.id')
const emailErrorSample = ref('gusti@students')
const password = ref('fokusbareng26')

const durationOptions = computed(() =>
  NORMAL_RULES.durationsMin.map((minutes) => ({
    value: minutes,
    label: `${minutes} menit`,
    recommended: minutes === NORMAL_RULES.defaultDurationMin,
    hint: minutes === NORMAL_RULES.defaultDurationMin ? 'disarankan' : undefined,
  })),
)
const duration = ref(NORMAL_RULES.defaultDurationMin)
const guestDuration = ref(NORMAL_RULES.defaultDurationMin)

const durationSheetOpen = ref(false)
const exitDialogOpen = ref(false)

const tierSizes = [14, 16, 20, 22, 28]
</script>

<template>
  <main class="dev-page">
    <header class="dev-header">
      <p class="label-12 dev-muted">DEV · KOMPONEN</p>
      <h1 class="heading-28">Komponen dasar FokusBareng</h1>
      <p class="body-14-regular dev-muted">
        Hover hanya muncul di perangkat ber-pointer. Tekan Tab untuk melihat Focus. Ubah lebar jendela
        ke 390 dan 1440 untuk membandingkan dengan Figma.
      </p>
    </header>

    <section class="dev-section" aria-labelledby="sec-button">
      <h2 id="sec-button" class="label-12 dev-muted">BUTTON</h2>
      <div class="dev-row">
        <AppButton>Mulai Adu Fokus</AppButton>
        <AppButton disabled>Mulai Adu Fokus</AppButton>
        <AppButton variant="secondary">Mulai Adu Fokus</AppButton>
        <AppButton variant="secondary" disabled>Mulai Adu Fokus</AppButton>
        <AppButton variant="secondary" danger>Keluar dan kalah</AppButton>
      </div>
      <div class="dev-narrow">
        <AppButton size="lg" block>Masih fokus</AppButton>
      </div>
    </section>

    <section class="dev-section" aria-labelledby="sec-input">
      <h2 id="sec-input" class="label-12 dev-muted">INPUT/TEKS DAN INPUT/KATA SANDI</h2>
      <div class="dev-grid">
        <TextField v-model="email" label="Email" type="email" placeholder="kamu@email.com" autocomplete="email" />
        <TextField v-model="emailFocusSample" label="Email" type="email" />
        <TextField v-model="emailErrorSample" label="Email" type="email" error="Format email belum benar." />
        <TextField model-value="" label="Email" placeholder="kamu@email.com" disabled />
        <PasswordField v-model="password" autocomplete="current-password" />
        <PasswordField model-value="" disabled />
      </div>
    </section>

    <section class="dev-section" aria-labelledby="sec-radio">
      <h2 id="sec-radio" class="label-12 dev-muted">RADIOGROUP/DURASI</h2>
      <p class="caption-13-regular dev-muted">
        Daftar baris di bawah 1024 px, segmented pil di desktop. Panah atas/bawah/kiri/kanan, Home, End.
      </p>
      <div class="dev-narrow dev-radio">
        <RadioGroup v-model="duration" :options="durationOptions" label="Durasi sesi" />
        <p class="caption-13-regular dev-muted">Terpilih: {{ duration }} menit</p>
      </div>
      <div class="dev-narrow dev-radio">
        <p class="caption-13-regular dev-muted">Sisi tamu (hanya host yang boleh mengubah)</p>
        <RadioGroup v-model="guestDuration" :options="durationOptions" label="Durasi sesi" disabled />
      </div>
    </section>

    <section class="dev-section" aria-labelledby="sec-sheet">
      <h2 id="sec-sheet" class="label-12 dev-muted">SHEET DAN DIALOG</h2>
      <div class="dev-row">
        <AppButton variant="secondary" @click="durationSheetOpen = true">Buka sheet Durasi</AppButton>
        <AppButton variant="secondary" danger @click="exitDialogOpen = true">Buka konfirmasi keluar</AppButton>
      </div>
    </section>

    <section class="dev-section" aria-labelledby="sec-toast">
      <h2 id="sec-toast" class="label-12 dev-muted">TOAST</h2>
      <div class="dev-row">
        <AppButton variant="secondary" @click="showToast('Tautan disalin')">Salin tautan</AppButton>
      </div>
    </section>

    <section class="dev-section" aria-labelledby="sec-tier">
      <h2 id="sec-tier" class="label-12 dev-muted">LENCANA GELAR</h2>
      <div v-for="tier in TIERS" :key="tier.id" class="dev-row dev-tier-row">
        <span class="body-14-semibold dev-tier-name">{{ tier.name }}</span>
        <TierBadge v-for="size in tierSizes" :key="size" :tier="tier.id" :size="size" labelled />
        <span class="caption-12-regular dev-muted">belum tercapai</span>
        <TierBadge :tier="tier.id" :achieved="false" labelled />
      </div>
    </section>

    <section class="dev-section" aria-labelledby="sec-presence">
      <h2 id="sec-presence" class="label-12 dev-muted">KARTU PEMAIN (PRESENCE)</h2>
      <div class="dev-presence">
        <PresenceChip initial="G" name="Kamu" self :answered-count="2" />
        <PresenceChip initial="N" name="Lawan" :answered-count="2" />
      </div>
      <div class="dev-presence">
        <PresenceChip initial="G" name="Kamu" self connection="disconnected" :seconds-left="6" />
        <PresenceChip initial="N" name="Lawan" :answered-count="2" />
      </div>
    </section>

    <SheetDialog :open="durationSheetOpen" labelledby="sheet-duration-title" @close="durationSheetOpen = false">
      <p class="label-12 dev-muted">DURASI</p>
      <h2 id="sheet-duration-title" class="heading-24 dev-sheet-title">Pilih durasi sesi</h2>
      <RadioGroup v-model="duration" :options="durationOptions" label="Durasi sesi" />
      <div class="dev-sheet-actions">
        <AppButton block @click="durationSheetOpen = false">Simpan</AppButton>
      </div>
    </SheetDialog>

    <SheetDialog
      :open="exitDialogOpen"
      role="alertdialog"
      labelledby="exit-title"
      describedby="exit-desc"
      @close="exitDialogOpen = false"
    >
      <div class="dev-exit">
        <p class="label-12 dev-danger">KELUAR ARENA</p>
        <h2 id="exit-title" class="heading-28">Keluar dari Arena?</h2>
        <p id="exit-desc" class="body-16-regular dev-muted">
          Kamu langsung dihitung kalah dan Notes Pemain B berlaku.
        </p>
        <div class="dev-exit-actions">
          <AppButton size="lg" block data-autofocus @click="exitDialogOpen = false">Tetap fokus</AppButton>
          <AppButton size="lg" variant="secondary" danger block @click="exitDialogOpen = false">
            Keluar dan kalah
          </AppButton>
        </div>
      </div>
    </SheetDialog>
  </main>
</template>

<style scoped>
.dev-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-40);
  max-width: 1120px;
  margin-inline: auto;
  padding: var(--space-40) var(--space-20) var(--space-64);
}

.dev-header,
.dev-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
}

.dev-muted {
  color: var(--text-secondary);
}

.dev-danger {
  color: var(--status-danger);
}

.dev-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-16);
}

.dev-narrow {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  max-width: 350px;
}

.dev-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-24);
  align-items: start;
}

.dev-tier-row {
  gap: var(--space-12);
}

.dev-tier-name {
  width: 96px;
}

.dev-presence {
  display: flex;
  gap: var(--space-8);
  max-width: 350px;
}

.dev-sheet-title {
  margin: var(--space-8) 0 var(--space-16);
}

.dev-sheet-actions {
  margin-top: var(--space-24);
}

.dev-exit {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-8);
  text-align: center;
}

.dev-exit-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  width: 100%;
  margin-top: var(--space-20);
}

@media (min-width: 1024px) {
  /* Lebar panel durasi di Figma desktop (132:213) */
  .dev-radio {
    max-width: 676px;
  }

  .dev-sheet-title {
    margin-bottom: var(--space-20);
  }
}
</style>
