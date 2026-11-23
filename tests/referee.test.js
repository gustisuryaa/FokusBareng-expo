import { describe, expect, it } from 'vitest'
import { DEMO_RULES, NORMAL_RULES } from '../src/config/gameRules.js'
import {
  ROOM_STATUS,
  buildHistoryEntry,
  canAnswerCheckIn,
  canReadNotes,
  canRequestStart,
  canStartBattle,
  createForfeitResult,
  evaluateBattle,
  generateCheckInSchedule,
  getActiveCheckIn,
  getRoomStatus,
  isClaimValid,
  isLobbyEditable,
  resolveRoomEntry,
  validateNotes,
} from '../src/domain/referee.js'

// Skenario dari docs/keputusan-aturan.md bagian 6. Waktu dalam ms, semuanya "waktu server".
const HOST = 'host'
const GUEST = 'tamu'
const START = 1_000_000
const WINDOW = NORMAL_RULES.checkIn.responseWindowMs // 20 detik
const TOL = NORMAL_RULES.disconnectToleranceMs // 10 detik
const T0 = START + 240_000 // Check-In ke-0 keluar di menit ke-4
const D0 = T0 + WINDOW
const END = START + 25 * 60_000

function lobbyRoom(overrides = {}) {
  return {
    meta: { hostUid: HOST, durationMin: 25, createdAt: START - 60_000, expiresAt: START + 29 * 60_000 },
    guestUid: GUEST,
    startRequested: true,
    ready: { [HOST]: true, [GUEST]: true },
    notes: { [HOST]: 'Traktir es teh di kantin FTI.', [GUEST]: 'Bersihkan meja lab setelah praktikum.' },
    ...overrides,
  }
}

function runningRoom(overrides = {}) {
  return lobbyRoom({
    battle: { startedAt: START, checkIns: [{ offsetMs: 240_000 }, { offsetMs: 600_000 }] },
    presence: {
      [HOST]: { online: true, lastSeen: START },
      [GUEST]: { online: true, lastSeen: START },
    },
    responses: {},
    ...overrides,
  })
}

describe('wasit: Check-In', () => {
  it('1. kedua pemain menjawab, battle berlanjut', () => {
    const room = runningRoom({ responses: { [HOST]: { 0: T0 + 5_000 }, [GUEST]: { 0: T0 + 9_000 } } })
    expect(evaluateBattle(room, D0 + 1)).toBeNull()
  })

  it('2. satu pemain tidak menjawab: pemain itu kalah', () => {
    const room = runningRoom({ responses: { [GUEST]: { 0: T0 + 3_000 } } })
    expect(evaluateBattle(room, D0 - 1)).toBeNull()
    expect(evaluateBattle(room, D0 + 1)).toEqual({
      outcome: 'win',
      reason: 'missed_checkin',
      winnerUid: GUEST,
      loserUid: HOST,
      checkInIndex: 0,
    })
  })

  it('3. kedua pemain tidak menjawab Check-In yang sama: seri', () => {
    expect(evaluateBattle(runningRoom(), D0 + 1)).toEqual({
      outcome: 'draw',
      reason: 'missed_checkin',
      checkInIndex: 0,
    })
  })

  it('4. jawaban di detik ke-19,9 diterima', () => {
    const room = runningRoom()
    expect(canAnswerCheckIn(room, HOST, 0, T0 + 19_900)).toBe(true)
    const answered = runningRoom({ responses: { [HOST]: { 0: T0 + 19_900 }, [GUEST]: { 0: T0 + 1_000 } } })
    expect(evaluateBattle(answered, D0 + 1)).toBeNull()
  })

  it('5. jawaban setelah batas ditolak', () => {
    const room = runningRoom({ responses: { [GUEST]: { 0: T0 + 1_000 } } })
    expect(canAnswerCheckIn(room, HOST, 0, D0 + 1)).toBe(false)
    // Kalaupun tersimpan, jawaban terlambat tidak dihitung
    const late = runningRoom({ responses: { [HOST]: { 0: D0 + 1 }, [GUEST]: { 0: T0 + 1_000 } } })
    expect(evaluateBattle(late, D0 + 2)).toMatchObject({ outcome: 'win', loserUid: HOST })
  })

  it('Check-In aktif dihitung dari startedAt + offsetMs (opsi A)', () => {
    const room = runningRoom()
    expect(getActiveCheckIn(room, T0 - 1)).toBeNull()
    expect(getActiveCheckIn(room, T0 + 1)).toMatchObject({ index: 0, openAt: T0, deadline: D0 })
    expect(getActiveCheckIn(room, D0 + 1)).toBeNull()
  })

  it('tidak bisa menjawab dua kali atau sebelum Check-In keluar', () => {
    expect(canAnswerCheckIn(runningRoom(), HOST, 0, T0 - 1)).toBe(false)
    const answered = runningRoom({ responses: { [HOST]: { 0: T0 + 1_000 } } })
    expect(canAnswerCheckIn(answered, HOST, 0, T0 + 2_000)).toBe(false)
  })
})

describe('wasit: koneksi', () => {
  const LOST = START + 60_000

  it('6. putus 8 detik lalu kembali: tidak kalah', () => {
    const offline = runningRoom({ presence: { [HOST]: { online: false, lastSeen: LOST }, [GUEST]: { online: true, lastSeen: START } } })
    expect(evaluateBattle(offline, LOST + 8_000)).toBeNull()
    const back = runningRoom({ presence: { [HOST]: { online: true, lastSeen: LOST + 8_000 }, [GUEST]: { online: true, lastSeen: START } } })
    expect(evaluateBattle(back, LOST + 9_000)).toBeNull()
  })

  it('7. putus 11 detik: kalah', () => {
    const offline = runningRoom({ presence: { [HOST]: { online: false, lastSeen: LOST }, [GUEST]: { online: true, lastSeen: START } } })
    expect(evaluateBattle(offline, LOST + 11_000)).toEqual({
      outcome: 'win',
      reason: 'disconnect',
      winnerUid: GUEST,
      loserUid: HOST,
    })
  })

  it('8. putus di tengah jendela Check-In, kembali sebelum batas lalu menjawab: tidak kalah', () => {
    const room = runningRoom({
      presence: { [HOST]: { online: true, lastSeen: T0 + 18_000 }, [GUEST]: { online: true, lastSeen: START } },
      responses: { [HOST]: { 0: T0 + 19_000 }, [GUEST]: { 0: T0 + 2_000 } },
    })
    expect(evaluateBattle(room, D0 + 1)).toBeNull()
  })

  it('8b. masih terputus saat batas Check-In: vonis menunggu toleransi, alasannya disconnect', () => {
    const room = runningRoom({
      presence: { [HOST]: { online: false, lastSeen: T0 + 15_000 }, [GUEST]: { online: true, lastSeen: START } },
      responses: { [GUEST]: { 0: T0 + 2_000 } },
    })
    // E(p) = max(D, lostAt + tol) = T0 + 25 detik
    expect(evaluateBattle(room, D0 + 1)).toBeNull()
    expect(evaluateBattle(room, T0 + 25_001)).toEqual({
      outcome: 'win',
      reason: 'disconnect',
      winnerUid: GUEST,
      loserUid: HOST,
    })
  })

  it('kedua pemain melewati toleransi putus: seri', () => {
    const room = runningRoom({
      presence: { [HOST]: { online: false, lastSeen: LOST }, [GUEST]: { online: false, lastSeen: LOST + 3_000 } },
    })
    expect(evaluateBattle(room, LOST + 20_000)).toEqual({ outcome: 'draw', reason: 'disconnect' })
  })

  it('satu pemain melewatkan Check-In, lawannya masih punya waktu karena terputus: vonis ditunda', () => {
    // Bila lawan akhirnya juga melewatkan Check-In yang sama, hasilnya seri, jadi belum boleh diputus.
    const room = runningRoom({
      presence: { [HOST]: { online: true, lastSeen: START }, [GUEST]: { online: false, lastSeen: T0 + 15_000 } },
    })
    expect(evaluateBattle(room, D0 + 1)).toBeNull()
    expect(evaluateBattle(room, T0 + 25_001)).toEqual({ outcome: 'draw', reason: 'missed_checkin', checkInIndex: 0 })
  })
})

describe('wasit: akhir battle dan klaim hasil', () => {
  const allAnswered = { [HOST]: { 0: T0 + 1_000, 1: START + 601_000 }, [GUEST]: { 0: T0 + 1_000, 1: START + 601_000 } }

  it('timer habis tanpa yang kalah: seri timeup', () => {
    const room = runningRoom({ responses: allAnswered })
    expect(evaluateBattle(room, END - 1)).toBeNull()
    expect(evaluateBattle(room, END)).toEqual({ outcome: 'draw', reason: 'timeup' })
  })

  it('putus setelah timer habis tidak mengubah hasil', () => {
    const room = runningRoom({
      responses: allAnswered,
      presence: { [HOST]: { online: false, lastSeen: END - 2_000 }, [GUEST]: { online: true, lastSeen: START } },
    })
    expect(evaluateBattle(room, END + 30_000)).toEqual({ outcome: 'draw', reason: 'timeup' })
  })

  it('9. vonis kalah yang ditulis sebelum batas waktu ditolak', () => {
    const room = runningRoom({ responses: { [GUEST]: { 0: T0 + 1_000 } } })
    const claim = { outcome: 'win', reason: 'missed_checkin', winnerUid: GUEST, loserUid: HOST, checkInIndex: 0 }
    expect(isClaimValid(room, claim, D0 - 1)).toBe(false)
    expect(isClaimValid(room, claim, D0 + 1)).toBe(true)
    expect(isClaimValid(room, { ...claim, winnerUid: HOST, loserUid: GUEST }, D0 + 1)).toBe(false)
  })

  it('12. keluar sengaja: pemain itu kalah dengan reason forfeit', () => {
    const room = runningRoom()
    const result = createForfeitResult(room, HOST)
    expect(result).toEqual({ outcome: 'win', reason: 'forfeit', winnerUid: GUEST, loserUid: HOST })
    expect(isClaimValid(room, result, START + 1_000)).toBe(true)
  })

  it('tidak ada vonis untuk room yang belum berjalan atau sudah selesai', () => {
    expect(evaluateBattle(lobbyRoom(), START + 999_999)).toBeNull()
    const finished = runningRoom({ result: { outcome: 'draw', reason: 'timeup', at: END } })
    expect(evaluateBattle(finished, END + 1)).toBeNull()
  })
})

describe('Notes, poin, dan Lobi', () => {
  it('11. Notes lawan hanya terbaca bila lawan menang', () => {
    const running = runningRoom()
    expect(canReadNotes(running, GUEST, HOST)).toBe(false)
    expect(canReadNotes(running, HOST, HOST)).toBe(true)

    const draw = runningRoom({ result: { outcome: 'draw', reason: 'timeup', at: END } })
    expect(canReadNotes(draw, GUEST, HOST)).toBe(false)

    const hostWon = runningRoom({
      result: { outcome: 'win', reason: 'forfeit', winnerUid: HOST, loserUid: GUEST, at: START + 5_000 },
    })
    expect(canReadNotes(hostWon, GUEST, HOST)).toBe(true)
    expect(canReadNotes(hostWon, HOST, GUEST)).toBe(false)
    expect(canReadNotes(hostWon, 'orang-lain', HOST)).toBe(false)
  })

  it('13. nilai poin cocok dengan hasil', () => {
    const at = START + 10 * 60_000 + 30_000
    const room = runningRoom({ result: { outcome: 'win', reason: 'forfeit', winnerUid: HOST, loserUid: GUEST, at } })
    expect(buildHistoryEntry(room, HOST, 'Naufal', at + 1)).toEqual({
      delta: NORMAL_RULES.points.win,
      outcome: 'win',
      focusMin: 10,
      opponentName: 'Naufal',
      at: at + 1,
    })
    expect(buildHistoryEntry(room, GUEST, 'Gusti', at + 1)).toMatchObject({ delta: NORMAL_RULES.points.lose, outcome: 'loss' })
    const draw = runningRoom({ result: { outcome: 'draw', reason: 'timeup', at: END } })
    expect(buildHistoryEntry(draw, GUEST, 'Gusti', END)).toMatchObject({ delta: NORMAL_RULES.points.draw, outcome: 'draw', focusMin: 25 })
    const lateDraw = runningRoom({ result: { outcome: 'draw', reason: 'timeup', at: END + 90_000 } })
    expect(buildHistoryEntry(lateDraw, GUEST, 'Gusti', END + 90_000).focusMin).toBe(25)
  })

  it('14. orang ketiga tidak bisa masuk room berisi 2 orang', () => {
    const room = lobbyRoom({ startRequested: false, ready: {} })
    expect(resolveRoomEntry(room, 'orang-ketiga', START)).toEqual({ route: 'full', join: false })
    expect(resolveRoomEntry(room, HOST, START)).toEqual({ route: 'host_lobby', join: false })
    expect(resolveRoomEntry(room, GUEST, START)).toEqual({ route: 'guest_lobby', join: false })
    const open = lobbyRoom({ guestUid: undefined })
    expect(resolveRoomEntry(open, 'tamu-baru', START)).toEqual({ route: 'guest_lobby', join: true })
  })

  it('tabel membuka tautan room: berjalan, selesai, kedaluwarsa, tidak ada', () => {
    expect(resolveRoomEntry(runningRoom(), GUEST, START + 1)).toEqual({ route: 'arena', join: false })
    const finished = runningRoom({ result: { outcome: 'draw', reason: 'timeup', at: END } })
    expect(resolveRoomEntry(finished, HOST, END + 1)).toEqual({ route: 'result', join: false })
    const expired = lobbyRoom({ guestUid: undefined })
    expect(resolveRoomEntry(expired, HOST, START + 30 * 60_000)).toEqual({ route: 'invalid', join: false })
    expect(resolveRoomEntry(null, HOST, START)).toEqual({ route: 'invalid', join: false })
  })

  it('15. battle tidak bisa dimulai bila Notes belum 2/2 atau salah satu belum siap', () => {
    expect(canStartBattle(lobbyRoom())).toBe(true)
    expect(canStartBattle(lobbyRoom({ notes: { [HOST]: 'x' } }))).toBe(false)
    expect(canStartBattle(lobbyRoom({ ready: { [HOST]: true } }))).toBe(false)
    expect(canStartBattle(lobbyRoom({ startRequested: false }))).toBe(false)
    expect(canRequestStart(lobbyRoom({ startRequested: false, ready: {} }), START)).toBe(true)
    expect(canRequestStart(lobbyRoom({ notes: { [HOST]: 'x' }, startRequested: false }), START)).toBe(false)
    expect(canRequestStart(lobbyRoom({ guestUid: undefined, startRequested: false }), START)).toBe(false)
  })

  it('16. durasi dan Notes terkunci setelah battle mulai; Notes kosong atau > 140 ditolak', () => {
    expect(isLobbyEditable(lobbyRoom(), START)).toBe(true)
    expect(isLobbyEditable(runningRoom(), START)).toBe(false)
    expect(validateNotes('')).toBe(false)
    expect(validateNotes('   ')).toBe(false)
    expect(validateNotes('a'.repeat(140))).toBe(true)
    expect(validateNotes('a'.repeat(141))).toBe(false)
  })

  it('status room dihitung, tidak disimpan', () => {
    expect(getRoomStatus(lobbyRoom({ guestUid: undefined }), START)).toBe(ROOM_STATUS.WAITING)
    expect(getRoomStatus(lobbyRoom(), START)).toBe(ROOM_STATUS.READY)
    expect(getRoomStatus(runningRoom(), START + 1)).toBe(ROOM_STATUS.RUNNING)
    expect(getRoomStatus(runningRoom({ result: { outcome: 'draw', reason: 'timeup', at: END } }), END)).toBe(ROOM_STATUS.FINISHED)
    expect(getRoomStatus(lobbyRoom(), START + 30 * 60_000)).toBe(ROOM_STATUS.EXPIRED)
  })
})

describe('jadwal Check-In', () => {
  it('normal: pertama menit 4 sampai 8, jarak 4 sampai 8 menit, tidak di 60 detik terakhir', () => {
    for (const random of [() => 0, () => 0.5, () => 0.999]) {
      for (const durationMin of NORMAL_RULES.durationsMin) {
        const schedule = generateCheckInSchedule(durationMin, NORMAL_RULES, random)
        expect(schedule.length).toBeGreaterThan(0)
        expect(schedule[0].offsetMs).toBeGreaterThanOrEqual(240_000)
        expect(schedule[0].offsetMs).toBeLessThanOrEqual(480_000)
        for (let i = 1; i < schedule.length; i++) {
          const gap = schedule[i].offsetMs - schedule[i - 1].offsetMs
          expect(gap).toBeGreaterThanOrEqual(240_000)
          expect(gap).toBeLessThanOrEqual(480_000)
        }
        const last = schedule[schedule.length - 1].offsetMs
        expect(last).toBeLessThanOrEqual(durationMin * 60_000 - NORMAL_RULES.checkIn.quietEndMs)
      }
    }
  })

  it('demo 3 menit: pertama mulai detik ke-30, tidak di 30 detik terakhir', () => {
    const schedule = generateCheckInSchedule(3, DEMO_RULES, () => 0)
    expect(schedule[0].offsetMs).toBe(30_000)
    expect(schedule.length).toBeGreaterThanOrEqual(2)
    expect(schedule[schedule.length - 1].offsetMs).toBeLessThanOrEqual(150_000)
  })
})
