<script setup>
// Figma: Landing page v2 > Visual produk. Layar Arena D03 dengan ponsel M04 di depannya (L01), ponsel saja di layar sempit (L02).
// Diputar sekali saat halaman dibuka: timer turun ke 12:30, sheet Check-In naik, hitung mundur berhenti di 17.
// Dengan "kurangi gerakan" langsung tampil keadaan akhir.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import ScaledFrame from '@/components/landing/ScaledFrame.vue'
import ArenaScreenDesktop from '@/components/landing/ArenaScreenDesktop.vue'
import CheckInScreenPhone from '@/components/landing/CheckInScreenPhone.vue'
import DevicePhone from '@/components/landing/DevicePhone.vue'
import DeviceTablet from '@/components/landing/DeviceTablet.vue'

const TOTAL_SEC = 25 * 60
const END_SEC = 12 * 60 + 30
const START_SEC = END_SEC + 4
const END_COUNTDOWN = 17

const remainingSec = ref(END_SEC)
const countdown = ref(END_COUNTDOWN)
const sheetOpen = ref(true)
const timers = []

const clock = computed(() => {
  const minutes = Math.floor(remainingSec.value / 60)
  return `${minutes}:${String(remainingSec.value % 60).padStart(2, '0')}`
})
const progress = computed(() => remainingSec.value / TOTAL_SEC)

function after(ms, fn) {
  timers.push(window.setTimeout(fn, ms))
}

onMounted(() => {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

  remainingSec.value = START_SEC
  countdown.value = 20
  sheetOpen.value = false

  for (let step = 1; step <= START_SEC - END_SEC; step += 1) {
    after(step * 1000, () => (remainingSec.value = START_SEC - step))
  }
  // Check-In muncul di tengah hitungan timer, lalu sisa waktunya berkurang sampai 17 detik
  after(1600, () => (sheetOpen.value = true))
  for (let step = 1; step <= 20 - END_COUNTDOWN; step += 1) {
    after(1600 + step * 1000, () => (countdown.value = 20 - step))
  }
})

onBeforeUnmount(() => timers.forEach((id) => window.clearTimeout(id)))
</script>

<template>
  <div
    class="preview"
    role="img"
    aria-label="Contoh layar Arena: sisa waktu 12:30 dari 25 menit, dua pemain online, lalu muncul Check-In yang harus dijawab dalam 17 detik"
  >
    <DeviceTablet class="preview__tablet" aria-hidden="true">
      <ScaledFrame :width="1440" :height="900">
        <ArenaScreenDesktop :clock="clock" :progress="progress" />
      </ScaledFrame>
    </DeviceTablet>
    <DevicePhone class="preview__phone" aria-hidden="true">
      <ScaledFrame :width="390" :height="844">
        <CheckInScreenPhone :clock="clock" :progress="progress" :seconds="countdown" :sheet-open="sheetOpen" />
      </ScaledFrame>
    </DevicePhone>
  </div>
</template>

<style scoped>
/* Ponsel saja (L02) */
.preview {
  display: flex;
  justify-content: center;
  padding-block: var(--space-8);
}

.preview__tablet {
  display: none;
}

.preview__phone {
  width: min(280px, 74%);
}

/* Tablet berisi layar Arena desktop, ponsel berdiri di depan sudut kanan bawahnya (L01) */
@media (min-width: 640px) {
  .preview {
    position: relative;
    display: block;
    padding-block: 0 9%;
  }

  .preview__tablet {
    display: block;
    width: 92%;
  }

  .preview__phone {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 28%;
    /* Ponsel berada di depan tablet: satu-satunya bayangan di hero, penanda lapisan */
    filter: drop-shadow(var(--shadow-menu));
  }
}
</style>
