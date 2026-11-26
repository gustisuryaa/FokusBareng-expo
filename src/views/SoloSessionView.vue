<script setup>
import BrandLogo from '@/components/ui/BrandLogo.vue'
// Figma: M12 dan D08 (fokus), M13 dan D08i (istirahat). Logika sesi: src/domain/solo.js.
// Sesi dicatat ke database saat selesai, diakhiri, Check-In terlewat, atau halaman ditinggalkan.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import CheckInDialog from '@/components/arena/CheckInDialog.vue'
import TimerRing from '@/components/arena/TimerRing.vue'
import RhythmBar from '@/components/solo/RhythmBar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useServerClock } from '@/composables/useServerClock'
import { showToast } from '@/composables/useToast'
import {
  SEGMENT,
  answerCheckIn,
  buildSoloEntry,
  formatDuration,
  getActiveCheckIn,
  getCheckInWindows,
  getMissedCheckIn,
  getPosition,
  getTechnique,
  skipBreak,
} from '@/domain/solo'
import { saveSoloSession } from '@/services'
import { setSoloSession, soloStore } from '@/stores/soloStore'

const router = useRouter()
const { now, read } = useServerClock()

// Salinan lokal tetap ada setelah sesi berakhir, supaya dialog "Waktu habis" masih bisa tampil
const session = ref(soloStore.session)
const ended = ref(false)
const missedWindow = ref(null)

const technique = computed(() => (session.value ? getTechnique(session.value.techniqueId) : null))
const position = computed(() => (session.value ? getPosition(session.value, Math.max(now.value, session.value.startedAt)) : null))
const segment = computed(() => position.value?.segment ?? null)
const isBreak = computed(() => segment.value?.kind === SEGMENT.BREAK)
const hasBreaks = computed(() => session.value?.segments.some((item) => item.kind === SEGMENT.BREAK))

const statusText = computed(() => {
  if (!position.value || position.value.done) return ''
  const { number, count } = position.value
  return isBreak.value ? `ISTIRAHAT ${number} DARI ${count}` : `PUTARAN ${number} DARI ${count}`
})

const helperText = computed(() => {
  if (isBreak.value) return `Berdiri sebentar. Putaran ${position.value.number + 1} mulai otomatis.`
  return session.value?.checkIn ? 'Check-In acak aktif. Tetap di tab ini.' : 'Check-In acak mati. Selesaikan putaran ini.'
})

const rhythmItems = computed(() =>
  (position.value?.timeline ?? []).map((item) => ({
    kind: item.kind,
    ms: item.ms,
    state: item.index < segment.value.index ? 'done' : item.index === segment.value.index ? 'current' : 'future',
  })),
)
const marker = computed(() => {
  if (!position.value) return 0
  const { startedAt } = session.value
  return (Math.min(now.value, position.value.endAt) - startedAt) / (position.value.endAt - startedAt)
})

// ---------- Check-In ----------

const active = computed(() => (session.value && !ended.value ? getActiveCheckIn(session.value, now.value) : null))
// Nomor Check-In sepanjang sesi, mulai dari 1
const checkInNumber = computed(() => {
  const key = missedWindow.value?.key ?? active.value?.key
  return session.value && key ? getCheckInWindows(session.value).findIndex((window) => window.key === key) + 1 : 1
})
const checkInSeconds = computed(() => (active.value ? Math.max(0, Math.ceil((active.value.deadline - now.value) / 1000)) : 0))

function handleAnswer() {
  if (!active.value) return
  update(answerCheckIn(session.value, active.value.key))
}

// ---------- Mengubah dan mengakhiri sesi ----------

function update(next) {
  session.value = next
  setSoloSession(next)
}

function handleSkip() {
  update(skipBreak(session.value, read()))
}

// notify = false saat dialog "Waktu habis" sudah menjelaskan apa yang terjadi
async function endSession(endedAt, completed, { notify = true } = {}) {
  if (ended.value) return
  ended.value = true
  const entry = buildSoloEntry(session.value, endedAt, completed)
  setSoloSession(null)
  // Sesi di bawah satu menit tidak dicatat supaya riwayat tidak berisi sesi kosong
  if (entry.focusMin < 1) return
  try {
    await saveSoloSession(entry)
    if (notify) showToast('Sesi tersimpan')
  } catch {
    showToast('Sesi gagal disimpan.')
  }
}

function backToSolo() {
  router.replace({ name: 'solo' })
}

async function handleEnd() {
  await endSession(read(), false)
  backToSolo()
}

watch(now, async (time) => {
  if (!session.value || ended.value) return
  const missed = getMissedCheckIn(session.value, time)
  if (missed) {
    missedWindow.value = missed
    // Menit fokus dihitung sampai Check-In dibuka
    await endSession(missed.openAt, false, { notify: false })
    return
  }
  if (position.value?.done) {
    await endSession(position.value.endAt, true)
    backToSolo()
  }
})

// Meninggalkan halaman lewat navigasi = mengakhiri sesi
onBeforeRouteLeave(() => {
  if (!ended.value && session.value) endSession(read(), false)
  return true
})

// ---------- Layar tetap menyala ----------

let wakeLock = null
async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock?.request('screen')
  } catch {
    // Ditolak peramban: sesi tetap jalan
  }
}
function onVisibility() {
  if (document.visibilityState === 'visible' && wakeLock?.released !== false) requestWakeLock()
}

onMounted(() => {
  if (!session.value) {
    router.replace({ name: 'solo' })
    return
  }
  requestWakeLock()
  document.addEventListener('visibilitychange', onVisibility)
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisibility)
  wakeLock?.release?.().catch(() => {})
})
</script>

<template>
  <div v-if="session && segment" class="session">
    <header class="session__app-header only-desktop">
      <BrandLogo class="heading-24" />
      <p class="label-12 session__chip">BELAJAR MANDIRI · TANPA POIN</p>
    </header>

    <main class="session__body">
      <div class="session__chips">
        <p class="label-12 session__chip">{{ technique.name.toUpperCase() }}</p>
        <p class="label-12 session__chip" :class="{ 'session__chip--break': isBreak }">{{ statusText }}</p>
      </div>

      <div class="session__center">
        <TimerRing
          :remaining-ms="position.done ? 0 : position.remainingMs"
          :total-ms="segment.ms"
          :label="isBreak ? 'ISTIRAHAT' : 'FOKUS'"
          :tone="isBreak ? 'break' : 'focus'"
        >
          dari {{ segment.ms / 60000 }} menit
        </TimerRing>
        <p class="body-14-regular d-body-16-regular session__helper" role="status">{{ helperText }}</p>
      </div>

      <div class="session__bottom">
        <section class="session__rhythm" aria-labelledby="rhythm-title">
          <div class="session__rhythm-head">
            <h2 id="rhythm-title" class="label-12">RITME SESI</h2>
            <p class="caption-13-regular">Sisa {{ formatDuration(position.done ? 0 : position.sessionRemainingMs) }}</p>
          </div>
          <RhythmBar :items="rhythmItems" :marker="marker" />
          <ul class="session__legend only-mobile">
            <li class="caption-12-regular"><span class="dot dot--focus" />Fokus</li>
            <li v-if="hasBreaks" class="caption-12-regular"><span class="dot dot--break" />Istirahat</li>
          </ul>
        </section>

        <div class="session__actions">
          <AppButton v-if="isBreak" class="session__skip" @click="handleSkip">Lewati istirahat</AppButton>
          <AppButton variant="secondary" class="session__end" :disabled="ended" @click="handleEnd">Akhiri sesi</AppButton>
        </div>
      </div>
    </main>

    <CheckInDialog
      :open="Boolean(active) || missedWindow !== null"
      :mode="missedWindow !== null ? 'missed' : 'ask'"
      :seconds-left="checkInSeconds"
      :number="checkInNumber"
      missed-label="Lihat riwayat"
      @answer="handleAnswer"
      @see-result="backToSolo"
    />
  </div>

  <div v-else class="session session--loading" aria-busy="true">
    <p class="body-16-regular session__muted">Memuat sesi…</p>
  </div>
</template>

<style scoped>
/* Ponsel dan tablet: satu layar tanpa scroll, seperti Arena */
.session {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: var(--container-tablet);
  height: 100dvh;
  margin-inline: auto;
  padding: var(--space-56) var(--space-20) var(--space-28);
  overflow: hidden;
}

.session--loading {
  align-items: center;
  justify-content: center;
}

.session__muted {
  color: var(--text-secondary);
}

.session__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.session__chips {
  display: flex;
  justify-content: space-between;
  gap: var(--space-8);
}

.session__chip {
  display: flex;
  align-items: center;
  min-height: var(--tap-min);
  padding: 0 var(--space-16);
  background-color: var(--bg-surface);
  border-radius: var(--radius-pill);
  color: var(--text-primary);
}

.session__chip--break {
  color: var(--status-success);
}

.session__center {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: var(--space-20);
  min-height: 0;
  /* M12: ring 48 px di bawah chip, sisa ruang di bawah teks bantu */
  padding-top: var(--space-48);
}

.session__helper {
  min-height: 1lh;
  color: var(--text-secondary);
  text-align: center;
}

.session__bottom {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.session__rhythm {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  padding: var(--space-20);
  background-color: var(--bg-surface);
  border-radius: var(--radius-24);
}

.session__rhythm-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--text-secondary);
}

.session__legend {
  display: flex;
  gap: var(--space-16);
  margin: 0;
  padding: 0;
  list-style: none;
  color: var(--text-secondary);
}

.session__legend li {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.dot {
  width: var(--space-8);
  height: var(--space-8);
  border-radius: var(--radius-pill);
}

.dot--focus {
  background-color: var(--accent-amber);
}

.dot--break {
  background-color: var(--status-success);
}

.session__actions {
  display: flex;
  gap: var(--space-8);
}

.session__end {
  flex: 1;
}

/* Desktop D08: header, chip di atas ring, kartu Ritme sesi berisi tombol di bawah */
@media (min-width: 1024px) {
  .session {
    max-width: none;
    padding: 0;
  }

  .session__app-header {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    height: var(--header-height-d);
    padding-inline: var(--space-40);
  }

  .session__body {
    gap: var(--space-24);
    padding: 0 var(--space-40) var(--space-40);
  }

  .session__chips {
    justify-content: center;
    margin-top: var(--space-24);
  }

  .session__center {
    justify-content: center;
    padding-top: 0;
  }

  .session__bottom {
    flex-direction: row;
    align-items: center;
    gap: var(--space-24);
    padding: var(--space-28);
    background-color: var(--bg-surface);
    border-radius: var(--radius-24);
  }

  .session__rhythm {
    flex: 1;
    min-width: 0;
    padding: 0;
    background: transparent;
  }

  .session__end {
    flex: none;
  }
}
</style>
