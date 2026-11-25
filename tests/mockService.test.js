import { beforeEach, describe, expect, it } from 'vitest'
import { NORMAL_RULES } from '../src/config/gameRules.js'
import { getActiveCheckIn, getCheckInWindows } from '../src/domain/referee.js'
import * as ops from '../src/services/mock/ops.js'
import * as bot from '../src/services/mock/dev.js'
import * as mock from '../src/services/mock/index.js'
import { resetStore, setClock, state } from '../src/services/mock/store.js'
import { ERROR_CODES } from '../src/services/errors.js'

// Skenario keputusan-aturan.md bagian 6 yang butuh "database": 10, 13, 14, 15, 16,
// ditambah alur penuh Lobi sampai Hasil memakai mock.
let time = 1_000_000
const HOST = 'host'
const GUEST = 'tamu'

function code(fn) {
  try {
    fn()
  } catch (error) {
    return error.code
  }
  return null
}

function lobbyWithGuest() {
  const roomId = ops.createRoom(HOST, { durationMin: 15 })
  ops.openRoom(GUEST, roomId)
  ops.setNotes(HOST, roomId, 'Traktir es teh di kantin FTI.')
  ops.setNotes(GUEST, roomId, 'Bersihkan meja lab setelah praktikum.')
  return roomId
}

function startedRoom() {
  const roomId = lobbyWithGuest()
  ops.requestStart(HOST, roomId)
  ops.confirmReady(HOST, roomId)
  ops.confirmReady(GUEST, roomId)
  ops.startBattle(HOST, roomId)
  ops.setPresence(HOST, roomId, true)
  ops.setPresence(GUEST, roomId, true)
  return roomId
}

beforeEach(() => {
  resetStore()
  time = 1_000_000
  setClock(() => time)
  ops.createUser(HOST, 'Gusti')
  ops.createUser(GUEST, 'Naufal')
})

describe('mock services', () => {
  it('daftar, masuk, keluar', async () => {
    const user = await mock.signUp({ name: 'Gusti', email: 'Gusti@students.uii.ac.id', password: 'rahasia1' })
    expect(user.name).toBe('Gusti')
    await mock.signOut()
    await expect(mock.signIn({ email: 'gusti@students.uii.ac.id', password: 'salah' })).rejects.toMatchObject({
      code: 'auth/invalid-credential',
    })
    await expect(mock.signUp({ name: 'Lain', email: 'gusti@students.uii.ac.id', password: 'rahasia2' })).rejects.toMatchObject({
      code: 'auth/email-already-in-use',
    })
    expect((await mock.signIn({ email: 'gusti@students.uii.ac.id', password: 'rahasia1' })).uid).toBe(user.uid)
  })

  it('bentuk room sama dengan struktur-data.md', () => {
    const roomId = startedRoom()
    const room = state.db.rooms[roomId]
    expect(Object.keys(room).sort()).toEqual(
      ['battle', 'guestUid', 'meta', 'notes', 'presence', 'ready', 'startRequested'].sort(),
    )
    expect(Object.keys(room.meta).sort()).toEqual(['createdAt', 'durationMin', 'expiresAt', 'hostUid'])
    expect(room.battle.startedAt).toBe(time)
    expect(room.battle.checkIns[0].offsetMs).toBeGreaterThanOrEqual(NORMAL_RULES.checkIn.firstAtMs)
  })

  it('14. orang ketiga melihat room penuh', () => {
    const roomId = lobbyWithGuest()
    expect(ops.openRoom('orang-ketiga', roomId)).toBe('full')
    expect(state.db.rooms[roomId].guestUid).toBe(GUEST)
    expect(ops.openRoom(HOST, 'tidak-ada')).toBe('invalid')
  })

  it('15. battle tidak bisa dimulai sebelum Notes 2/2 dan kedua siap', () => {
    const roomId = ops.createRoom(HOST)
    ops.openRoom(GUEST, roomId)
    ops.setNotes(HOST, roomId, 'Traktir es teh di kantin FTI.')
    expect(code(() => ops.requestStart(HOST, roomId))).toBe('permission-denied')
    ops.setNotes(GUEST, roomId, 'Bersihkan meja lab.')
    expect(code(() => ops.confirmReady(GUEST, roomId))).toBe('permission-denied')
    ops.requestStart(HOST, roomId)
    ops.confirmReady(HOST, roomId)
    expect(code(() => ops.startBattle(HOST, roomId))).toBe('permission-denied')
    ops.cancelStart(GUEST, roomId)
    expect(state.db.rooms[roomId].ready).toBeUndefined()
    expect(state.db.rooms[roomId].startRequested).toBe(false)
  })

  it('room kedaluwarsa tidak bisa memulai battle walau kedua pemain sudah siap', () => {
    const roomId = lobbyWithGuest()
    ops.requestStart(HOST, roomId)
    ops.confirmReady(HOST, roomId)
    ops.confirmReady(GUEST, roomId)
    time += NORMAL_RULES.roomTtlMs + 1
    expect(code(() => ops.startBattle(HOST, roomId))).toBe('permission-denied')
  })

  it('16. durasi dan Notes terkunci setelah battle mulai; tamu tidak bisa ubah durasi', () => {
    const roomId = lobbyWithGuest()
    expect(code(() => ops.setDuration(GUEST, roomId, 45))).toBe('permission-denied')
    ops.setDuration(HOST, roomId, 45)
    expect(code(() => ops.setNotes(HOST, roomId, 'a'.repeat(141)))).toBe('invalid-argument')
    ops.requestStart(HOST, roomId)
    ops.confirmReady(HOST, roomId)
    ops.confirmReady(GUEST, roomId)
    ops.startBattle(HOST, roomId)
    expect(code(() => ops.setDuration(HOST, roomId, 60))).toBe('permission-denied')
    expect(code(() => ops.setNotes(GUEST, roomId, 'ganti'))).toBe('permission-denied')
  })

  it('9 dan 10. vonis sebelum waktunya ditolak; dua vonis bersamaan hanya yang pertama tersimpan', () => {
    const roomId = startedRoom()
    const [first] = getCheckInWindows(state.db.rooms[roomId])
    time = first.openAt + 2_000
    ops.answerCheckIn(GUEST, roomId, first.index)
    const claim = { outcome: 'win', reason: 'missed_checkin', winnerUid: GUEST, loserUid: HOST, checkInIndex: first.index }

    expect(code(() => ops.claimResult(GUEST, roomId, claim))).toBe('permission-denied')
    time = first.deadline + 1
    expect(code(() => ops.answerCheckIn(HOST, roomId, first.index))).toBe('permission-denied')
    ops.claimResult(GUEST, roomId, claim)
    expect(code(() => ops.claimResult(HOST, roomId, claim))).toBe('already-exists')
    expect(state.db.rooms[roomId].result).toMatchObject({ ...claim, at: time })
  })

  it('12. keluar sengaja tidak bisa diklaim atas nama lawan', () => {
    const roomId = startedRoom()
    const forged = { outcome: 'win', reason: 'forfeit', winnerUid: HOST, loserUid: GUEST }
    expect(code(() => ops.claimResult(HOST, roomId, forged))).toBe('permission-denied')
    ops.forfeit(GUEST, roomId)
    expect(state.db.rooms[roomId].result).toMatchObject(forged)
  })

  it('13. poin satu room hanya sekali dan cocok dengan hasil; profil menghitung gelar', () => {
    const roomId = startedRoom()
    time += 5 * 60_000
    ops.forfeit(GUEST, roomId)
    expect(ops.applyPoints(HOST, roomId)).toMatchObject({ delta: 30, outcome: 'win', focusMin: 5, opponentName: 'Naufal' })
    expect(code(() => ops.applyPoints(HOST, roomId))).toBe('already-exists')
    ops.applyPoints(GUEST, roomId)
    expect(ops.getProfile(HOST)).toMatchObject({ points: 30, tier: 'teralihkan', wins: 1, totalFocusMin: 5 })
    expect(ops.getProfile(GUEST)).toMatchObject({ points: 5, losses: 1 })
  })

  it('mode demo: durasi 3 menit dan tanpa poin', () => {
    const roomId = ops.createRoom(HOST, { mode: 'demo' })
    expect(state.db.rooms[roomId].meta).toMatchObject({ durationMin: 3, mode: 'demo' })
    ops.openRoom(GUEST, roomId)
    ops.setNotes(HOST, roomId, 'a')
    ops.setNotes(GUEST, roomId, 'b')
    ops.requestStart(HOST, roomId)
    ops.confirmReady(HOST, roomId)
    ops.confirmReady(GUEST, roomId)
    ops.startBattle(HOST, roomId)
    expect(state.db.rooms[roomId].battle.checkIns[0].offsetMs).toBeLessThan(60_000)
    ops.forfeit(GUEST, roomId)
    expect(ops.applyPoints(HOST, roomId)).toBeNull()
  })
})

describe('Belajar Mandiri (mock)', () => {
  it('menyimpan sesi milik sendiri dan menolak menit fokus yang mustahil', () => {
    const entry = { technique: 'pomodoro', focusMin: 25, startedAt: time - 30 * 60_000, endedAt: time, completed: false }
    const id = ops.saveSoloSession(HOST, entry)
    expect(ops.listSoloSessions(HOST)).toEqual({ [id]: entry })
    expect(ops.listSoloSessions(GUEST)).toEqual({})
    expect(code(() => ops.saveSoloSession(HOST, { ...entry, focusMin: 40 }))).toBe(ERROR_CODES.INVALID_ARGUMENT)
    expect(code(() => ops.saveSoloSession(HOST, { ...entry, technique: 'lain' }))).toBe(ERROR_CODES.INVALID_ARGUMENT)
  })
})

describe('lawan tiruan', () => {
  it('bergabung, menjawab Check-In, dan memenangkan battle saat kamu melewatkan Check-In', () => {
    const roomId = ops.createRoom(HOST, { durationMin: 15 })
    expect(bot.join(roomId)).toBe('guest_lobby')
    bot.fillNotes(roomId)
    ops.setNotes(HOST, roomId, 'Traktir es teh di kantin FTI.')
    ops.requestStart(HOST, roomId)
    bot.ready(roomId)
    ops.confirmReady(HOST, roomId)
    ops.startBattle(HOST, roomId)
    ops.setPresence(HOST, roomId, true)

    const [first] = getCheckInWindows(state.db.rooms[roomId])
    time = first.openAt + 3_000
    bot.runBotTick()
    expect(state.db.rooms[roomId].responses[bot.BOT.uid][first.index]).toBe(time)

    time = first.deadline + 1
    bot.runBotTick()
    expect(state.db.rooms[roomId].result).toMatchObject({ outcome: 'win', winnerUid: bot.BOT.uid, loserUid: HOST })
  })

  it('melewatkan Check-In sesuai perintah panel dan memulai battle bila ia host', () => {
    const roomId = bot.createRoomAsBot()
    expect(ops.openRoom(HOST, roomId)).toBe('guest_lobby')
    bot.fillNotes(roomId)
    ops.setNotes(HOST, roomId, 'Bersihkan meja lab.')
    bot.ready(roomId) // host tiruan menekan Mulai
    bot.ready(roomId) // lalu Aku siap
    ops.confirmReady(HOST, roomId)
    bot.runBotTick()
    expect(state.db.rooms[roomId].battle).toBeDefined()

    const index = bot.skipNextCheckIn(roomId)
    const window = getCheckInWindows(state.db.rooms[roomId])[index]
    time = window.openAt + 5_000
    ops.answerCheckIn(HOST, roomId, index)
    expect(getActiveCheckIn(state.db.rooms[roomId], time)).not.toBeNull()
    bot.runBotTick()
    expect(state.db.rooms[roomId].responses[bot.BOT.uid]).toBeUndefined()
    time = window.deadline + 1
    bot.runBotTick()
    expect(state.db.rooms[roomId].result).toMatchObject({ winnerUid: HOST, reason: 'missed_checkin' })
  })
})
