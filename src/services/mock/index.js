// Implementasi mock dari kontrak services (struktur-data.md bagian 4).
// Pelakunya selalu pengguna yang sedang masuk di tab ini.

import { ERROR_CODES, ServiceError } from '../errors.js'
import { PASSWORD_MIN_LENGTH, isEmailValid } from '../../lib/validation.js'
import * as ops from './ops.js'
import { addAuthListener, addRoomListener, clone, commit, notifyAuth, randomId, setSession, state } from './store.js'

function requireUid() {
  if (!state.sessionUid) throw new ServiceError(ERROR_CODES.NOT_SIGNED_IN, 'Kamu perlu masuk dulu.')
  return state.sessionUid
}

function emailOf(uid) {
  return Object.entries(state.db.accounts).find(([, account]) => account.uid === uid)?.[0] ?? ''
}

function currentUser() {
  const uid = state.sessionUid
  return uid ? { uid, name: ops.getUserName(uid), email: emailOf(uid) } : null
}

function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase()
}

// ---------- auth ----------

export async function signUp({ name, email, password }) {
  const cleanName = String(name ?? '').trim()
  const key = normalizeEmail(email)
  if (cleanName.length < 1 || cleanName.length > 60) {
    throw new ServiceError(ERROR_CODES.INVALID_ARGUMENT, 'Nama harus 1 sampai 60 karakter.')
  }
  if (!isEmailValid(key) || String(password ?? '').length < PASSWORD_MIN_LENGTH) {
    throw new ServiceError(ERROR_CODES.INVALID_ARGUMENT, 'Email atau kata sandi tidak valid.')
  }
  if (state.db.accounts[key]) {
    throw new ServiceError(ERROR_CODES.EMAIL_TAKEN, 'Email ini sudah terdaftar.')
  }

  const uid = `u${randomId(15)}`
  // Mock saja: kata sandi disimpan apa adanya di localStorage. Firebase Auth tidak begini.
  state.db.accounts[key] = { uid, password }
  commit()
  ops.createUser(uid, cleanName)
  setSession(uid)
  notifyAuth(currentUser())
  return currentUser()
}

export async function signIn({ email, password }) {
  const account = state.db.accounts[normalizeEmail(email)]
  if (!account || account.password !== password) {
    throw new ServiceError(ERROR_CODES.INVALID_CREDENTIAL, 'Email atau kata sandi salah.')
  }
  setSession(account.uid)
  notifyAuth(currentUser())
  return currentUser()
}

export async function signOut() {
  setSession(null)
  notifyAuth(null)
}

export function onAuthChange(callback) {
  callback(currentUser())
  return addAuthListener(callback)
}

// ---------- profil ----------

export async function getProfile(uid) {
  return ops.getProfile(uid)
}

// ---------- room ----------

export async function createRoom(options) {
  return ops.createRoom(requireUid(), options)
}

export async function openRoom(roomId) {
  return ops.openRoom(requireUid(), roomId)
}

export async function setDuration(roomId, durationMin) {
  ops.setDuration(requireUid(), roomId, durationMin)
}

export async function setNotes(roomId, text) {
  ops.setNotes(requireUid(), roomId, text)
}

export async function requestStart(roomId) {
  ops.requestStart(requireUid(), roomId)
}

export async function cancelStart(roomId) {
  ops.cancelStart(requireUid(), roomId)
}

export async function confirmReady(roomId) {
  ops.confirmReady(requireUid(), roomId)
}

export async function startBattle(roomId) {
  ops.startBattle(requireUid(), roomId)
}

export async function setPresence(roomId, online) {
  ops.setPresence(requireUid(), roomId, online)
}

export async function answerCheckIn(roomId, index) {
  ops.answerCheckIn(requireUid(), roomId, index)
}

export async function forfeit(roomId) {
  ops.forfeit(requireUid(), roomId)
}

export async function claimResult(roomId, result) {
  ops.claimResult(requireUid(), roomId, result)
}

export async function applyPoints(roomId) {
  return ops.applyPoints(requireUid(), roomId)
}

export function listenRoom(roomId, callback) {
  callback(clone(state.db.rooms[roomId] ?? null))
  return addRoomListener(roomId, callback)
}

// ---------- Belajar Mandiri ----------

export async function saveSoloSession(entry) {
  return ops.saveSoloSession(requireUid(), entry)
}

export async function listSoloSessions() {
  return ops.listSoloSessions(requireUid())
}

// Jam mock sama dengan jam perangkat
export async function getServerOffset() {
  return 0
}
