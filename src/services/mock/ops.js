// Operasi mock dengan pelaku (uid) eksplisit. index.js memakainya untuk pengguna yang masuk,
// dev.js memakainya untuk lawan tiruan. Setiap operasi memeriksa hal yang sama dengan
// database.rules.json (struktur-data.md bagian 2), memakai fungsi wasit yang sama.

import { DEMO_RULES, MODES, NORMAL_RULES, SOLO_RULES, getRules } from '../../config/gameRules.js'
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
import { clone, commit, now, randomId, state } from './store.js'

function fail(code, message) {
  throw new ServiceError(code, message)
}

function getRoom(roomId) {
  const room = state.db.rooms[roomId]
  if (!room) fail(ERROR_CODES.NOT_FOUND, 'Room tidak ditemukan.')
  return room
}

function requirePlayer(room, uid) {
  if (!isPlayer(room, uid)) fail(ERROR_CODES.PERMISSION_DENIED, 'Kamu bukan peserta room ini.')
}

function requireHost(room, uid) {
  if (room.meta.hostUid !== uid) fail(ERROR_CODES.PERMISSION_DENIED, 'Hanya host yang bisa melakukan ini.')
}

function requireLobby(room) {
  if (!isLobbyEditable(room, now())) fail(ERROR_CODES.PERMISSION_DENIED, 'Battle sudah dimulai atau room tidak berlaku.')
}

// ---------- Profil ----------

export function createUser(uid, name) {
  state.db.users[uid] = { profile: { name, createdAt: now() } }
  commit()
}

export function getUserName(uid) {
  return state.db.users[uid]?.profile?.name ?? ''
}

export function getProfile(uid) {
  const user = state.db.users[uid]
  if (!user) fail(ERROR_CODES.NOT_FOUND, 'Profil tidak ditemukan.')
  return { ...clone(user.profile), ...summarizeHistory(user.history) }
}

// ---------- Belajar Mandiri ----------

// Cermin rules [USULAN]: hanya pemilik, focusMin tidak melebihi waktu yang benar-benar lewat
export function saveSoloSession(uid, entry) {
  const elapsedMin = Math.floor((entry?.endedAt - entry?.startedAt) / 60_000)
  const valid =
    SOLO_RULES.techniques.some((technique) => technique.id === entry?.technique) &&
    Number.isInteger(entry.focusMin) &&
    entry.focusMin >= 0 &&
    entry.focusMin <= elapsedMin &&
    entry.endedAt <= now() &&
    typeof entry.completed === 'boolean'
  if (!valid) fail(ERROR_CODES.INVALID_ARGUMENT, 'Data sesi tidak valid.')

  const user = state.db.users[uid]
  const id = randomId()
  user.solo = { ...user.solo, [id]: { ...entry } }
  commit()
  return id
}

export function listSoloSessions(uid) {
  return clone(state.db.users[uid]?.solo ?? {})
}

// ---------- Room ----------

export function createRoom(uid, { durationMin = NORMAL_RULES.defaultDurationMin, mode = MODES.NORMAL } = {}) {
  const isDemo = mode === MODES.DEMO
  const rules = isDemo ? DEMO_RULES : NORMAL_RULES
  const duration = isDemo ? DEMO_RULES.defaultDurationMin : durationMin
  if (!rules.durationsMin.includes(duration)) fail(ERROR_CODES.INVALID_ARGUMENT, 'Durasi tidak tersedia.')

  const roomId = randomId()
  const createdAt = now()
  const meta = { hostUid: uid, durationMin: duration, createdAt, expiresAt: createdAt + rules.roomTtlMs }
  // [TERBUKA] meta.mode hanya di mock; rules Firebase belum mengenal mode demo
  if (isDemo) meta.mode = MODES.DEMO

  state.db.rooms[roomId] = { meta }
  commit(roomId)
  return roomId
}

export function openRoom(uid, roomId) {
  const room = state.db.rooms[roomId] ?? null
  const { route, join } = resolveRoomEntry(room, uid, now())
  if (join) {
    room.guestUid = uid
    commit(roomId)
  }
  return route
}

export function setDuration(uid, roomId, durationMin) {
  const room = getRoom(roomId)
  requireHost(room, uid)
  requireLobby(room)
  if (!getRoomRules(room).durationsMin.includes(durationMin)) fail(ERROR_CODES.INVALID_ARGUMENT, 'Durasi tidak tersedia.')
  room.meta.durationMin = durationMin
  commit(roomId)
}

export function setNotes(uid, roomId, text) {
  const room = getRoom(roomId)
  requirePlayer(room, uid)
  requireLobby(room)
  const rules = getRoomRules(room)
  if (!validateNotes(text, rules)) {
    fail(ERROR_CODES.INVALID_ARGUMENT, `Notes harus 1 sampai ${rules.notes.maxLength} karakter.`)
  }
  room.notes = { ...room.notes, [uid]: text }
  commit(roomId)
}

export function requestStart(uid, roomId) {
  const room = getRoom(roomId)
  requireHost(room, uid)
  if (!canRequestStart(room, now())) fail(ERROR_CODES.PERMISSION_DENIED, 'Lawan dan Notes 2/2 dibutuhkan sebelum mulai.')
  room.startRequested = true
  commit(roomId)
}

export function cancelStart(uid, roomId) {
  const room = getRoom(roomId)
  requirePlayer(room, uid)
  requireLobby(room)
  room.startRequested = false
  delete room.ready
  commit(roomId)
}

export function confirmReady(uid, roomId) {
  const room = getRoom(roomId)
  requirePlayer(room, uid)
  requireLobby(room)
  if (room.startRequested !== true) fail(ERROR_CODES.PERMISSION_DENIED, 'Host belum menekan Mulai Adu Fokus.')
  room.ready = { ...room.ready, [uid]: true }
  commit(roomId)
}

export function startBattle(uid, roomId) {
  const room = getRoom(roomId)
  requireHost(room, uid)
  requireLobby(room)
  if (!canStartBattle(room)) fail(ERROR_CODES.PERMISSION_DENIED, 'Kedua pemain belum siap.')
  const rules = getRoomRules(room)
  room.battle = {
    startedAt: now(),
    checkIns: generateCheckInSchedule(room.meta.durationMin, rules),
  }
  commit(roomId)
}

export function setPresence(uid, roomId, online) {
  const room = getRoom(roomId)
  requirePlayer(room, uid)
  room.presence = { ...room.presence, [uid]: { online, lastSeen: now() } }
  commit(roomId)
}

export function answerCheckIn(uid, roomId, index) {
  const room = getRoom(roomId)
  requirePlayer(room, uid)
  const at = now()
  if (!canAnswerCheckIn(room, uid, index, at)) fail(ERROR_CODES.PERMISSION_DENIED, 'Waktu menjawab Check-In sudah lewat.')
  room.responses = { ...room.responses, [uid]: { ...room.responses?.[uid], [index]: at } }
  commit(roomId)
}

function writeResult(roomId, room, result) {
  if (room.result) fail(ERROR_CODES.ALREADY_EXISTS, 'Hasil battle sudah tercatat.')
  room.result = { ...result, at: now() }
  commit(roomId)
}

export function forfeit(uid, roomId) {
  const room = getRoom(roomId)
  requirePlayer(room, uid)
  if (getRoomStatus(room, now()) !== ROOM_STATUS.RUNNING) fail(ERROR_CODES.PERMISSION_DENIED, 'Battle tidak sedang berjalan.')
  writeResult(roomId, room, createForfeitResult(room, uid))
}

export function claimResult(uid, roomId, claim) {
  const room = getRoom(roomId)
  requirePlayer(room, uid)
  if (room.result) fail(ERROR_CODES.ALREADY_EXISTS, 'Hasil battle sudah tercatat.')
  // Keluar sengaja hanya boleh diklaim oleh pemain yang keluar
  const forfeitByOther = claim?.reason === 'forfeit' && claim.loserUid !== uid
  if (forfeitByOther || !isClaimValid(room, claim, now())) {
    fail(ERROR_CODES.PERMISSION_DENIED, 'Hasil belum memenuhi syarat.')
  }
  writeResult(roomId, room, claim)
}

// Menulis users/{uid}/history/{roomId}. Mode demo tidak memberi poin.
export function applyPoints(uid, roomId) {
  const room = getRoom(roomId)
  requirePlayer(room, uid)
  if (!room.result) fail(ERROR_CODES.PERMISSION_DENIED, 'Battle belum selesai.')
  if (!getRules(room.meta.mode).awardsPoints) return null

  const user = state.db.users[uid]
  if (user.history?.[roomId]) fail(ERROR_CODES.ALREADY_EXISTS, 'Poin room ini sudah dicatat.')

  const entry = buildHistoryEntry(room, uid, getUserName(getOpponentUid(room, uid)) || 'Lawan', now())
  user.history = { ...user.history, [roomId]: entry }
  commit(roomId)
  return entry
}
