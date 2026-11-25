// Penyimpanan mock: satu objek db berbentuk sama dengan Realtime Database
// (struktur-data.md bagian 1), disimpan di localStorage supaya bertahan saat refresh
// dan terbagi antar tab. Sesi masuk disimpan per tab di sessionStorage,
// jadi dua tab bisa menjadi dua pemain berbeda.

const DB_KEY = 'fokusbareng:mock-db'
const SESSION_KEY = 'fokusbareng:mock-session'
const hasBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined'

function emptyDb() {
  // accounts hanya ada di mock: pengganti Firebase Auth (email -> uid, kata sandi)
  return { accounts: {}, users: {}, rooms: {}, roomNotes: {} }
}

function readDb() {
  if (!hasBrowser) return emptyDb()
  try {
    return JSON.parse(localStorage.getItem(DB_KEY)) ?? emptyDb()
  } catch {
    return emptyDb()
  }
}

function readSession() {
  if (!hasBrowser) return null
  return sessionStorage.getItem(SESSION_KEY)
}

export const state = {
  db: readDb(),
  sessionUid: readSession(),
}

let clock = () => Date.now()

// Waktu "server" mock. Tes boleh menggantinya.
export function now() {
  return clock()
}

export function setClock(fn) {
  clock = fn
}

export function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value))
}

const roomListeners = new Map()
const authListeners = new Set()

export function addRoomListener(roomId, callback) {
  if (!roomListeners.has(roomId)) roomListeners.set(roomId, new Set())
  roomListeners.get(roomId).add(callback)
  return () => roomListeners.get(roomId)?.delete(callback)
}

export function addAuthListener(callback) {
  authListeners.add(callback)
  return () => authListeners.delete(callback)
}

export function notifyRoom(roomId) {
  const room = clone(state.db.rooms[roomId] ?? null)
  roomListeners.get(roomId)?.forEach((callback) => callback(room))
}

export function notifyAuth(user) {
  authListeners.forEach((callback) => callback(user))
}

// Simpan lalu kabari pendengar room yang berubah
export function commit(roomId) {
  if (hasBrowser) {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(state.db))
    } catch {
      // Penyimpanan penuh atau diblokir: data tetap ada di memori
    }
  }
  if (roomId) notifyRoom(roomId)
}

export function setSession(uid) {
  state.sessionUid = uid
  if (!hasBrowser) return
  if (uid) sessionStorage.setItem(SESSION_KEY, uid)
  else sessionStorage.removeItem(SESSION_KEY)
}

// Tab lain mengubah data: muat ulang dan kabari semua room yang sedang didengar
if (hasBrowser) {
  window.addEventListener('storage', (event) => {
    if (event.key !== DB_KEY) return
    state.db = readDb()
    roomListeners.forEach((_, roomId) => notifyRoom(roomId))
  })
}

export function resetStore() {
  state.db = emptyDb()
  setSession(null)
  commit()
}

// Id acak 20 karakter, mirip push key Firebase dan praktis tidak bisa ditebak
const ID_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz'

export function randomId(length = 20) {
  const bytes = new Uint8Array(length)
  globalThis.crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => ID_CHARS[byte % ID_CHARS.length]).join('')
}
