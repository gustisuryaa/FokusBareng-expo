<script setup>
import BrandLogo from '@/components/ui/BrandLogo.vue'
// Figma: Lobi host M02 (a, b, r, n, d, c, sh) · D02 (a, r, c), tamu M21 (r, n) · D21 (r).
// Konfirmasi M20 · M20g · D15 · D20g, gagal M26 · M27 · D26 · D27. Alur: keputusan-aturan.md bagian 2 dan 7.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FocusConfirm from '@/components/lobby/FocusConfirm.vue'
import InviteLink from '@/components/lobby/InviteLink.vue'
import NotesInput from '@/components/lobby/NotesInput.vue'
import RoomStatusScreen from '@/components/lobby/RoomStatusScreen.vue'
import StartChecklist from '@/components/lobby/StartChecklist.vue'
import VersusCard from '@/components/lobby/VersusCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import RadioGroup from '@/components/ui/RadioGroup.vue'
import SheetDialog from '@/components/ui/SheetDialog.vue'
import { useIsDesktop } from '@/composables/useMediaQuery'
import { usePlayerNames } from '@/composables/usePlayerNames'
import { usePresence } from '@/composables/usePresence'
import { useServerClock } from '@/composables/useServerClock'
import { showToast } from '@/composables/useToast'
import {
  ROOM_ROUTE,
  ROOM_STATUS,
  canRequestStart,
  canStartBattle,
  countNotes,
  getRoomRules,
  getRoomStatus,
  validateNotes,
} from '@/domain/referee'
import { roomTag } from '@/lib/roomLabel'
import {
  cancelStart,
  confirmReady,
  createRoom,
  getProfile,
  listenRoom,
  openRoom,
  requestStart,
  setDuration,
  setNotes,
  startBattle,
} from '@/services'
import { authStore } from '@/stores/authStore'

const props = defineProps({
  id: { type: String, required: true },
})

const route = useRoute()
const router = useRouter()
const isDesktop = useIsDesktop()
const { now } = useServerClock()
const presence = usePresence()
const { names, load: loadName } = usePlayerNames()

const uid = authStore.user.uid
// 'loading' | 'lobby' | 'full' | 'invalid'
const entry = ref('loading')
const room = ref(null)
const myPoints = ref(0)
const busy = ref(false)

// Data turunan

const status = computed(() => (room.value ? getRoomStatus(room.value, now.value) : null))
const rules = computed(() => getRoomRules(room.value))
const isHost = computed(() => room.value?.meta.hostUid === uid)
const hostUid = computed(() => room.value?.meta.hostUid)
const guestUid = computed(() => room.value?.guestUid ?? null)
const hostName = computed(() => names[hostUid.value] || 'Host')
const guestName = computed(() => {
  if (!guestUid.value) return null
  return isHost.value ? names[guestUid.value] || 'Lawan' : 'Kamu'
})
const isOnline = (playerUid) => room.value?.presence?.[playerUid]?.online !== false
const myNotes = computed(() => room.value?.notes?.[uid] ?? '')
const notesCount = computed(() => (room.value ? countNotes(room.value) : 0))
const durationMin = computed(() => room.value?.meta.durationMin ?? rules.value.defaultDurationMin)
const tag = computed(() => roomTag(props.id))
const queryKeep = computed(() => (route.query.mode ? { mode: route.query.mode } : {}))

const durationOptions = computed(() =>
  rules.value.durationsMin.map((minutes) => ({
    value: minutes,
    label: `${minutes} menit`,
    recommended: minutes === rules.value.defaultDurationMin,
    hint: minutes === rules.value.defaultDurationMin ? 'disarankan' : undefined,
  })),
)

const heading = computed(() => {
  const hostDisplay = hostName.value
  if (!isHost.value) {
    return myNotes.value
      ? { title: 'Menunggu host', sub: `Notes kamu tersimpan. ${hostDisplay} yang memulai Adu Fokus.` }
      : { title: 'Tulis Notes dulu', sub: `Kamu diundang ${hostDisplay}. Notes kamu baru terbaca lawan kalau dia kalah.` }
  }
  if (!guestUid.value) {
    return {
      title: 'Menunggu lawan',
      sub: 'Kirim tautan. Room bisa dimulai setelah lawan masuk.',
      subDesktop: 'Room bisa dimulai setelah lawan masuk dan kedua Notes terkirim.',
    }
  }
  if (notesCount.value === 2) return { title: 'Siap mulai', sub: 'Lawan sudah masuk dan Notes kalian berdua tersimpan.' }
  if (myNotes.value) {
    return {
      title: 'Lawan sudah masuk',
      sub: 'Tunggu lawan menyimpan Notes-nya.',
      subDesktop: 'Notes kamu tersimpan. Tunggu lawan menyimpan Notes-nya.',
    }
  }
  return { title: 'Lawan sudah masuk', sub: 'Tulis Notes kamu, lalu mulai saat Notes 2/2.' }
})

const checklist = computed(() => [
  { label: 'Lawan bergabung', done: Boolean(guestUid.value) },
  { label: `Notes ${notesCount.value}/2`, done: notesCount.value === 2 },
])

const canStart = computed(() => isHost.value && room.value && canRequestStart(room.value, now.value))
const confirmOpen = computed(() => room.value?.startRequested === true && !room.value.battle)
const iConfirmed = computed(() => room.value?.ready?.[uid] === true)

// Aksi

async function run(action, failMessage) {
  if (busy.value) return false
  busy.value = true
  try {
    await action()
    return true
  } catch (error) {
    showToast(error?.message || failMessage)
    return false
  } finally {
    busy.value = false
  }
}

// Notes: sheet di ponsel, panel langsung di desktop (disimpan saat keluar dari kolom)
const notesSheetOpen = ref(false)
const notesDraft = ref('')
const notesDraftValid = computed(() => validateNotes(notesDraft.value, rules.value))

function openNotesSheet() {
  notesDraft.value = myNotes.value
  notesSheetOpen.value = true
}

async function saveNotesFromSheet() {
  if (!notesDraftValid.value) return
  if (await run(() => setNotes(props.id, notesDraft.value), 'Notes gagal disimpan.')) notesSheetOpen.value = false
}

async function saveNotesInline() {
  if (notesDraft.value === myNotes.value || !notesDraftValid.value) return
  if (await run(() => setNotes(props.id, notesDraft.value), 'Notes gagal disimpan.')) showToast('Notes tersimpan')
}

// Durasi: sheet di ponsel, segmented langsung di desktop (host saja)
const durationSheetOpen = ref(false)
const durationDraft = ref(durationMin.value)

function openDurationSheet() {
  durationDraft.value = durationMin.value
  durationSheetOpen.value = true
}

async function saveDurationFromSheet() {
  if (await run(() => setDuration(props.id, durationDraft.value), 'Durasi gagal disimpan.')) durationSheetOpen.value = false
}

const durationInline = computed({
  get: () => durationMin.value,
  set: (value) => run(() => setDuration(props.id, value), 'Durasi gagal disimpan.'),
})

const startRequestedBusy = ref(false)
async function handleStart() {
  startRequestedBusy.value = true
  await run(() => requestStart(props.id), 'Adu Fokus gagal dimulai.')
  startRequestedBusy.value = false
}

function handleConfirm() {
  run(() => confirmReady(props.id), 'Konfirmasi gagal. Coba lagi.')
}

function handleCancel() {
  run(() => cancelStart(props.id), 'Gagal membatalkan.')
}

async function createOwnRoom() {
  await run(async () => {
    const roomId = await createRoom({ durationMin: rules.value.defaultDurationMin, mode: route.query.mode })
    await router.push({ name: 'lobby', params: { id: roomId }, query: queryKeep.value })
  }, 'Room gagal dibuat. Coba lagi.')
}

// Siklus hidup

let stopListening = null

async function enter() {
  entry.value = 'loading'
  stopListening?.()
  let target
  try {
    target = await openRoom(props.id)
  } catch {
    target = ROOM_ROUTE.INVALID
  }

  if (target === ROOM_ROUTE.ARENA) return router.replace({ name: 'arena', params: { id: props.id }, query: queryKeep.value })
  if (target === ROOM_ROUTE.RESULT) return router.replace({ name: 'result', params: { id: props.id }, query: queryKeep.value })
  if (target === ROOM_ROUTE.FULL || target === ROOM_ROUTE.INVALID) {
    entry.value = target
    // Untuk teks "Pemain A dan Pemain B sudah ada di room ini"
    stopListening = listenRoom(props.id, (value) => {
      room.value = value
      if (value) [value.meta.hostUid, value.guestUid].forEach(loadName)
    })
    return
  }

  entry.value = 'lobby'
  stopListening = listenRoom(props.id, (value) => (room.value = value))
  presence.start(props.id)
  getProfile(uid)
    .then((profile) => (myPoints.value = profile.points))
    .catch(() => {})
}

watch(() => props.id, enter)
onMounted(enter)
onBeforeUnmount(() => stopListening?.())

watch([room, status], ([value, currentStatus]) => {
  if (entry.value !== 'lobby') return
  if (!value || currentStatus === ROOM_STATUS.EXPIRED) {
    entry.value = 'invalid'
    presence.stop()
    return
  }
  loadName(value.meta.hostUid)
  loadName(value.guestUid)

  if (value.battle) {
    router.replace({ name: 'arena', params: { id: props.id }, query: queryKeep.value })
    return
  }
  // Host menulis battle begitu kedua pemain menekan "Aku siap" (langkah 9)
  if (isHost.value && canStartBattle(value) && !busy.value) {
    run(() => startBattle(props.id), 'Adu Fokus gagal dimulai.')
  }
})

watch(myNotes, (saved) => {
  if (!notesSheetOpen.value) notesDraft.value = saved
}, { immediate: true })

const fullDescription = computed(() => {
  const host = names[room.value?.meta.hostUid]
  const guest = names[room.value?.guestUid]
  const who = host && guest ? `${host} dan ${guest} sudah ada di room ini.` : 'Dua pemain sudah ada di room ini.'
  return `${who} Satu room hanya untuk 2 orang.`
})
</script>

<template>
  <RoomStatusScreen
    v-if="entry === 'invalid'"
    label="ROOM TIDAK DITEMUKAN"
    title="Tautan room tidak berlaku"
    description="Room ini sudah selesai, atau tautannya salah ketik. Minta tautan baru ke temanmu."
    :primary-label="isHost ? 'Buat room baru' : ''"
    :busy="busy"
    @primary="createOwnRoom"
  />
  <RoomStatusScreen
    v-else-if="entry === 'full'"
    :label="`ROOM ${tag}`"
    title="Room sudah penuh"
    :description="fullDescription"
    primary-label="Buat room sendiri"
    :busy="busy"
    @primary="createOwnRoom"
  />

  <div v-else-if="entry === 'lobby' && room" class="lobby">
    <!-- Header desktop -->
    <header class="lobby__app-header only-desktop">
      <BrandLogo class="heading-24" />
      <div class="lobby__app-header-right">
        <p class="caption-12-semibold lobby__chip">{{ myPoints }} poin</p>
        <p class="lobby__chip lobby__chip--profile">
          <span class="lobby__mini-avatar avatar-s" aria-hidden="true">{{ authStore.user.name.charAt(0).toUpperCase() }}</span>
          <span class="body-16-semibold">{{ authStore.user.name }}</span>
        </p>
      </div>
    </header>

    <!-- Header mobile -->
    <header class="lobby__top only-mobile">
      <RouterLink :to="{ name: 'dashboard', query: queryKeep }" class="lobby__icon-button" aria-label="Kembali ke Dasbor">
        <AppIcon name="back" />
      </RouterLink>
      <p class="lobby__chip body-16-semibold">Lobi Room</p>
      <p class="lobby__chip label-12" :aria-label="`Room ${tag}`">{{ tag }}</p>
    </header>

    <main class="lobby__body">
      <!-- Panel versus: di ponsel menjadi bagian kolom tunggal -->
      <section class="lobby__versus-panel" aria-label="Pemain">
        <div class="lobby__panel-top only-desktop">
          <RouterLink :to="{ name: 'dashboard', query: queryKeep }" class="lobby__icon-button lobby__icon-button--elevated" aria-label="Kembali ke Dasbor">
            <AppIcon name="back" />
          </RouterLink>
          <p class="label-12 lobby__muted">ROOM {{ tag }}</p>
        </div>

        <div class="lobby__heading only-mobile">
          <p class="label-12 lobby__muted">ADU FOKUS 1 LAWAN 1</p>
          <h1 class="heading-28">{{ heading.title }}</h1>
          <p class="body-16-regular lobby__muted">{{ heading.sub }}</p>
        </div>

        <div class="lobby__versus">
          <VersusCard
            :host-name="hostName"
            :host-online="isOnline(hostUid)"
            :guest-name="guestName"
            :guest-online="isOnline(guestUid)"
            :self-is-host="isHost"
          />
        </div>

        <!-- Tamu ponsel tidak melihat tautan (M21); tamu desktop melihatnya tanpa tombol (D21) -->
        <div class="lobby__invite" :class="{ 'only-desktop': !isHost }">
          <p class="label-12 lobby__muted only-desktop">
            {{ isHost ? 'UNDANG LAWAN' : `TAUTAN ROOM DARI ${hostName.toUpperCase()}` }}
          </p>
          <InviteLink :room-id="id" :copyable="isHost" />
        </div>

        <!-- Pengaturan ponsel: baris Notes dan Durasi yang membuka sheet -->
        <div class="lobby__settings only-mobile">
          <button type="button" class="lobby__setting" aria-haspopup="dialog" @click="openNotesSheet">
            <span class="lobby__setting-text">
              <span class="body-16-semibold">Notes untuk lawan</span>
              <span class="caption-13-regular lobby__muted">Tantangan untuk yang kalah</span>
            </span>
            <span class="caption-12-semibold lobby__badge" :class="{ 'lobby__badge--saved': myNotes }">
              {{ myNotes ? 'Tersimpan' : 'Belum ditulis' }}
            </span>
            <AppIcon name="chev" class="lobby__muted" :size="18" />
          </button>
          <button v-if="isHost" type="button" class="lobby__setting" aria-haspopup="dialog" @click="openDurationSheet">
            <span class="lobby__setting-text">
              <span class="body-16-semibold">Durasi</span>
              <span class="caption-13-regular lobby__muted">{{ durationMin }} menit</span>
            </span>
            <span class="body-14-semibold lobby__accent">Ubah</span>
            <AppIcon name="chev" class="lobby__muted" :size="18" />
          </button>
          <div v-else class="lobby__setting lobby__setting--static">
            <span class="lobby__setting-text">
              <span class="body-16-semibold">Durasi</span>
              <span class="caption-13-regular lobby__muted">{{ durationMin }} menit, diatur host</span>
            </span>
          </div>
        </div>
      </section>

      <!-- Kolom pengaturan desktop -->
      <section class="lobby__side only-desktop" aria-labelledby="lobby-title">
        <div class="lobby__heading">
          <p class="label-12 lobby__muted">ADU FOKUS 1 LAWAN 1</p>
          <h1 id="lobby-title" class="heading-48">{{ heading.title }}</h1>
          <p class="body-16-regular lobby__muted">{{ heading.subDesktop ?? heading.sub }}</p>
        </div>

        <div class="lobby__field">
          <p id="duration-label" class="label-12 lobby__muted">{{ isHost ? 'DURASI' : 'DURASI · DIATUR HOST' }}</p>
          <RadioGroup
            v-if="isDesktop"
            v-model="durationInline"
            :options="durationOptions"
            :label="isHost ? 'Durasi' : 'Durasi, diatur host'"
            :disabled="isHost && busy"
            :readonly="!isHost"
          />
          <p v-else class="body-16-semibold">{{ durationMin }} menit</p>
        </div>

        <div class="lobby__field">
          <p id="notes-label-d" class="label-12 lobby__muted">NOTES UNTUK LAWAN</p>
          <NotesInput
            v-if="isDesktop"
            id="notes-inline"
            v-model="notesDraft"
            labelledby="notes-label-d"
            :disabled="busy"
            @blur="saveNotesInline"
          />
        </div>

        <div class="lobby__spacer" />
      </section>

      <div class="lobby__footer">
        <StartChecklist :items="checklist" />
        <AppButton v-if="isHost" block :disabled="!canStart || busy" @click="handleStart">Mulai Adu Fokus</AppButton>
        <AppButton v-else block disabled>Menunggu host memulai</AppButton>
      </div>
    </main>

    <SheetDialog :open="notesSheetOpen && !isDesktop" labelledby="notes-sheet-title" @close="notesSheetOpen = false">
      <div class="lobby__sheet">
        <p class="label-12 lobby__accent">NOTES UNTUK LAWAN</p>
        <h2 id="notes-sheet-title" class="heading-24">Tantangan untuk yang kalah</h2>
        <NotesInput
          id="notes-sheet"
          v-model="notesDraft"
          labelledby="notes-sheet-title"
          hint="Lawan baru bisa membaca setelah hasil keluar."
          data-autofocus
        />
        <AppButton block class="lobby__sheet-action" :disabled="!notesDraftValid || busy" @click="saveNotesFromSheet">
          Simpan Notes
        </AppButton>
      </div>
    </SheetDialog>

    <SheetDialog :open="durationSheetOpen && !isDesktop" labelledby="duration-sheet-title" @close="durationSheetOpen = false">
      <div class="lobby__sheet">
        <p class="label-12 lobby__accent">DURASI</p>
        <h2 id="duration-sheet-title" class="heading-24">Berapa lama fokusnya?</h2>
        <RadioGroup v-model="durationDraft" :options="durationOptions" label="Durasi" />
        <AppButton block class="lobby__sheet-action" :disabled="busy" @click="saveDurationFromSheet">Simpan durasi</AppButton>
      </div>
    </SheetDialog>

    <FocusConfirm
      :open="confirmOpen"
      :duration-min="durationMin"
      :response-window-sec="rules.checkIn.responseWindowMs / 1000"
      :confirmed="iConfirmed"
      :busy="busy"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
  </div>

  <div v-else class="lobby lobby--loading" aria-busy="true">
    <p class="body-16-regular lobby__muted">Membuka room…</p>
  </div>
</template>

<style scoped>
/* Ponsel dan tablet: satu kolom */
.lobby {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: var(--container-tablet);
  min-height: 100dvh;
  margin-inline: auto;
  padding: var(--space-56) var(--space-20) var(--space-28);
}

.lobby--loading {
  align-items: center;
  justify-content: center;
}

.lobby__muted {
  color: var(--text-secondary);
}

.lobby__accent {
  color: var(--accent-amber);
}

.lobby__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.lobby__chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-8);
  min-height: var(--tap-min);
  padding: 0 var(--space-16);
  background-color: var(--bg-surface);
  border-radius: var(--radius-pill);
  color: var(--text-primary);
}

.lobby__icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--tap-min);
  height: var(--tap-min);
  background-color: var(--bg-surface);
  border-radius: var(--radius-pill);
  color: var(--text-primary);
}

.lobby__icon-button--elevated {
  background-color: var(--bg-elevated);
}

.lobby__body {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.lobby__versus-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.lobby__heading {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  margin: var(--space-28) 0 var(--space-12);
}

.lobby__versus {
  padding: var(--space-24) var(--space-16);
  background-color: var(--bg-surface);
  border-radius: var(--radius-28);
}

.lobby__settings {
  display: flex;
  flex-direction: column;
  padding-inline: var(--space-20);
  background-color: var(--bg-surface);
  border-radius: var(--radius-24);
}

.lobby__setting {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  width: 100%;
  padding: var(--space-16) 0;
  background: transparent;
  border: 0;
  color: var(--text-primary);
  text-align: left;
}

.lobby__setting + .lobby__setting {
  border-top: var(--line-width) solid var(--bg-pressed);
}

.lobby__setting-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
}

.lobby__badge {
  padding: var(--space-4) var(--space-12);
  background-color: var(--accent-amber-tint);
  border-radius: var(--radius-pill);
  color: var(--accent-amber);
}

.lobby__badge--saved {
  background-color: var(--status-success-tint);
  color: var(--status-success);
}

.lobby__footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  margin-top: auto;
  padding-top: var(--space-24);
}

.lobby__sheet {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.lobby__sheet-action {
  margin-top: var(--space-8);
}

/* Desktop: header, panel versus kiri, kolom pengaturan kanan */
@media (min-width: 1024px) {
  .lobby {
    display: grid;
    grid-template-rows: var(--header-height-d) 1fr;
    max-width: none;
    height: 100dvh;
    padding: 0;
  }

  .lobby__app-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-inline: var(--space-40);
  }

  .lobby__app-header-right {
    display: flex;
    align-items: center;
    gap: var(--space-8);
  }

  .lobby__chip--profile {
    padding-left: var(--space-8);
  }

  .lobby__mini-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--space-32);
    height: var(--space-32);
    background-color: var(--bg-elevated);
    border-radius: var(--radius-pill);
  }

  .lobby__body {
    display: grid;
    grid-template-columns: minmax(0, var(--panel-versus-width)) minmax(0, 1fr);
    grid-template-rows: 1fr auto;
    column-gap: var(--space-24);
    min-height: 0;
    padding: 0 var(--space-40) var(--space-40);
  }

  .lobby__versus-panel {
    grid-row: 1 / span 2;
    justify-content: space-between;
    padding: var(--space-40);
    background-color: var(--bg-surface);
    border-radius: var(--radius-32);
  }

  .lobby__panel-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .lobby__versus {
    padding: 0;
    background: transparent;
  }

  .lobby__invite {
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
  }

  .lobby__side {
    display: flex;
    flex-direction: column;
    gap: var(--space-24);
    min-height: 0;
    overflow-y: auto;
  }

  .lobby__side .lobby__heading {
    margin: 0;
  }

  .lobby__field {
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
  }

  .lobby__footer {
    grid-column: 2;
    gap: var(--space-16);
    padding-top: var(--space-24);
  }
}
</style>
