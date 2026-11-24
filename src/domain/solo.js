// Logika murni Belajar Mandiri: rencana putaran, posisi sesi pada waktu tertentu, Check-In,
// dan ringkasan riwayat. Tidak menyentuh Vue atau services supaya bisa dites.
import { SOLO_RULES } from '../config/gameRules.js'
import { generateCheckInSchedule } from './referee.js'

const MINUTE = 60_000

export const SEGMENT = Object.freeze({ FOCUS: 'focus', BREAK: 'break' })

export function getTechnique(id) {
  return SOLO_RULES.techniques.find((technique) => technique.id === id) ?? null
}

// "25 fokus · 5 istirahat · 4 putaran" atau "15, 25, 45, atau 60 menit tanpa istirahat"
export function describeTechnique(technique) {
  if (technique.focusMin === null) {
    const options = SOLO_RULES.blockOptionsMin
    return `${options.slice(0, -1).join(', ')}, atau ${options.at(-1)} menit tanpa istirahat`
  }
  return `${technique.focusMin} fokus · ${technique.breakMin} istirahat · ${technique.rounds} putaran`
}

// Urutan fokus dan istirahat. Tidak ada istirahat setelah putaran terakhir.
export function buildSegments(technique, blockMin = SOLO_RULES.defaultBlockMin) {
  const focusMin = technique.focusMin ?? blockMin
  const segments = []
  for (let round = 0; round < technique.rounds; round += 1) {
    segments.push({ kind: SEGMENT.FOCUS, ms: focusMin * MINUTE })
    if (round < technique.rounds - 1 && technique.breakMin > 0) {
      segments.push({ kind: SEGMENT.BREAK, ms: technique.breakMin * MINUTE })
    }
  }
  return segments
}

export function getPlanMs(segments) {
  return segments.reduce((sum, segment) => sum + segment.ms, 0)
}

// "1 jam 55 mnt", "25 mnt", "2 jam". Dibulatkan ke bawah seperti "Sisa 1 jam 48 mnt" di M12.
export function formatDuration(ms) {
  const totalMin = Math.max(0, Math.floor(ms / MINUTE))
  const hours = Math.floor(totalMin / 60)
  const minutes = totalMin % 60
  if (hours === 0) return `${minutes} mnt`
  return minutes === 0 ? `${hours} jam` : `${hours} jam ${minutes} mnt`
}

export function createSession({ techniqueId, blockMin, checkIn, now, random = Math.random }) {
  const technique = getTechnique(techniqueId)
  if (!technique) throw new Error(`Teknik tidak dikenal: ${techniqueId}`)
  const segments = buildSegments(technique, blockMin)
  // Jadwal Check-In per segmen fokus, relatif ke awal segmen itu
  const checkIns = {}
  if (checkIn) {
    segments.forEach((segment, index) => {
      if (segment.kind !== SEGMENT.FOCUS) return
      checkIns[index] = generateCheckInSchedule(segment.ms / MINUTE, SOLO_RULES, random).map((item) => item.offsetMs)
    })
  }
  return {
    techniqueId,
    blockMin: technique.focusMin === null ? blockMin : null,
    checkIn: Boolean(checkIn),
    segments,
    startedAt: now,
    // Waktu mulai segmen yang bergeser (misalnya istirahat dilewati). Segmen lain mulai saat sebelumnya habis.
    starts: { 0: now },
    checkIns,
    answered: {},
  }
}

// Waktu mulai dan selesai setiap segmen
export function getTimeline(session) {
  const timeline = []
  let previousEnd = session.startedAt
  session.segments.forEach((segment, index) => {
    const startAt = session.starts[index] ?? previousEnd
    // Segmen berhenti lebih awal bila segmen berikutnya sudah dimulai (istirahat dilewati)
    const nextStart = session.starts[index + 1]
    const endAt = nextStart === undefined ? startAt + segment.ms : Math.min(startAt + segment.ms, nextStart)
    timeline.push({ index, kind: segment.kind, ms: segment.ms, startAt, endAt })
    previousEnd = endAt
  })
  return timeline
}

// Segmen yang sedang berjalan, atau done = true setelah segmen terakhir habis
export function getPosition(session, now) {
  const timeline = getTimeline(session)
  const current = timeline.find((item) => now < item.endAt)
  const last = timeline.at(-1)
  if (!current) return { done: true, segment: last, timeline, endAt: last.endAt }

  const sameKind = timeline.filter((item) => item.kind === current.kind)
  return {
    done: false,
    segment: current,
    timeline,
    // Nomor dalam jenisnya: "Putaran 1 dari 4", "Istirahat 1 dari 3"
    number: sameKind.indexOf(current) + 1,
    count: sameKind.length,
    remainingMs: current.endAt - now,
    sessionRemainingMs: last.endAt - now,
    endAt: last.endAt,
  }
}

// Istirahat dilewati: segmen berikutnya mulai sekarang
export function skipBreak(session, now) {
  const position = getPosition(session, now)
  if (position.done || position.segment.kind !== SEGMENT.BREAK) return session
  return { ...session, starts: { ...session.starts, [position.segment.index + 1]: now } }
}

export function getCheckInWindows(session) {
  const { responseWindowMs } = SOLO_RULES.checkIn
  return getTimeline(session).flatMap((item) =>
    (session.checkIns[item.index] ?? []).map((offsetMs, order) => {
      const openAt = item.startAt + offsetMs
      return { key: `${item.index}-${order}`, openAt, deadline: openAt + responseWindowMs }
    }),
  )
}

export function getActiveCheckIn(session, now) {
  return getCheckInWindows(session).find((w) => now >= w.openAt && now <= w.deadline && !session.answered[w.key]) ?? null
}

// Check-In pertama yang lewat batas tanpa jawaban: sesi berhenti di sini
export function getMissedCheckIn(session, now) {
  return getCheckInWindows(session).find((w) => now > w.deadline && !session.answered[w.key]) ?? null
}

export function answerCheckIn(session, key) {
  return { ...session, answered: { ...session.answered, [key]: true } }
}

// Menit fokus yang benar-benar dijalani sampai waktu at
export function getFocusMs(session, at) {
  return getTimeline(session)
    .filter((item) => item.kind === SEGMENT.FOCUS)
    .reduce((sum, item) => sum + Math.max(0, Math.min(item.endAt, at) - item.startAt), 0)
}

// Isi users/{uid}/solo/{sessionId}
export function buildSoloEntry(session, endedAt, completed) {
  return {
    technique: session.techniqueId,
    focusMin: Math.floor(getFocusMs(session, endedAt) / MINUTE),
    startedAt: session.startedAt,
    endedAt,
    completed,
  }
}

function startOfDay(time) {
  const date = new Date(time)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

// Minggu dimulai Senin, mengikuti kalender Indonesia
function startOfWeek(time) {
  const date = new Date(startOfDay(time))
  const sinceMonday = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - sinceMonday)
  return date.getTime()
}

// Statistik M10: Hari ini, Minggu ini, Sesi selesai, dan riwayat terbaru
export function summarizeSolo(entries = {}, now) {
  const list = Object.entries(entries)
    .map(([id, entry]) => ({ id, ...entry }))
    .sort((a, b) => b.endedAt - a.endedAt)
  const dayStart = startOfDay(now)
  const weekStart = startOfWeek(now)
  const sumSince = (since) => list.filter((entry) => entry.endedAt >= since).reduce((sum, entry) => sum + entry.focusMin, 0)
  return {
    todayMin: sumSince(dayStart),
    weekMin: sumSince(weekStart),
    completedCount: list.filter((entry) => entry.completed).length,
    recent: list.slice(0, SOLO_RULES.historyLimit),
  }
}
