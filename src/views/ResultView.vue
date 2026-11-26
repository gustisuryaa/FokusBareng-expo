<script setup>
import BrandLogo from '@/components/ui/BrandLogo.vue'
// Figma: Hasil menang M09·D06 (+ M09p·D06p lawan terputus), kalah M15·D10 (+ M19b·D14b keluar,
// M25·D25 koneksi), popup Notes pemenang M15n·D10n·M19·D14·M25n·D25n, seri M16·D11. Versi tamu sama.
// Teks hasil tambahan: keputusan-aturan.md bagian 10.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TierBadge from '@/components/profile/TierBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import SheetDialog from '@/components/ui/SheetDialog.vue'
import { useTierProgress } from '@/composables/useTierProgress'
import { usePlayerNames } from '@/composables/usePlayerNames'
import { showToast } from '@/composables/useToast'
import { canReadNotes, getCheckInWindows, getOpponentUid, getOutcomeFor, getRoomRules, isPlayer } from '@/domain/referee'
import { roomTag } from '@/lib/roomLabel'
import { ERROR_CODES, applyPoints, createRoom, getProfile, listenRoom } from '@/services'
import { authStore } from '@/stores/authStore'

const props = defineProps({
  id: { type: String, required: true },
})

const route = useRoute()
const router = useRouter()
const { names, load: loadName } = usePlayerNames()

const uid = authStore.user.uid
const room = ref(null)
const pointsAfter = ref(null)
const delta = ref(0)
const notesOpen = ref(false)
const creating = ref(false)

const rules = computed(() => getRoomRules(room.value))
const result = computed(() => room.value?.result ?? null)
const outcome = computed(() => (room.value ? getOutcomeFor(room.value, uid) : null))
const opponentUid = computed(() => (room.value ? getOpponentUid(room.value, uid) : null))
const opponentName = computed(() => names[opponentUid.value] || 'Lawan')
const winnerName = computed(() => names[result.value?.winnerUid] || 'Pemenang')
const toleranceSec = computed(() => rules.value.disconnectToleranceMs / 1000)
const awardsPoints = computed(() => rules.value.awardsPoints)

const title = computed(() => ({ win: 'Kamu menang', loss: 'Kamu kalah', draw: 'Seri' })[outcome.value] ?? '')

const description = computed(() => {
  const value = result.value
  if (!value) return ''
  const nth = (value.checkInIndex ?? 0) + 1
  if (outcome.value === 'draw') {
    if (value.reason === 'missed_checkin') return `Kalian berdua melewatkan Check-In ke-${nth}.`
    if (value.reason === 'disconnect') return `Kalian berdua terputus lebih dari ${toleranceSec.value} detik.`
    return 'Timer habis, kalian berdua lolos semua Check-In. Tidak ada Notes yang dijalankan.'
  }
  const won = outcome.value === 'win'
  if (value.reason === 'missed_checkin') return won ? `Lawan tidak menjawab Check-In ke-${nth}.` : `Kamu tidak menjawab Check-In ke-${nth}.`
  if (value.reason === 'disconnect') {
    return won ? `Lawan terputus lebih dari ${toleranceSec.value} detik.` : `Koneksi kamu terputus lebih dari ${toleranceSec.value} detik.`
  }
  return won ? `${opponentName.value} keluar dari Arena.` : 'Kamu keluar dari Arena.'
})

// Notes pemenang hanya untuk yang kalah, dan hanya bila rules mengizinkan membacanya
const winnerNotes = computed(() => {
  if (!room.value || outcome.value !== 'loss') return ''
  return canReadNotes(room.value, uid, result.value.winnerUid) ? room.value.notes?.[result.value.winnerUid] ?? '' : ''
})

const pointsBefore = computed(() => (pointsAfter.value === null ? null : pointsAfter.value - delta.value))
const tier = useTierProgress(computed(() => pointsAfter.value ?? 0))

const summary = computed(() => {
  if (!room.value) return null
  const end = result.value.at
  const opened = getCheckInWindows(room.value).filter((window) => window.openAt <= end)
  const answered = opened.filter((window) => {
    const at = room.value.responses?.[uid]?.[window.index]
    return typeof at === 'number' && at <= window.deadline
  }).length
  return { duration: room.value.meta.durationMin, answered, total: opened.length }
})

// Poin dicatat sekali per room. Bila sudah tercatat (refresh), ambil dari profil.
async function recordPoints() {
  if (!awardsPoints.value) return
  try {
    const entry = await applyPoints(props.id)
    delta.value = entry?.delta ?? 0
  } catch (error) {
    if (error.code !== ERROR_CODES.ALREADY_EXISTS) showToast('Poin belum tercatat. Buka Dasbor untuk memuat ulang.')
  }
  try {
    const profile = await getProfile(uid)
    pointsAfter.value = profile.points
    if (!delta.value) delta.value = profile.lastMatch?.roomId === props.id ? profile.lastMatch.delta : 0
  } catch {
    // Profil gagal dimuat: kartu gelar tidak ditampilkan
  }
}

async function createAgain() {
  if (creating.value) return
  creating.value = true
  try {
    const mode = room.value?.meta.mode
    const roomId = await createRoom({ durationMin: room.value.meta.durationMin, mode })
    await router.push({ name: 'lobby', params: { id: roomId }, query: mode ? { mode } : {} })
  } catch {
    showToast('Room gagal dibuat. Coba lagi.')
  } finally {
    creating.value = false
  }
}

let stopListening = null
let initialized = false
onMounted(() => {
  stopListening = listenRoom(props.id, (value) => {
    room.value = value
    if (!value || !isPlayer(value, uid)) return router.replace({ name: 'dashboard' })
    if (!value.result) return router.replace({ name: 'arena', params: { id: props.id }, query: route.query })
    loadName(value.meta.hostUid)
    loadName(value.guestUid)
    if (!initialized) {
      initialized = true
      recordPoints()
    }
  })
})
onBeforeUnmount(() => stopListening?.())

// Popup Notes pemenang muncul sekali saat hasil kalah dibuka
watch(winnerNotes, (text, previous) => {
  if (text && !previous) notesOpen.value = true
}, { immediate: true })
</script>

<template>
  <div v-if="result" class="result" :class="`result--${outcome}`">
    <header class="result__header">
      <BrandLogo class="heading-24 only-desktop" />
      <p class="label-12 result__chip">ROOM {{ roomTag(id) }} · {{ room.meta.durationMin }} MENIT</p>
    </header>

    <main class="result__body">
      <section class="result__banner" aria-labelledby="result-title">
        <p class="label-12 result__tone">HASIL</p>
        <h1 id="result-title" class="heading-40 d-display-56 result__tone">{{ title }}</h1>
        <p class="body-16-regular result__muted">{{ description }}</p>

        <div class="result__points">
          <template v-if="awardsPoints">
            <p class="angka-hero-m d-angka-hero-l result__points-value">+{{ delta }}</p>
            <p class="label-12 result__muted">POIN DIDAPAT</p>
          </template>
          <p v-else class="body-16-regular result__muted">Mode demo, poin tidak dicatat.</p>
        </div>
      </section>

      <div class="result__side">
        <section v-if="awardsPoints && pointsAfter !== null" class="result__card" aria-labelledby="tier-label">
          <p id="tier-label" class="label-12 result__muted">GELAR</p>
          <div class="result__tier-row">
            <TierBadge :tier="tier.current.id" :size="20" class="only-mobile" />
            <TierBadge :tier="tier.current.id" :size="28" class="only-desktop" />
            <span class="title-20 d-heading-28 result__tier-name">{{ tier.current.name }}</span>
            <span class="body-16-semibold d-title-20">
              {{ pointsBefore }} → {{ pointsAfter }}<span class="only-desktop"> poin</span>
            </span>
          </div>
          <div class="result__progress" role="progressbar" :aria-valuenow="Math.round(tier.progress * 100)" aria-valuemin="0" aria-valuemax="100" :aria-label="`Progres menuju ${tier.next?.name ?? 'gelar tertinggi'}`">
            <span :style="{ width: `${tier.progress * 100}%` }" />
          </div>
          <p class="body-14-regular d-body-16-regular result__muted">
            {{ tier.next ? `${tier.remaining} poin lagi menuju ${tier.next.name}` : 'Gelar tertinggi sudah kamu raih' }}
          </p>
        </section>

        <section v-if="summary" class="result__card result__summary only-desktop" aria-label="Ringkasan battle">
          <div>
            <p class="label-12 result__muted">DURASI</p>
            <p class="title-20">{{ summary.duration }} mnt</p>
          </div>
          <div>
            <p class="label-12 result__muted">CHECK-IN DIJAWAB</p>
            <p class="title-20">{{ summary.answered }} dari {{ summary.total }}</p>
          </div>
          <div>
            <p class="label-12 result__muted">LAWAN</p>
            <p class="title-20">{{ opponentName }}</p>
          </div>
        </section>

        <section v-if="winnerNotes" class="result__card" aria-labelledby="consequence-label">
          <p id="consequence-label" class="label-12 result__muted">KONSEKUENSI DARI {{ winnerName.toUpperCase() }}</p>
          <p class="title-20">{{ winnerNotes }}</p>
        </section>

        <div class="result__actions">
          <AppButton :disabled="creating" @click="createAgain">Buat room baru</AppButton>
          <AppButton variant="secondary" :to="{ name: 'dashboard' }">Ke Dasbor</AppButton>
        </div>
      </div>
    </main>

    <SheetDialog :open="notesOpen" labelledby="winner-notes-title" describedby="winner-notes-text" @close="notesOpen = false">
      <div class="winner-notes">
        <p class="label-12 winner-notes__label">NOTES DARI PEMENANG</p>
        <h2 id="winner-notes-title" class="heading-28">{{ winnerName }} menang</h2>
        <p id="winner-notes-text" class="title-20 winner-notes__text">{{ winnerNotes }}</p>
        <p class="body-16-regular result__muted">Ditulis {{ winnerName }} sebelum battle dimulai.</p>
        <AppButton size="lg" block class="winner-notes__action" data-autofocus @click="notesOpen = false">Oke, aku jalankan</AppButton>
        <p class="body-14-regular result__muted only-desktop">Tekan Enter atau klik tombol</p>
      </div>
    </SheetDialog>
  </div>

  <div v-else class="result result--loading" aria-busy="true">
    <p class="body-16-regular result__muted">Memuat hasil…</p>
  </div>
</template>

<style scoped>
/* Ponsel dan tablet */
.result {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: var(--container-tablet);
  min-height: 100dvh;
  margin-inline: auto;
  padding: var(--space-56) var(--space-20) var(--space-28);
  color: var(--text-primary);
}

.result--loading {
  align-items: center;
  justify-content: center;
}

.result__muted {
  color: var(--text-secondary);
}

.result--win .result__tone {
  color: var(--status-success);
}

.result--loss .result__tone {
  color: var(--status-danger);
}

.result__header {
  display: flex;
  justify-content: center;
}

.result__chip {
  display: flex;
  align-items: center;
  min-height: var(--tap-min);
  padding: 0 var(--space-16);
  background-color: var(--bg-surface);
  border-radius: var(--radius-pill);
}

.result__body {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.result__banner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-8);
  margin-top: var(--space-24);
  text-align: center;
}

.result__points {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  margin-top: var(--space-20);
}

.result--win .result__points-value {
  color: var(--accent-amber);
}

.result__side {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-16);
  margin-top: var(--space-20);
}

.result__card {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  padding: var(--space-20);
  background-color: var(--bg-surface);
  border-radius: var(--radius-24);
}

.result__tier-row {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.result__tier-name {
  flex: 1;
}

.result__progress {
  height: var(--space-8);
  overflow: hidden;
  background-color: var(--bg-pressed);
  border-radius: var(--radius-pill);
}

.result__progress span {
  display: block;
  height: 100%;
  background-color: var(--accent-amber);
  border-radius: var(--radius-pill);
}

.result__actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  margin-top: auto;
  padding-top: var(--space-12);
}

.winner-notes {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-8);
  text-align: center;
}

.winner-notes__label {
  color: var(--accent-amber);
}

.winner-notes__text {
  width: 100%;
  margin-top: var(--space-8);
  padding: var(--space-20);
  background-color: var(--bg-elevated);
  border-radius: var(--radius-20);
}

.winner-notes__action {
  margin-top: var(--space-16);
}

/* Desktop: panel hasil kiri, kartu di kanan */
@media (min-width: 1024px) {
  .result {
    max-width: none;
    height: 100dvh;
    padding: 0;
  }

  .result__header {
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    height: var(--header-height-d);
    padding-inline: var(--space-40);
  }

  .result__body {
    flex-direction: row;
    gap: var(--space-24);
    min-height: 0;
    padding: 0 var(--space-40) var(--space-40);
  }

  .result__banner {
    flex: 0 1 var(--panel-result-width);
    align-items: flex-start;
    justify-content: center;
    gap: var(--space-12);
    margin: 0;
    padding: var(--space-56);
    background-color: var(--bg-surface);
    border-radius: var(--radius-32);
    text-align: left;
  }

  .result__points {
    align-items: flex-start;
    margin-top: var(--space-32);
  }

  .result__side {
    justify-content: center;
    gap: var(--space-24);
    min-width: 0;
    margin: 0;
    overflow-y: auto;
  }

  .result__card {
    gap: var(--space-16);
    padding: var(--space-32);
    border-radius: var(--radius-28);
  }

  .result__tier-row {
    gap: var(--space-12);
  }

  .result__summary {
    flex-direction: row;
  }

  .result__summary > div {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: var(--space-4);
  }

  .result__actions {
    flex-direction: row;
    margin-top: 0;
    padding-top: 0;
  }
}
</style>
