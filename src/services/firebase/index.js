// Implementasi Firebase dari kontrak services (struktur-data.md bagian 4).
// Bentuk data persis sama dengan mock. Pemeriksaan di sini memakai fungsi wasit yang sama
// dengan mock supaya pesan galat seragam; penjaga sebenarnya tetap database.rules.json.

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { get, onDisconnect, onValue, push, ref, runTransaction, serverTimestamp, set, update } from 'firebase/database'
import { NORMAL_RULES, getRules } from '../../config/gameRules.js'
import {
  buildHistoryEntry,
  canAnswerCheckIn,
  canRequestStart,
  canStartBattle,
  createForfeitResult,
  generateCheckInSchedule,
  getOpponentUid,
  getRoomRules,
  getRoomStatus,
  isClaimValid,
  isLobbyEditable,
  isPlayer,
  resolveRoomEntry,
  ROOM_STATUS,
  validateNotes,
} from '../../domain/referee.js'
import { summarizeHistory } from '../../domain/profile.js'
import { ERROR_CODES, ServiceError } from '../errors.js'
import { firebase, getOffsetMs, serverNow } from './app.js'

// ---------- galat ----------

const AUTH_CREDENTIAL_CODES = new Set([
  'auth/invalid-credential',
  'auth/invalid-login-credentials',
  'auth/wrong-password',
  'auth/user-not-found',
  'auth/invalid-email',
])

function toServiceError(error) {
  if (error instanceof ServiceError) return error
  const code = String(error?.code ?? '')
  const message = String(error?.message ?? '')

  if (code === 'auth/email-already-in-use') return new ServiceError(ERROR_CODES.EMAIL_TAKEN, 'Email ini sudah terdaftar.')
  if (AUTH_CREDENTIAL_CODES.has(code)) return new ServiceError(ERROR_CODES.INVALID_CREDENTIAL, 'Email atau kata sandi salah.')
  if (code === 'auth/weak-password') return new ServiceError(ERROR_CODES.INVALID_ARGUMENT, 'Kata sandi terlalu pendek.')
  if (code.toUpperCase() === 'PERMISSION_DENIED' || /permission.denied/i.test(message)) {
    return new ServiceError(ERROR_CODES.PERMISSION_DENIED, 'Kamu tidak punya akses untuk ini.')
  }
  // Galat lain (jaringan, server) dibiarkan dengan kodenya; layar menampilkan pesan umum
  return new ServiceError(code || 'unknown', message || 'Terjadi galat.')
}

// Bungkus fungsi async supaya semua galat Firebase menjadi ServiceError
function guarded(fn) {
  return async (...args) => {
    try {
      return await fn(...args)
    } catch (error) {
      throw toServiceError(error)
    }
  }
}

function fail(code, message) {
  throw new ServiceError(code, message)
}

// ---------- helper ----------

function db() {
  return firebase().db
}

function roomRef(roomId, path = '') {
  return ref(db(), `rooms/${roomId}${path ? `/${path}` : ''}`)
}

function requireUid() {
  const uid = firebase().auth.currentUser?.uid
  if (!uid) fail(ERROR_CODES.NOT_SIGNED_IN, 'Kamu perlu masuk dulu.')
  return uid
}

async function loadRoom(roomId) {
  const snapshot = await get(roomRef(roomId))
  if (!snapshot.exists()) fail(ERROR_CODES.NOT_FOUND, 'Room tidak ditemukan.')
  return snapshot.val()
}

function requirePlayer(room, uid) {
  if (!isPlayer(room, uid)) fail(ERROR_CODES.PERMISSION_DENIED, 'Kamu bukan peserta room ini.')
}

function requireHost(room, uid) {
  if (room.meta.hostUid !== uid) fail(ERROR_CODES.PERMISSION_DENIED, 'Hanya host yang bisa melakukan ini.')
}

function requireLobby(room) {
  if (!isLobbyEditable(room, serverNow())) fail(ERROR_CODES.PERMISSION_DENIED, 'Battle sudah dimulai atau room tidak berlaku.')
}

// ---------- auth ----------

const authCallbacks = new Set()

async function readName(uid) {
  const snapshot = await get(ref(db(), `users/${uid}/profile/name`))
  return snapshot.val() ?? ''
}

async function toUser(firebaseUser) {
  if (!firebaseUser) return null
  const storedName = firebaseUser.displayName || (await readName(firebaseUser.uid).catch(() => ''))
  // Saat Daftar, displayName bisa baru terisi selama menunggu baca di atas
  const name = storedName || firebaseUser.displayName || ''
  return { uid: firebaseUser.uid, name, email: firebaseUser.email ?? '' }
}

function emitAuth(user) {
  authCallbacks.forEach((callback) => callback(user))
}

export const signUp = guarded(async ({ name, email, password }) => {
  const cleanName = String(name ?? '').trim()
  if (cleanName.length < 1 || cleanName.length > 60) {
    fail(ERROR_CODES.INVALID_ARGUMENT, 'Nama harus 1 sampai 60 karakter.')
  }
  const { auth } = firebase()
  const credential = await createUserWithEmailAndPassword(auth, String(email ?? '').trim(), String(password ?? ''))
  await updateProfile(credential.user, { displayName: cleanName })
  await set(ref(db(), `users/${credential.user.uid}/profile`), { name: cleanName, createdAt: serverTimestamp() })

  // onAuthStateChanged sudah terpanggil sebelum nama tersimpan, jadi kabari ulang dengan nama
  const user = await toUser(credential.user)
  emitAuth(user)
  return user
})

export const signIn = guarded(async ({ email, password }) => {
  const credential = await signInWithEmailAndPassword(firebase().auth, String(email ?? '').trim(), String(password ?? ''))
  return toUser(credential.user)
})

export const signOut = guarded(async () => {
  await firebaseSignOut(firebase().auth)
})

// Callback pertama baru dipanggil setelah Firebase selesai memuat status masuk
export function onAuthChange(callback) {
  authCallbacks.add(callback)
  const unsubscribe = onAuthStateChanged(firebase().auth, async (firebaseUser) => {
    callback(await toUser(firebaseUser))
  })
  return () => {
    authCallbacks.delete(callback)
    unsubscribe()
  }
}

// ---------- profil ----------

// Daftar membuat akun Auth dulu, baru profil. Bila profil gagal tersimpan (misalnya sinyal putus),
// profil milik sendiri ditulis ulang dari displayName supaya Dasbor tetap bisa dimuat.
async function restoreOwnProfile(uid) {
  const user = firebase().auth.currentUser
  const name = String(user?.displayName ?? '').trim()
  if (user?.uid !== uid || name.length < 1) fail(ERROR_CODES.NOT_FOUND, 'Profil tidak ditemukan.')
  await set(ref(db(), `users/${uid}/profile`), { name: name.slice(0, 60), createdAt: serverTimestamp() })
  return get(ref(db(), `users/${uid}/profile`))
}

export const getProfile = guarded(async (uid) => {
  let profile = await get(ref(db(), `users/${uid}/profile`))
  if (!profile.exists()) profile = await restoreOwnProfile(uid)
  // Riwayat pengguna lain bisa ditolak rules; untuk lawan cukup nama
  const history = await get(ref(db(), `users/${uid}/history`))
    .then((snapshot) => snapshot.val() ?? {})
    .catch(() => ({}))
  return { ...profile.val(), ...summarizeHistory(history) }
})

// ---------- room ----------

// [TERBUKA] Mode demo belum ada di rules Firebase, jadi room selalu dibuat dengan aturan normal
export const createRoom = guarded(async ({ durationMin = NORMAL_RULES.defaultDurationMin } = {}) => {
  const uid = requireUid()
  if (!NORMAL_RULES.durationsMin.includes(durationMin)) fail(ERROR_CODES.INVALID_ARGUMENT, 'Durasi tidak tersedia.')

  const roomId = push(ref(db(), 'rooms')).key
  await set(roomRef(roomId, 'meta'), {
    hostUid: uid,
    durationMin,
    createdAt: serverTimestamp(),
    // Perkiraan jam server bisa sedikit maju; dikurangi 5 detik supaya tidak melewati batas rules createdAt + 30 menit
    expiresAt: serverNow() + NORMAL_RULES.roomTtlMs - 5_000,
  })
  return roomId
})

// Bukan peserta hanya boleh membaca meta dan guestUid, jadi dua bagian itu dibaca terpisah
async function loadRoomForEntry(roomId, uid) {
  const [meta, guestUid] = await Promise.all([get(roomRef(roomId, 'meta')), get(roomRef(roomId, 'guestUid'))])
  if (!meta.exists()) return null
  const partial = { meta: meta.val(), guestUid: guestUid.val() ?? undefined }
  return isPlayer(partial, uid) ? loadRoom(roomId) : partial
}

export const openRoom = guarded(async (roomId) => {
  const uid = requireUid()
  const room = await loadRoomForEntry(roomId, uid)
  const { route, join } = resolveRoomEntry(room, uid, serverNow())
  if (!join) return route

  // Transaksi supaya dua orang yang membuka tautan bersamaan tidak sama-sama tercatat tamu
  const { committed, snapshot } = await runTransaction(roomRef(roomId, 'guestUid'), (current) => {
    if (current === null) return uid
    return undefined
  })
  if (committed || snapshot.val() === uid) return route
  return resolveRoomEntry({ ...room, guestUid: snapshot.val() }, uid, serverNow()).route
})

export const setDuration = guarded(async (roomId, durationMin) => {
  const uid = requireUid()
  const room = await loadRoom(roomId)
  requireHost(room, uid)
  requireLobby(room)
  if (!getRoomRules(room).durationsMin.includes(durationMin)) fail(ERROR_CODES.INVALID_ARGUMENT, 'Durasi tidak tersedia.')
  await set(roomRef(roomId, 'meta/durationMin'), durationMin)
})

export const setNotes = guarded(async (roomId, text) => {
  const uid = requireUid()
  const room = await loadRoom(roomId)
  requirePlayer(room, uid)
  requireLobby(room)
  const rules = getRoomRules(room)
  if (!validateNotes(text, rules)) fail(ERROR_CODES.INVALID_ARGUMENT, `Notes harus 1 sampai ${rules.notes.maxLength} karakter.`)
  await set(roomRef(roomId, `notes/${uid}`), text)
})

export const requestStart = guarded(async (roomId) => {
  const uid = requireUid()
  const room = await loadRoom(roomId)
  requireHost(room, uid)
  if (!canRequestStart(room, serverNow())) fail(ERROR_CODES.PERMISSION_DENIED, 'Lawan dan Notes 2/2 dibutuhkan sebelum mulai.')
  await set(roomRef(roomId, 'startRequested'), true)
})

export const cancelStart = guarded(async (roomId) => {
  const uid = requireUid()
  const room = await loadRoom(roomId)
  requirePlayer(room, uid)
  requireLobby(room)
  // Sama dengan mock: Batal menghapus status siap kedua pemain
  await update(roomRef(roomId), { startRequested: false, ready: null })
})

export const confirmReady = guarded(async (roomId) => {
  const uid = requireUid()
  const room = await loadRoom(roomId)
  requirePlayer(room, uid)
  requireLobby(room)
  if (room.startRequested !== true) fail(ERROR_CODES.PERMISSION_DENIED, 'Host belum menekan Mulai Adu Fokus.')
  await set(roomRef(roomId, `ready/${uid}`), true)
})

export const startBattle = guarded(async (roomId) => {
  const uid = requireUid()
  const room = await loadRoom(roomId)
  requireHost(room, uid)
  requireLobby(room)
  if (!canStartBattle(room)) fail(ERROR_CODES.PERMISSION_DENIED, 'Kedua pemain belum siap.')
  const rules = getRoomRules(room)
  // Tulis sekali: battle kedua (misalnya tab ganda) ditolak
  const { committed } = await runTransaction(roomRef(roomId, 'battle'), (current) => {
    if (current !== null) return undefined
    return { startedAt: serverTimestamp(), checkIns: generateCheckInSchedule(room.meta.durationMin, rules) }
  })
  if (!committed) fail(ERROR_CODES.ALREADY_EXISTS, 'Battle sudah dimulai.')
})

export const setPresence = guarded(async (roomId, online) => {
  const uid = requireUid()
  const presenceRef = roomRef(roomId, `presence/${uid}`)
  if (online) {
    // Saat koneksi putus, server Firebase sendiri yang menulis offline
    await onDisconnect(presenceRef).set({ online: false, lastSeen: serverTimestamp() })
  } else {
    await onDisconnect(presenceRef).cancel()
  }
  await set(presenceRef, { online, lastSeen: serverTimestamp() })
})

export const answerCheckIn = guarded(async (roomId, index) => {
  const uid = requireUid()
  const room = await loadRoom(roomId)
  requirePlayer(room, uid)
  if (!canAnswerCheckIn(room, uid, index, serverNow())) fail(ERROR_CODES.PERMISSION_DENIED, 'Waktu menjawab Check-In sudah lewat.')
  await set(roomRef(roomId, `responses/${uid}/${index}`), serverTimestamp())
})

// Hasil ditulis sekali. Transaksi gagal = sudah ada hasil dari pemain lain.
async function writeResult(roomId, result) {
  const { committed } = await runTransaction(roomRef(roomId, 'result'), (current) => {
    if (current !== null) return undefined
    return { ...result, at: serverTimestamp() }
  })
  if (!committed) fail(ERROR_CODES.ALREADY_EXISTS, 'Hasil battle sudah tercatat.')
}

export const forfeit = guarded(async (roomId) => {
  const uid = requireUid()
  const room = await loadRoom(roomId)
  requirePlayer(room, uid)
  if (getRoomStatus(room, serverNow()) !== ROOM_STATUS.RUNNING) fail(ERROR_CODES.PERMISSION_DENIED, 'Battle tidak sedang berjalan.')
  await writeResult(roomId, createForfeitResult(room, uid))
})

export const claimResult = guarded(async (roomId, claim) => {
  const uid = requireUid()
  const room = await loadRoom(roomId)
  requirePlayer(room, uid)
  if (room.result) fail(ERROR_CODES.ALREADY_EXISTS, 'Hasil battle sudah tercatat.')
  const forfeitByOther = claim?.reason === 'forfeit' && claim.loserUid !== uid
  if (forfeitByOther || !isClaimValid(room, claim, serverNow())) fail(ERROR_CODES.PERMISSION_DENIED, 'Hasil belum memenuhi syarat.')
  await writeResult(roomId, claim)
})

// Menulis users/{uid}/history/{roomId} sekali
export const applyPoints = guarded(async (roomId) => {
  const uid = requireUid()
  const room = await loadRoom(roomId)
  requirePlayer(room, uid)
  if (!room.result) fail(ERROR_CODES.PERMISSION_DENIED, 'Battle belum selesai.')
  if (!getRules(room.meta.mode).awardsPoints) return null

  const opponentName = (await readName(getOpponentUid(room, uid)).catch(() => '')) || 'Lawan'
  const entry = buildHistoryEntry(room, uid, opponentName, serverNow())
  const { committed } = await runTransaction(ref(db(), `users/${uid}/history/${roomId}`), (current) => {
    if (current !== null) return undefined
    return { ...entry, at: serverTimestamp() }
  })
  if (!committed) fail(ERROR_CODES.ALREADY_EXISTS, 'Poin room ini sudah dicatat.')
  return entry
})

// ---------- Belajar Mandiri ----------

// [USULAN] users/{uid}/solo/{sessionId}, lihat docs/usulan-firebase-v1.3.md bagian 4
export const saveSoloSession = guarded(async (entry) => {
  const uid = requireUid()
  const sessionRef = push(ref(db(), `users/${uid}/solo`))
  await set(sessionRef, { ...entry })
  return sessionRef.key
})

export const listSoloSessions = guarded(async () => {
  const uid = requireUid()
  const snapshot = await get(ref(db(), `users/${uid}/solo`))
  return snapshot.val() ?? {}
})

// Room hilang dikabarkan sebagai null, seperti mock. Bukan peserta ditolak rules membaca seluruh room,
// jadi ia menerima meta dan guestUid saja (untuk nama di layar room penuh).
export function listenRoom(roomId, callback) {
  let active = true
  const unsubscribe = onValue(
    roomRef(roomId),
    (snapshot) => callback(snapshot.val()),
    async () => {
      const partial = await loadRoomForEntry(roomId, null).catch(() => null)
      if (active) callback(partial)
    },
  )
  return () => {
    active = false
    unsubscribe()
  }
}

// .info hanya bisa didengar, tidak bisa dibaca dengan get()
export function getServerOffset() {
  return new Promise((resolve) => {
    const unsubscribe = onValue(
      ref(db(), '.info/serverTimeOffset'),
      (snapshot) => {
        // Nilai bisa datang sebelum onValue selesai mengembalikan unsubscribe
        setTimeout(() => unsubscribe())
        resolve(snapshot.val() ?? getOffsetMs())
      },
      () => resolve(getOffsetMs()),
    )
  })
}
