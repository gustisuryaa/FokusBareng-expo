// Wasit FokusBareng: fungsi murni tanpa Firebase, tanpa Vue, tanpa Date.now().
// Semua waktu yang masuk ke sini adalah waktu server (ms). Aturannya mengikuti
// docs/keputusan-aturan.md bagian 4, angkanya dari src/config/gameRules.js.
// Dipakai oleh mock service, klien Firebase, dan tes. Rules Firebase harus memutus hal yang sama.

import { getRules } from '../config/gameRules.js'

export const ROOM_STATUS = Object.freeze({
  WAITING: 'waiting', // belum ada tamu
  READY: 'ready', // ada tamu, battle belum mulai
  RUNNING: 'running',
  FINISHED: 'finished',
  EXPIRED: 'expired',
})

export const ROOM_ROUTE = Object.freeze({
  HOST_LOBBY: 'host_lobby',
  GUEST_LOBBY: 'guest_lobby',
  ARENA: 'arena',
  RESULT: 'result',
  FULL: 'full',
  INVALID: 'invalid',
})

// meta.mode hanya ada di room mode demo (lihat keputusan-aturan.md bagian 8)
export function getRoomRules(room) {
  return getRules(room?.meta?.mode)
}

export function getPlayers(room) {
  return [room?.meta?.hostUid, room?.guestUid].filter(Boolean)
}

export function isPlayer(room, uid) {
  return Boolean(uid) && getPlayers(room).includes(uid)
}

export function getOpponentUid(room, uid) {
  return getPlayers(room).find((playerUid) => playerUid !== uid) ?? null
}

export function getRoomStatus(room, now) {
  if (!room?.meta) return null
  if (room.result) return ROOM_STATUS.FINISHED
  if (room.battle) return ROOM_STATUS.RUNNING
  if (now > room.meta.expiresAt) return ROOM_STATUS.EXPIRED
  return room.guestUid ? ROOM_STATUS.READY : ROOM_STATUS.WAITING
}

// Tabel "membuka tautan room" di keputusan-aturan.md bagian 7.
// join = true artinya pembuka dicatat sebagai tamu.
export function resolveRoomEntry(room, uid, now) {
  const status = getRoomStatus(room, now)
  if (status === null || status === ROOM_STATUS.EXPIRED) return { route: ROOM_ROUTE.INVALID, join: false }

  if (isPlayer(room, uid)) {
    if (status === ROOM_STATUS.FINISHED) return { route: ROOM_ROUTE.RESULT, join: false }
    if (status === ROOM_STATUS.RUNNING) return { route: ROOM_ROUTE.ARENA, join: false }
    const route = uid === room.meta.hostUid ? ROOM_ROUTE.HOST_LOBBY : ROOM_ROUTE.GUEST_LOBBY
    return { route, join: false }
  }

  if (status === ROOM_STATUS.WAITING) return { route: ROOM_ROUTE.GUEST_LOBBY, join: true }
  return { route: ROOM_ROUTE.FULL, join: false }
}

// ---------- Lobi ----------

export function validateNotes(text, rules = getRules()) {
  if (typeof text !== 'string') return false
  const length = text.trim().length
  return length >= rules.notes.minLength && text.length <= rules.notes.maxLength
}

// Isi Notes rahasia (roomNotes), jadi yang dihitung adalah penanda notesSet di room
export function countNotes(room) {
  return getPlayers(room).filter((uid) => room.notesSet?.[uid] === true).length
}

export function isLobbyEditable(room, now) {
  const status = getRoomStatus(room, now)
  return status === ROOM_STATUS.WAITING || status === ROOM_STATUS.READY
}

// "Mulai Adu Fokus" oleh host: perlu tamu dan Notes 2/2
export function canRequestStart(room, now) {
  return getRoomStatus(room, now) === ROOM_STATUS.READY && countNotes(room) === 2
}

// Battle boleh ditulis host setelah kedua pemain menekan "Aku siap"
export function canStartBattle(room) {
  if (!room?.meta || room.battle || room.result || !room.guestUid) return false
  if (room.startRequested !== true || countNotes(room) !== 2) return false
  return getPlayers(room).every((uid) => room.ready?.[uid] === true)
}

// Jadwal Check-In (opsi A: ditulis sekali saat battle mulai).
// Pertama: firstAtMs + acak(0..rentang interval). Berikutnya: + acak(intervalMin..intervalMax).
// Tidak ada Check-In di quietEndMs terakhir. random disuntik supaya bisa dites.
export function generateCheckInSchedule(durationMin, rules, random = Math.random) {
  const { firstAtMs, intervalMinMs, intervalMaxMs, quietEndMs } = rules.checkIn
  const spread = intervalMaxMs - intervalMinMs
  const lastAllowed = durationMin * 60_000 - quietEndMs
  const schedule = []

  let offsetMs = firstAtMs + Math.floor(random() * (spread + 1))
  while (offsetMs <= lastAllowed) {
    schedule.push({ offsetMs })
    offsetMs += intervalMinMs + Math.floor(random() * (spread + 1))
  }

  // Durasi terpendek tetap mendapat satu Check-In
  if (schedule.length === 0 && firstAtMs <= lastAllowed) schedule.push({ offsetMs: firstAtMs })
  return schedule
}

// ---------- Arena ----------

export function getBattleEnd(room) {
  return room.battle.startedAt + room.meta.durationMin * 60_000
}

export function getRemainingMs(room, now) {
  if (!room?.battle) return null
  const end = room.result ? Math.min(room.result.at, getBattleEnd(room)) : getBattleEnd(room)
  return Math.max(0, end - now)
}

export function isEndingSoon(room, now) {
  const remaining = getRemainingMs(room, now)
  return remaining !== null && remaining > 0 && remaining <= getRoomRules(room).endingSoonMs
}

// Waktu buka dan batas setiap Check-In. Ini satu-satunya tempat yang membaca battle/checkIns,
// jadi kalau pindah ke opsi B cukup fungsi ini yang diganti.
export function getCheckInWindows(room) {
  if (!room?.battle?.checkIns) return []
  const { responseWindowMs } = getRoomRules(room).checkIn
  return Object.entries(room.battle.checkIns)
    .map(([index, checkIn]) => {
      const openAt = room.battle.startedAt + checkIn.offsetMs
      return { index: Number(index), openAt, deadline: openAt + responseWindowMs }
    })
    .sort((a, b) => a.openAt - b.openAt)
}

export function getActiveCheckIn(room, now) {
  if (!room?.battle || room.result) return null
  return getCheckInWindows(room).find((window) => now >= window.openAt && now <= window.deadline) ?? null
}

function getResponse(room, uid, index) {
  return room.responses?.[uid]?.[index]
}

function isResponseValid(window, respondedAt) {
  return typeof respondedAt === 'number' && respondedAt >= window.openAt && respondedAt <= window.deadline
}

export function canAnswerCheckIn(room, uid, index, now) {
  if (!isPlayer(room, uid) || !room.battle || room.result) return false
  const window = getCheckInWindows(room).find((item) => item.index === index)
  if (!window || getResponse(room, uid, index) !== undefined) return false
  return now >= window.openAt && now <= window.deadline
}

// Kapan pemain uid kalah menurut data saat ini, atau null bila belum ada alasan.
// Mengembalikan { at, reason, index? } dengan at = waktu kondisi kalah terpenuhi.
function findLoss(room, uid, rules) {
  const presence = room.presence?.[uid]
  const lostAt = presence && presence.online === false ? presence.lastSeen : null
  const disconnectAt = lostAt === null ? null : lostAt + rules.disconnectToleranceMs

  let missed = null
  for (const window of getCheckInWindows(room)) {
    if (isResponseValid(window, getResponse(room, uid, window.index))) continue

    // E(p): bila p sedang terputus dan hilangnya sebelum batas, vonis menunggu toleransi.
    // Catatan: jawaban tetap hanya sah sampai deadline, karena rules menolak respons di luar jendela.
    const lostInWindow = lostAt !== null && lostAt <= window.deadline
    const effectiveAt = lostInWindow ? Math.max(window.deadline, disconnectAt) : window.deadline
    missed = { at: effectiveAt, index: window.index }
    break
  }

  const candidates = []
  if (disconnectAt !== null) candidates.push({ at: disconnectAt, reason: 'disconnect', index: missed?.at === disconnectAt ? missed.index : undefined })
  if (missed) candidates.push({ at: missed.at, reason: 'missed_checkin', index: missed.index })
  if (candidates.length === 0) return null

  // Yang paling awal menentukan. Bila sama, putus didahulukan karena itu penyebabnya.
  candidates.sort((a, b) => a.at - b.at || (a.reason === 'disconnect' ? -1 : 1))
  return candidates[0]
}

function draw(reason, index) {
  return index === undefined ? { outcome: 'draw', reason } : { outcome: 'draw', reason, checkInIndex: index }
}

function win(winnerUid, loss) {
  const result = { outcome: 'win', reason: loss.reason, winnerUid, loserUid: loss.uid }
  if (loss.reason === 'missed_checkin') result.checkInIndex = loss.index
  return result
}

// Inti wasit: hasil battle pada waktu now, atau null bila battle masih berjalan
// (atau belum/sudah tidak bisa dinilai). Tidak menyertakan `at`; penulis hasil memakai waktu server.
export function evaluateBattle(room, now) {
  if (!room?.battle || room.result || !room.guestUid) return null
  const rules = getRoomRules(room)
  const end = getBattleEnd(room)
  const cutoff = Math.min(now, end)

  const losses = getPlayers(room).map((uid) => {
    const loss = findLoss(room, uid, rules)
    return loss ? { ...loss, uid } : null
  })
  const decided = losses.filter((loss) => loss && loss.at <= cutoff)

  if (decided.length === 0) {
    return now >= end ? draw('timeup') : null
  }

  if (decided.length === 2) {
    const [a, b] = decided
    if (a.reason === 'disconnect' && b.reason === 'disconnect') return draw('disconnect')
    if (a.index !== undefined && a.index === b.index) return draw('missed_checkin', a.index)
    if (a.at === b.at) return draw(a.reason, a.reason === 'missed_checkin' ? a.index : undefined)
    const loser = a.at < b.at ? a : b
    return win(getOpponentUid(room, loser.uid), loser)
  }

  // Hanya satu yang sudah kalah. Bila lawannya juga belum menjawab Check-In yang sama dan
  // masih punya waktu (sedang terputus), tunggu: hasilnya bisa seri.
  const [loser] = decided
  const other = losses.find((loss) => loss && loss.uid !== loser.uid)
  if (loser.index !== undefined && other?.index === loser.index && other.at > cutoff) return null

  return win(getOpponentUid(room, loser.uid), loser)
}

export function createForfeitResult(room, uid) {
  return { outcome: 'win', reason: 'forfeit', winnerUid: getOpponentUid(room, uid), loserUid: uid }
}

// Pemeriksaan klaim hasil (cermin rules): forfeit selalu sah untuk peserta,
// selain itu klaim harus sama persis dengan keputusan wasit pada waktu now.
export function isClaimValid(room, claim, now) {
  if (!room?.battle || room.result || !claim) return false

  if (claim.reason === 'forfeit') {
    return (
      claim.outcome === 'win' &&
      isPlayer(room, claim.loserUid) &&
      claim.winnerUid === getOpponentUid(room, claim.loserUid)
    )
  }

  const expected = evaluateBattle(room, now)
  if (!expected) return false
  const keys = ['outcome', 'reason', 'winnerUid', 'loserUid', 'checkInIndex']
  return keys.every((key) => expected[key] === claim[key])
}

// ---------- Hasil, Notes, poin ----------

export function getOutcomeFor(room, uid) {
  const result = room?.result
  if (!result || !isPlayer(room, uid)) return null
  if (result.outcome === 'draw') return 'draw'
  return result.winnerUid === uid ? 'win' : 'loss'
}

// Notes milik owner terbaca reader bila reader = owner, atau owner memenangkan battle
export function canReadNotes(room, readerUid, ownerUid) {
  if (!isPlayer(room, readerUid) || !isPlayer(room, ownerUid)) return false
  if (readerUid === ownerUid) return true
  return room.result?.outcome === 'win' && room.result.winnerUid === ownerUid
}

// Room yang dikirim ke layar: room.notes hanya berisi Notes yang boleh dibaca readerUid
// (milik sendiri, atau milik pemenang setelah hasil). notesByUid = roomNotes/{roomId}.
export function mergeReadableNotes(room, notesByUid, readerUid) {
  if (!room) return room
  const { notes: _ignored, ...rest } = room
  const notes = {}
  for (const [ownerUid, text] of Object.entries(notesByUid ?? {})) {
    if (typeof text === 'string' && canReadNotes(room, readerUid, ownerUid)) notes[ownerUid] = text
  }
  return Object.keys(notes).length > 0 ? { ...rest, notes } : rest
}

const DELTA_KEY = Object.freeze({ win: 'win', draw: 'draw', loss: 'lose' })

// Isi users/{uid}/history/{roomId}. now = waktu server saat ditulis.
export function buildHistoryEntry(room, uid, opponentName, now) {
  const outcome = getOutcomeFor(room, uid)
  if (!outcome) return null
  const rules = getRoomRules(room)
  return {
    delta: rules.points[DELTA_KEY[outcome]],
    outcome,
    // Dibatasi sampai akhir timer supaya hasil timeup yang ditulis terlambat tidak menambah menit
    focusMin: Math.floor((Math.min(room.result.at, getBattleEnd(room)) - room.battle.startedAt) / 60_000),
    opponentName,
    at: now,
  }
}
