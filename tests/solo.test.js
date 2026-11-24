import { describe, expect, it } from 'vitest'
import { SOLO_RULES } from '../src/config/gameRules.js'
import {
  answerCheckIn,
  buildSegments,
  buildSoloEntry,
  createSession,
  describeTechnique,
  formatDuration,
  getActiveCheckIn,
  getCheckInWindows,
  getMissedCheckIn,
  getPlanMs,
  getPosition,
  getTechnique,
  skipBreak,
  summarizeSolo,
} from '../src/domain/solo.js'

const MIN = 60_000
const START = 1_000_000

describe('rencana teknik', () => {
  it('Pomodoro: 4 fokus, 3 istirahat, total 1 jam 55 mnt (M11)', () => {
    const segments = buildSegments(getTechnique('pomodoro'))
    expect(segments.map((segment) => segment.kind)).toEqual(['focus', 'break', 'focus', 'break', 'focus', 'break', 'focus'])
    expect(formatDuration(getPlanMs(segments))).toBe('1 jam 55 mnt')
  })

  it('Satu blok memakai durasi pilihan tanpa istirahat', () => {
    const segments = buildSegments(getTechnique('block'), 45)
    expect(segments).toEqual([{ kind: 'focus', ms: 45 * MIN }])
    expect(formatDuration(getPlanMs(segments))).toBe('45 mnt')
  })

  it('deskripsi sama dengan teks Figma', () => {
    expect(describeTechnique(getTechnique('pomodoro'))).toBe('25 fokus · 5 istirahat · 4 putaran')
    expect(describeTechnique(getTechnique('long'))).toBe('50 fokus · 10 istirahat · 2 putaran')
    expect(describeTechnique(getTechnique('block'))).toBe('15, 25, 45, atau 60 menit tanpa istirahat')
  })
})

describe('posisi sesi', () => {
  const session = createSession({ techniqueId: 'pomodoro', checkIn: false, now: START })

  it('putaran 1 dari 4 dengan sisa waktu (M12)', () => {
    const position = getPosition(session, START + 6 * MIN + 40_000)
    expect(position).toMatchObject({ done: false, number: 1, count: 4, remainingMs: 18 * MIN + 20_000 })
    expect(position.segment.kind).toBe('focus')
  })

  it('istirahat 1 dari 3 setelah fokus pertama (M13)', () => {
    const position = getPosition(session, START + 25 * MIN + 48_000)
    expect(position).toMatchObject({ number: 1, count: 3, remainingMs: 4 * MIN + 12_000 })
    expect(position.segment.kind).toBe('break')
  })

  it('lewati istirahat: putaran 2 mulai saat itu dan sisa sesi berkurang', () => {
    const at = START + 26 * MIN
    const skipped = skipBreak(session, at)
    const position = getPosition(skipped, at)
    expect(position.segment.kind).toBe('focus')
    expect(position.number).toBe(2)
    expect(position.endAt).toBe(getPosition(session, at).endAt - 4 * MIN)
  })

  it('selesai setelah segmen terakhir', () => {
    expect(getPosition(session, START + 115 * MIN).done).toBe(true)
  })
})

describe('Check-In mandiri', () => {
  const fixed = () => 0
  const session = createSession({ techniqueId: 'block', blockMin: 25, checkIn: true, now: START, random: fixed })
  const [first] = getCheckInWindows(session)

  it('memakai jendela 20 detik seperti Arena', () => {
    expect(first.openAt).toBe(START + SOLO_RULES.checkIn.firstAtMs)
    expect(first.deadline - first.openAt).toBe(20_000)
    expect(getActiveCheckIn(session, first.openAt + 1)).toEqual(first)
  })

  it('terlewat: dicatat tidak selesai, menit fokus sampai Check-In dibuka', () => {
    const at = first.deadline + 1
    expect(getMissedCheckIn(session, at)).toEqual(first)
    expect(buildSoloEntry(session, first.openAt, false)).toMatchObject({ technique: 'block', focusMin: 4, completed: false })
  })

  it('dijawab: tidak aktif dan tidak terlewat', () => {
    const answered = answerCheckIn(session, first.key)
    expect(getActiveCheckIn(answered, first.openAt + 1)).toBeNull()
    expect(getMissedCheckIn(answered, first.deadline + 1)).toBeNull()
  })

  it('tanpa Check-In: tidak ada jadwal', () => {
    expect(getCheckInWindows(createSession({ techniqueId: 'pomodoro', checkIn: false, now: START }))).toEqual([])
  })
})

describe('riwayat', () => {
  it('menit fokus tidak menghitung istirahat', () => {
    const session = createSession({ techniqueId: 'pomodoro', checkIn: false, now: START })
    expect(buildSoloEntry(session, START + 40 * MIN, false).focusMin).toBe(35)
    expect(buildSoloEntry(session, START + 115 * MIN, true).focusMin).toBe(100)
  })

  it('Hari ini, Minggu ini, dan Sesi selesai', () => {
    const now = new Date(2026, 10, 25, 20, 0).getTime() // Rabu
    const entries = {
      a: { technique: 'pomodoro', focusMin: 100, endedAt: new Date(2026, 10, 25, 9).getTime(), completed: true },
      b: { technique: 'block', focusMin: 10, endedAt: new Date(2026, 10, 24, 9).getTime(), completed: false },
      c: { technique: 'long', focusMin: 100, endedAt: new Date(2026, 10, 22, 9).getTime(), completed: true }, // Minggu lalu
    }
    const summary = summarizeSolo(entries, now)
    expect(summary).toMatchObject({ todayMin: 100, weekMin: 110, completedCount: 2 })
    expect(summary.recent.map((entry) => entry.id)).toEqual(['a', 'b', 'c'])
  })
})
