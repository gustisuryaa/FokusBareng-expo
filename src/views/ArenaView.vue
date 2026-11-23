<script setup>
// Figma: Arena M03·D03 (berjalan), M03b·D03b (menjelang akhir), M04·D03c (Check-In),
// M14·D09 (Check-In habis), M18·D12 (konfirmasi keluar), putus sinyal M22·M22b·M23·D22·D23
// (kamu) dan M17·M17b·M24·D13·D13b·D24 (lawan). Wasit: src/domain/referee.js.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import CheckInDialog from '@/components/arena/CheckInDialog.vue'
import CheckInTrail from '@/components/arena/CheckInTrail.vue'
import PresenceChip from '@/components/arena/PresenceChip.vue'
import TimerRing from '@/components/arena/TimerRing.vue'
import AppButton from '@/components/ui/AppButton.vue'
import SheetDialog from '@/components/ui/SheetDialog.vue'
import { usePlayerNames } from '@/composables/usePlayerNames'
import { usePresence } from '@/composables/usePresence'
import { useServerClock } from '@/composables/useServerClock'
import { showToast } from '@/composables/useToast'
import {
  evaluateBattle,
  getActiveCheckIn,
  getBattleEnd,
  getCheckInWindows,
  getOpponentUid,
  getRemainingMs,
  getRoomRules,
  isEndingSoon,
} from '@/domain/referee'
import { roomTag } from '@/lib/roomLabel'
import { answerCheckIn, claimResult, forfeit, listenRoom } from '@/services'
import { authStore } from '@/stores/authStore'

const props = defineProps({
  id: { type: String, required: true },
})

const route = useRoute()
const router = useRouter()
const { now } = useServerClock()
const presence = usePresence()
const { names, load: loadName } = usePlayerNames()

const uid = authStore.user.uid
const room = ref(null)
const answering = ref(false)
const exitOpen = ref(false)
const leaving = ref(false)
const queryKeep = computed(() => (route.query.mode ? { mode: route.query.mode } : {}))

// ---------- Turunan ----------

const rules = computed(() => getRoomRules(room.value))
const opponentUid = computed(() => (room.value ? getOpponentUid(room.value, uid) : null))
const battle = computed(() => room.value?.battle ?? null)
const totalMs = computed(() => (room.value ? room.value.meta.durationMin * 60_000 : 0))
const remainingMs = computed(() => (room.value?.battle ? getRemainingMs(room.value, now.value) : totalMs.value))
const endingSoon = computed(() => room.value?.battle && isEndingSoon(room.value, now.value))
const windows = computed(() => (room.value ? getCheckInWindows(room.value) : []))
const toleranceMs = computed(() => rules.value.disconnectToleranceMs)

const answeredBy = (playerUid) =>
  windows.value.filter((window) => {
    const at = room.value?.responses?.[playerUid]?.[window.index]
    return typeof at === 'number' && at >= window.openAt && at <= window.deadline
  }).length

const active = computed(() => (room.value ? getActiveCheckIn(room.value, now.value) : null))
const iAnsweredActive = computed(() => active.value && room.value?.responses?.[uid]?.[active.value.index] !== undefined)

// Check-In yang sudah lewat batasnya, untuk Jejak
const marks = computed(() =>
  windows.value
    .filter((window) => window.deadline < now.value || (room.value?.result && window.openAt <= room.value.result.at))
    .map((window) => {
      const both = [uid, opponentUid.value].every((playerUid) => {
        const at = room.value?.responses?.[playerUid]?.[window.index]
        return typeof at === 'number' && at <= window.deadline
      })
      return { index: window.index, openAt: window.openAt, state: both ? 'both' : 'missed' }
    }),
)

const trailSummary = computed(() => {
  const missed = marks.value.find((mark) => mark.state === 'missed')
  if (missed) {
    const at = room.value?.responses?.[uid]?.[missed.index]
    const iMissed = typeof at !== 'number'
    return { text: `${iMissed ? 'Kamu' : 'Lawan'} melewatkan ke-${missed.index + 1}`, tone: 'danger' }
  }
  return { text: `${marks.value.length} dijawab berdua`, tone: marks.value.length ? 'success' : 'muted' }
})

// ---------- Koneksi ----------

// Koneksi sendiri dilihat dari peramban (offline/online); lawan dari presence di database
const selfOfflineSince = ref(null)
const selfReconnectedAt = ref(null)
const opponentReconnectedAt = ref(null)
const NOTICE_MS = 3000 // lama pesan "tersambung lagi" tampil

// Dicatat dengan jam yang sama (now) supaya hitung mundur ikut diperbarui tiap tick
function onOffline() {
  selfOfflineSince.value = now.value
}
function onOnline() {
  if (selfOfflineSince.value !== null) selfReconnectedAt.value = now.value
  selfOfflineSince.value = null
}

const selfSecondsLeft = computed(() =>
  selfOfflineSince.value === null ? 0 : Math.max(0, Math.ceil((selfOfflineSince.value + toleranceMs.value - now.value) / 1000)),
)

const opponentPresence = computed(() => room.value?.presence?.[opponentUid.value])
const opponentOffline = computed(() => opponentPresence.value?.online === false)
const opponentSecondsLeft = computed(() =>
  opponentOffline.value
    ? Math.max(0, Math.ceil((opponentPresence.value.lastSeen + toleranceMs.value - now.value) / 1000))
    : 0,
)

watch(opponentOffline, (offline, wasOffline) => {
  if (!offline && wasOffline) opponentReconnectedAt.value = now.value
})

const responseSec = computed(() => rules.value.checkIn.responseWindowMs / 1000)
const toleranceSec = computed(() => toleranceMs.value / 1000)

const helper = computed(() => {
  if (selfOfflineSince.value !== null) {
    return { text: `Koneksi kamu terputus. Kamu kalah kalau belum tersambung dalam ${toleranceSec.value} detik.`, tone: 'warn' }
  }
  if (selfReconnectedAt.value && now.value - selfReconnectedAt.value < NOTICE_MS) {
    return { text: 'Tersambung lagi. Battle lanjut, tidak dihitung kalah.', tone: 'ok' }
  }
  if (opponentOffline.value) {
    return { text: `Koneksi lawan terputus. Lawan kalah otomatis kalau belum kembali dalam ${toleranceSec.value} detik.`, tone: 'warn' }
  }
  if (opponentReconnectedAt.value && now.value - opponentReconnectedAt.value < NOTICE_MS) {
    return { text: 'Lawan tersambung lagi. Battle lanjut, tidak ada yang kalah.', tone: 'ok' }
  }
  return null
})

// ---------- Check-In ----------

const missedIndex = ref(null)
const checkInOpen = computed(() => missedIndex.value !== null || Boolean(active.value && !iAnsweredActive.value && !room.value?.result))
const checkInSeconds = computed(() => (active.value ? Math.max(0, Math.ceil((active.value.deadline - now.value) / 1000)) : 0))

async function handleAnswer() {
  if (!active.value || answering.value) return
  answering.value = true
  try {
    await answerCheckIn(props.id, active.value.index)
  } catch (error) {
    showToast(error?.message || 'Jawaban tidak terkirim.')
  } finally {
    answering.value = false
  }
}

function goToResult() {
  leaving.value = true
  router.replace({ name: 'result', params: { id: props.id }, query: queryKeep.value })
}

// ---------- Wasit di klien: klaim hasil saat kondisi akhir terpenuhi ----------

let claiming = false
watch(now, async (time) => {
  const current = room.value
  if (!current?.battle || current.result || claiming) return
  const verdict = evaluateBattle(current, time)
  if (!verdict) return
  claiming = true
  try {
    await claimResult(props.id, verdict)
  } catch {
    // Klien lain sudah menulis hasil lebih dulu: diabaikan
  } finally {
    claiming = false
  }
})

watch(
  () => room.value?.result,
  (result) => {
    if (!result) return
    // Kamu sendiri yang melewatkan Check-In: tampilkan "Waktu habis" dulu (M14)
    if (result.reason === 'missed_checkin' && result.loserUid === uid) {
      missedIndex.value = result.checkInIndex
      return
    }
    goToResult()
  },
)

// ---------- Keluar ----------

async function confirmForfeit() {
  try {
    await forfeit(props.id)
  } catch (error) {
    showToast(error?.message || 'Gagal keluar dari Arena.')
  }
}

onBeforeRouteLeave(() => {
  if (leaving.value || !room.value?.battle || room.value.result) return true
  exitOpen.value = true
  return false
})

function onBeforeUnload(event) {
  if (room.value?.battle && !room.value.result) {
    event.preventDefault()
    event.returnValue = ''
  }
}

// ---------- Layar tetap menyala ----------

let wakeLock = null
async function requestWakeLock() {
  if (!('wakeLock' in navigator)) {
    showToast('Layar bisa mati sendiri di perangkat ini. Matikan kunci layar otomatis selama battle.')
    return
  }
  try {
    wakeLock = await navigator.wakeLock.request('screen')
  } catch {
    // Ditolak peramban (misalnya mode hemat daya): battle tetap jalan
  }
}
function onVisibility() {
  if (document.visibilityState === 'visible' && wakeLock?.released !== false) requestWakeLock()
}

// ---------- Siklus hidup ----------

let stopListening = null
onMounted(() => {
  stopListening = listenRoom(props.id, (value) => {
    room.value = value
    if (!value) return router.replace({ name: 'lobby', params: { id: props.id }, query: queryKeep.value })
    if (!value.battle) return router.replace({ name: 'lobby', params: { id: props.id }, query: queryKeep.value })
    loadName(value.meta.hostUid)
    loadName(value.guestUid)
  })
  presence.start(props.id)
  window.addEventListener('offline', onOffline)
  window.addEventListener('online', onOnline)
  window.addEventListener('beforeunload', onBeforeUnload)
  document.addEventListener('visibilitychange', onVisibility)
  requestWakeLock()
})

onBeforeUnmount(() => {
  stopListening?.()
  window.removeEventListener('offline', onOffline)
  window.removeEventListener('online', onOnline)
  window.removeEventListener('beforeunload', onBeforeUnload)
  document.removeEventListener('visibilitychange', onVisibility)
  wakeLock?.release?.().catch(() => {})
})

const initialOf = (playerUid) => (names[playerUid] || '?').charAt(0).toUpperCase()
const opponentName = computed(() => names[opponentUid.value] || 'lawan')
</script>

<template>
  <div v-if="room?.battle" class="arena" :class="{ 'arena--ending': endingSoon }">
    <header class="arena__header only-desktop">
      <p class="heading-24">FokusBareng</p>
      <p class="label-12 arena__chip">ROOM {{ roomTag(id) }} · {{ room.meta.durationMin }} MENIT</p>
    </header>

    <main class="arena__body">
      <div class="arena__duel">
        <PresenceChip
          :initial="initialOf(uid)"
          name="Kamu"
          self
          :answered-count="answeredBy(uid)"
          :connection="selfOfflineSince !== null ? 'disconnected' : 'connected'"
          :seconds-left="selfSecondsLeft"
          class="arena__player arena__player--self"
        />

        <div class="arena__center">
          <TimerRing :remaining-ms="remainingMs" :total-ms="totalMs">dari {{ room.meta.durationMin }} menit</TimerRing>
          <div class="arena__helper">
            <p
              class="body-14-regular d-body-16-regular arena__helper-text"
              :class="helper ? `arena__helper-text--${helper.tone}` : ''"
              role="status"
            >
              <template v-if="helper">{{ helper.text }}</template>
              <template v-else>
                <span class="only-mobile">Tetap di tab ini. Check-In muncul acak. Keluar dari Arena dihitung kalah.</span>
                <span class="only-desktop">
                  Tetap di tab ini. Check-In muncul acak, jawab dalam {{ responseSec }} detik. Keluar dari Arena dihitung kalah.
                </span>
              </template>
            </p>
            <button type="button" class="arena__exit body-14-semibold" @click="exitOpen = true">Keluar dari Arena</button>
          </div>
        </div>

        <PresenceChip
          :initial="initialOf(opponentUid)"
          name="Lawan"
          :answered-count="answeredBy(opponentUid)"
          :connection="opponentOffline ? 'disconnected' : 'connected'"
          :seconds-left="opponentSecondsLeft"
          class="arena__player arena__player--opponent"
        />
      </div>

      <CheckInTrail
        :started-at="battle.startedAt"
        :end-at="getBattleEnd(room)"
        :now="Math.min(now, getBattleEnd(room))"
        :marks="marks"
        :summary="trailSummary.text"
        :summary-tone="trailSummary.tone"
        :total-label="`${String(room.meta.durationMin).padStart(2, '0')}:00`"
      />
    </main>

    <CheckInDialog
      :open="checkInOpen"
      :mode="missedIndex !== null ? 'missed' : 'ask'"
      :seconds-left="checkInSeconds"
      :number="(missedIndex ?? active?.index ?? 0) + 1"
      :busy="answering"
      @answer="handleAnswer"
      @see-result="goToResult"
    />

    <SheetDialog
      :open="exitOpen && !room.result"
      role="alertdialog"
      labelledby="exit-title"
      describedby="exit-desc"
      @close="exitOpen = false"
    >
      <div class="exit">
        <p class="label-12 exit__label">KELUAR ARENA</p>
        <h2 id="exit-title" class="heading-28 d-heading-40">Keluar dari Arena?</h2>
        <p id="exit-desc" class="body-16-regular exit__muted">
          Kamu langsung dihitung kalah dan Notes {{ opponentName }} berlaku.
        </p>
        <div class="exit__actions">
          <AppButton size="lg" block data-autofocus @click="exitOpen = false">Tetap fokus</AppButton>
          <AppButton size="lg" variant="secondary" danger block @click="confirmForfeit">Keluar dan kalah</AppButton>
        </div>
        <p class="body-14-regular exit__muted only-desktop">Esc untuk kembali ke Arena</p>
      </div>
    </SheetDialog>
  </div>

  <div v-else class="arena arena--loading" aria-busy="true">
    <p class="body-16-regular arena__muted">Memuat Arena…</p>
  </div>
</template>

<style scoped>
/* Ponsel dan tablet: satu layar penuh tanpa scroll */
.arena {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: var(--container-tablet);
  height: 100dvh;
  margin-inline: auto;
  padding: var(--space-56) var(--space-20) var(--space-28);
  overflow: hidden;
}

.arena--loading {
  align-items: center;
  justify-content: center;
}

.arena__muted {
  color: var(--text-secondary);
}

.arena__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.arena__duel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto 1fr;
  column-gap: var(--space-8);
  flex: 1;
  min-height: 0;
}

.arena__player--self {
  grid-column: 1;
  grid-row: 1;
}

.arena__player--opponent {
  grid-column: 2;
  grid-row: 1;
}

.arena__center {
  display: flex;
  grid-column: 1 / -1;
  grid-row: 2;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-20);
  min-height: 0;
}

.arena__helper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-12);
}

/* Ruang tetap dua baris supaya tata letak tidak meloncat saat teks berganti */
.arena__helper-text {
  min-height: 2lh;
  max-width: var(--ring-timer-m);
  color: var(--text-secondary);
  text-align: center;
}

.arena__helper-text--warn {
  color: var(--accent-amber);
}

.arena__helper-text--ok {
  color: var(--status-success);
}

.arena__exit {
  min-height: var(--tap-min);
  padding: 0 var(--space-20);
  background: transparent;
  border: var(--line-width) solid var(--line-subtle);
  border-radius: var(--radius-pill);
  color: var(--text-secondary);
}

@media (hover: hover) {
  .arena__exit:hover {
    border-color: var(--line-input);
    color: var(--text-primary);
  }
}

.exit {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-8);
  text-align: center;
  color: var(--text-primary);
}

.exit__label {
  color: var(--status-danger);
}

.exit__muted {
  color: var(--text-secondary);
}

.exit__actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  width: 100%;
  margin-top: var(--space-20);
}

/* Desktop: header, kartu pemain kiri-kanan, ring di tengah, Jejak di bawah */
@media (min-width: 1024px) {
  .arena {
    max-width: none;
    padding: 0;
  }

  .arena__header {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    height: var(--header-height-d);
    padding-inline: var(--space-40);
  }

  .arena__chip {
    display: flex;
    align-items: center;
    min-height: var(--tap-min);
    padding: 0 var(--space-16);
    background-color: var(--bg-surface);
    border-radius: var(--radius-pill);
  }

  .arena__body {
    gap: var(--space-24);
    padding: 0 var(--space-40) var(--space-40);
  }

  .arena__duel {
    display: flex;
    align-items: center;
    gap: var(--space-24);
  }

  .arena__player--self {
    order: 1;
  }

  .arena__center {
    flex: 1;
    order: 2;
    min-width: 0;
  }

  .arena__player--opponent {
    order: 3;
  }

  .arena__helper-text {
    min-height: auto;
    max-width: none;
  }
}
</style>
