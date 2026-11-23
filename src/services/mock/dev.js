// Lawan tiruan untuk panel dev (hanya mock). Bertindak seperti klien Firebase milik lawan:
// menjawab Check-In, memulai battle bila ia host, dan menulis hasil saat wasit memutuskan.

import { MODES } from '../../config/gameRules.js'
import { canAnswerCheckIn, canStartBattle, evaluateBattle, getActiveCheckIn, getCheckInWindows, isPlayer } from '../../domain/referee.js'
import * as ops from './ops.js'
import { now, resetStore, state } from './store.js'

export const BOT = Object.freeze({ uid: 'bot-lawan', name: 'Lawan Uji' })

// Notes contoh dari Figma (popup Notes pemenang)
const BOT_NOTES = 'Traktir es teh di kantin FTI.'
// Lawan tiruan menjawab beberapa detik setelah Check-In muncul, seperti manusia
const BOT_ANSWER_DELAY_MS = 3000
const TICK_MS = 1000

// Check-In yang sengaja dilewatkan, kunci "roomId:index". Hanya di memori tab ini.
const skipped = new Set()

function ensureBot() {
  if (!state.db.users[BOT.uid]) ops.createUser(BOT.uid, BOT.name)
}

export function createRoomAsBot({ mode = MODES.NORMAL } = {}) {
  ensureBot()
  const roomId = ops.createRoom(BOT.uid, { mode })
  ops.setPresence(BOT.uid, roomId, true)
  return roomId
}

export function join(roomId) {
  ensureBot()
  const route = ops.openRoom(BOT.uid, roomId)
  if (route === 'guest_lobby' || route === 'host_lobby') ops.setPresence(BOT.uid, roomId, true)
  return route
}

export function fillNotes(roomId) {
  ops.setNotes(BOT.uid, roomId, BOT_NOTES)
}

// Bila lawan tiruan adalah host dan belum menekan Mulai, tombol ini menekan Mulai.
// Selain itu menekan "Aku siap".
export function ready(roomId) {
  const room = state.db.rooms[roomId]
  if (room?.meta.hostUid === BOT.uid && room.startRequested !== true) ops.requestStart(BOT.uid, roomId)
  else ops.confirmReady(BOT.uid, roomId)
}

export function cancel(roomId) {
  ops.cancelStart(BOT.uid, roomId)
}

export function disconnect(roomId) {
  ops.setPresence(BOT.uid, roomId, false)
}

export function reconnect(roomId) {
  ops.setPresence(BOT.uid, roomId, true)
}

// Melewatkan Check-In yang sedang aktif, atau yang berikutnya. Mengembalikan indeksnya.
export function skipNextCheckIn(roomId) {
  const room = state.db.rooms[roomId]
  const at = now()
  const target = getActiveCheckIn(room, at) ?? getCheckInWindows(room).find((window) => window.openAt > at)
  if (!target) return null
  skipped.add(`${roomId}:${target.index}`)
  return target.index
}

export function forfeit(roomId) {
  ops.forfeit(BOT.uid, roomId)
}

export function resetMockData() {
  skipped.clear()
  resetStore()
}

function isBotOnline(room) {
  return room.presence?.[BOT.uid]?.online !== false
}

// Galat di sini wajar (misalnya tab lain menulis hasil lebih dulu), jadi diabaikan
function attempt(action) {
  try {
    action()
  } catch {
    // diabaikan
  }
}

function tick() {
  const at = now()
  for (const [roomId, room] of Object.entries(state.db.rooms)) {
    if (!isPlayer(room, BOT.uid) || !isBotOnline(room)) continue

    if (room.meta.hostUid === BOT.uid && canStartBattle(room)) attempt(() => ops.startBattle(BOT.uid, roomId))

    const active = getActiveCheckIn(room, at)
    if (
      active &&
      at >= active.openAt + BOT_ANSWER_DELAY_MS &&
      !skipped.has(`${roomId}:${active.index}`) &&
      canAnswerCheckIn(room, BOT.uid, active.index, at)
    ) {
      attempt(() => ops.answerCheckIn(BOT.uid, roomId, active.index))
    }

    const verdict = evaluateBattle(state.db.rooms[roomId], at)
    if (verdict) attempt(() => ops.claimResult(BOT.uid, roomId, verdict))

    const latest = state.db.rooms[roomId]
    if (latest.result && !state.db.users[BOT.uid]?.history?.[roomId]) attempt(() => ops.applyPoints(BOT.uid, roomId))
  }
}

let timer = null

export function startBotTicker() {
  if (timer === null) timer = setInterval(tick, TICK_MS)
}

export function stopBotTicker() {
  clearInterval(timer)
  timer = null
}

// Untuk tes: jalankan satu putaran tanpa interval
export const runBotTick = tick
