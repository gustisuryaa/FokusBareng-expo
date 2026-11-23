<script setup>
// Panel dev untuk mensimulasikan lawan saat VITE_DATA_SOURCE=mock. Hanya dirender di `npm run dev`.
// Bukan bagian desain Figma, jadi tampilannya sengaja polos.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MODES, resolveMode } from '@/config/gameRules'
import { countNotes, getActiveCheckIn, getCheckInWindows, getRoomStatus, getRemainingMs } from '@/domain/referee'
import { createRoom, listenRoom, signIn, signOut, signUp } from '@/services'
import * as bot from '@/services/mock/dev'
import { authStore } from '@/stores/authStore'
import { safeRedirect } from '@/router'

const route = useRoute()
const router = useRouter()

const open = ref(false)
const room = ref(null)
const now = ref(Date.now())
const message = ref('')

const roomId = computed(() => route.params.id ?? null)
const mode = computed(() => resolveMode(route.query))

let stopListening = null
watch(
  roomId,
  (id) => {
    stopListening?.()
    room.value = null
    stopListening = id ? listenRoom(id, (value) => (room.value = value)) : null
  },
  { immediate: true },
)

let clockTimer = null
onMounted(() => {
  bot.startBotTicker()
  clockTimer = setInterval(() => (now.value = Date.now()), 500)
})
onBeforeUnmount(() => {
  stopListening?.()
  clearInterval(clockTimer)
})

const statusLabel = computed(() => {
  if (!room.value) return roomId.value ? 'room tidak ditemukan' : 'tidak di room'
  return getRoomStatus(room.value, now.value)
})

const botPresence = computed(() => {
  const presence = room.value?.presence?.[bot.BOT.uid]
  if (!presence) return '-'
  return presence.online ? 'tersambung' : 'terputus'
})

const checkInInfo = computed(() => {
  if (!room.value?.battle || room.value.result) return '-'
  const active = getActiveCheckIn(room.value, now.value)
  if (active) return `ke-${active.index} aktif, sisa ${Math.ceil((active.deadline - now.value) / 1000)} dtk`
  const next = getCheckInWindows(room.value).find((window) => window.openAt > now.value)
  return next ? `ke-${next.index} dalam ${Math.ceil((next.openAt - now.value) / 1000)} dtk` : 'tidak ada lagi'
})

const remaining = computed(() => {
  const ms = room.value ? getRemainingMs(room.value, now.value) : null
  if (ms === null) return '-'
  const seconds = Math.ceil(ms / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
})

async function run(label, action) {
  message.value = ''
  try {
    const value = await action()
    message.value = `${label}: ok${value !== undefined && value !== null ? ` (${value})` : ''}`
  } catch (error) {
    message.value = `${label}: ${error.message}`
  }
}

// Akun uji tetap untuk dua tab, kata sandi hanya untuk mock
const DEV_PASSWORD = 'fokusbareng26'
async function signInAs(name, email) {
  await run(`Masuk ${name}`, async () => {
    try {
      await signIn({ email, password: DEV_PASSWORD })
    } catch {
      await signUp({ name, email, password: DEV_PASSWORD })
    }
    // Guard hanya jalan saat pindah halaman, jadi arahkan sendiri dari halaman Masuk/Daftar
    if (route.meta.guestOnly) await router.replace(safeRedirect(route.query.redirect))
  })
}

async function createAsHost() {
  await run('Buat room', async () => {
    const id = await createRoom({ mode: mode.value })
    await router.push({ path: `/room/${id}`, query: route.query })
    return id.slice(-4).toUpperCase()
  })
}

async function createAsBot() {
  await run('Lawan buat room', async () => {
    const id = bot.createRoomAsBot({ mode: mode.value })
    await router.push({ path: `/room/${id}`, query: route.query })
    return id.slice(-4).toUpperCase()
  })
}

async function resetAll() {
  await run('Hapus data mock', async () => {
    bot.resetMockData()
    await signOut()
    await router.push('/masuk')
  })
}

function toggleMode() {
  const query = { ...route.query }
  if (mode.value === MODES.DEMO) delete query.mode
  else query.mode = MODES.DEMO
  router.replace({ query })
}
</script>

<template>
  <div class="dev-panel" :class="{ 'dev-panel--open': open }">
    <button type="button" class="dev-panel__toggle label-12" :aria-expanded="open" @click="open = !open">
      DEV · LAWAN
    </button>

    <section v-if="open" class="dev-panel__body" aria-label="Panel dev lawan tiruan">
      <dl class="dev-panel__info caption-12-regular">
        <div><dt>Akun</dt><dd>{{ authStore.user?.name ?? 'belum masuk' }}</dd></div>
        <div><dt>Mode</dt><dd>{{ mode }}</dd></div>
        <div><dt>Room</dt><dd>{{ roomId ? `#${roomId.slice(-4).toUpperCase()}` : '-' }} · {{ statusLabel }}</dd></div>
        <template v-if="room">
          <div><dt>Notes</dt><dd>{{ countNotes(room) }}/2 · mulai {{ room.startRequested ? 'ya' : 'tidak' }}</dd></div>
          <div><dt>Lawan</dt><dd>{{ botPresence }}</dd></div>
          <div><dt>Check-In</dt><dd>{{ checkInInfo }}</dd></div>
          <div><dt>Sisa</dt><dd>{{ remaining }}</dd></div>
          <div v-if="room.result"><dt>Hasil</dt><dd>{{ room.result.outcome }} · {{ room.result.reason }}</dd></div>
        </template>
      </dl>

      <div class="dev-panel__group">
        <button type="button" @click="signInAs('Pemain A', 'pemain.a@fokusbareng.test')">Masuk Pemain A</button>
        <button type="button" @click="signInAs('Pemain B', 'pemain.b@fokusbareng.test')">Masuk Pemain B</button>
        <button type="button" @click="toggleMode">Mode {{ mode === 'demo' ? 'normal' : 'demo' }}</button>
      </div>

      <div class="dev-panel__group">
        <button type="button" :disabled="!authStore.user" @click="createAsHost">Buat room (aku host)</button>
        <button type="button" :disabled="!authStore.user" @click="createAsBot">Lawan buat room</button>
      </div>

      <div v-if="roomId" class="dev-panel__group">
        <button type="button" @click="run('Bergabung', () => bot.join(roomId))">Lawan bergabung</button>
        <button type="button" @click="run('Notes', () => bot.fillNotes(roomId))">Isi Notes lawan</button>
        <button type="button" @click="run('Siap', () => bot.ready(roomId))">Lawan Mulai/Siap</button>
        <button type="button" @click="run('Batal', () => bot.cancel(roomId))">Lawan Batal</button>
        <button type="button" @click="run('Terputus', () => bot.disconnect(roomId))">Lawan terputus</button>
        <button type="button" @click="run('Kembali', () => bot.reconnect(roomId))">Lawan kembali</button>
        <button type="button" @click="run('Lewatkan Check-In', () => bot.skipNextCheckIn(roomId))">Lewatkan Check-In</button>
        <button type="button" @click="run('Keluar', () => bot.forfeit(roomId))">Lawan keluar</button>
      </div>

      <div class="dev-panel__group">
        <button type="button" class="dev-panel__danger" @click="resetAll">Hapus data mock</button>
      </div>

      <p class="dev-panel__message caption-12-regular" role="status">{{ message }}</p>
    </section>
  </div>
</template>

<style scoped>
.dev-panel {
  position: fixed;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-8);
  max-width: calc(100vw - var(--space-24));
}

.dev-panel__toggle {
  opacity: 0.7;
}

.dev-panel__toggle,
.dev-panel button {
  min-height: var(--tap-min);
  padding: 0 var(--space-12);
  background-color: var(--bg-elevated);
  border: var(--line-width) dashed var(--line-input);
  border-radius: var(--radius-12);
  color: var(--text-primary);
}

.dev-panel button:disabled {
  color: var(--text-disabled);
  cursor: not-allowed;
}

.dev-panel__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  width: 340px;
  max-width: 100%;
  max-height: 70dvh;
  overflow-y: auto;
  padding: var(--space-12);
  background-color: var(--bg-surface);
  border: var(--line-width) dashed var(--line-input);
  border-radius: var(--radius-16);
}

.dev-panel__info {
  display: grid;
  gap: var(--space-4);
  color: var(--text-secondary);
}

.dev-panel__info div {
  display: flex;
  gap: var(--space-8);
}

.dev-panel__info dt {
  width: 64px;
  flex-shrink: 0;
}

.dev-panel__info dd {
  margin: 0;
  color: var(--text-primary);
}

.dev-panel__group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-8);
}

.dev-panel .dev-panel__danger {
  color: var(--status-danger);
}

.dev-panel__message {
  min-height: 1em;
  color: var(--text-secondary);
}
</style>
