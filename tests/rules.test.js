// Tes database.rules.json di Emulator (npm run test:rules, butuh Java); nomor skenario dari keputusan-aturan.md bagian 6.
// Tiap pemain app Firebase terpisah dengan mockUserToken; data disiapkan lewat REST dengan "Bearer owner".
import { readFileSync } from 'node:fs'
import { deleteApp, initializeApp } from 'firebase/app'
import { connectDatabaseEmulator, get, getDatabase, ref, serverTimestamp, set, update } from 'firebase/database'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

const HOST_ADDR = process.env.FIREBASE_DATABASE_EMULATOR_HOST
const NS = 'fokusbareng-rules-test'
const RULES = readFileSync(new URL('../database.rules.json', import.meta.url), 'utf8')

const HOST = 'host'
const GUEST = 'tamu'
const STRANGER = 'orang-lain'
const ROOM = 'room1'
const MIN = 60_000

async function admin(method, path, body) {
  const response = await fetch(`http://${HOST_ADDR}/${path}.json?ns=${NS}`, {
    method,
    headers: { Authorization: 'Bearer owner' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${await response.text()}`)
}

const apps = []
const dbs = {}
function as(uid) {
  if (!dbs[uid]) {
    const app = initializeApp({ projectId: 'demo-fokusbareng', databaseURL: `http://${HOST_ADDR}?ns=${NS}` }, `rules-${uid}`)
    const db = getDatabase(app)
    const [host, port] = HOST_ADDR.split(':')
    connectDatabaseEmulator(db, host, Number(port), { mockUserToken: { sub: uid, user_id: uid } })
    apps.push(app)
    dbs[uid] = db
  }
  return dbs[uid]
}

const allowed = (promise) => expect(promise).resolves.not.toThrow()
const denied = (promise) => expect(promise).rejects.toThrow(/permission/i)
const write = (uid, path, value) => set(ref(as(uid), path), value)

const NOTES = { [HOST]: 'Traktir es teh.', [GUEST]: 'Bayar parkir.' }

// Room siap battle: tamu sudah masuk, Notes 2/2. Waktu dalam ms relatif ke sekarang.
// Isi Notes ada di roomNotes (diisi beforeEach), room hanya memegang penanda notesSet.
function lobby({ withNotes = true } = {}) {
  const now = Date.now()
  return {
    meta: { hostUid: HOST, durationMin: 25, createdAt: now, expiresAt: now + 30 * MIN },
    guestUid: GUEST,
    ...(withNotes ? { notesSet: { [HOST]: true, [GUEST]: true } } : {}),
  }
}

// Battle yang sudah berjalan sejak startedAgoMs, Check-In ke-0 di menit ke-4
function running(startedAgoMs, extra = {}) {
  const now = Date.now()
  return {
    ...lobby(),
    startRequested: true,
    ready: { [HOST]: true, [GUEST]: true },
    battle: { startedAt: now - startedAgoMs, checkIns: { 0: { offsetMs: 4 * MIN } } },
    presence: { [HOST]: { online: true, lastSeen: now }, [GUEST]: { online: true, lastSeen: now } },
    ...extra,
  }
}

describe.skipIf(!HOST_ADDR)('database.rules.json (emulator)', () => {
  beforeAll(async () => {
    await admin('PUT', '.settings/rules', JSON.parse(RULES))
  })

  beforeEach(async () => {
    await admin('DELETE', '')
    await admin('PUT', `roomNotes/${ROOM}`, NOTES)
  })

  afterAll(async () => {
    await Promise.all(apps.map((app) => deleteApp(app)))
  })

  describe('profil dan riwayat', () => {
    it('pemilik menulis profil; nama lebih dari 60 karakter ditolak', async () => {
      await allowed(write(HOST, `users/${HOST}/profile`, { name: 'Gusti', createdAt: serverTimestamp() }))
      await denied(write(HOST, `users/${GUEST}/profile`, { name: 'Palsu', createdAt: serverTimestamp() }))
      await denied(write(GUEST, `users/${GUEST}/profile`, { name: 'x'.repeat(61), createdAt: serverTimestamp() }))
    })

    it('nama orang lain terbaca, riwayatnya tidak', async () => {
      await admin('PUT', `users/${GUEST}`, { profile: { name: 'Naufal', createdAt: 1 }, history: { r: { delta: 30 } } })
      await allowed(get(ref(as(HOST), `users/${GUEST}/profile/name`)))
      await denied(get(ref(as(HOST), `users/${GUEST}/history`)))
    })
  })

  describe('room dan lobi', () => {
    it('host membuat room; demo dengan durasi normal dan umur lebih dari 30 menit ditolak', async () => {
      const now = Date.now()
      const meta = { hostUid: HOST, durationMin: 25, createdAt: serverTimestamp(), expiresAt: now + 29 * MIN }
      await allowed(write(HOST, `rooms/${ROOM}/meta`, meta))
      await denied(write(HOST, 'rooms/r2/meta', { ...meta, mode: 'demo' }))
      await denied(write(HOST, 'rooms/r3/meta', { ...meta, expiresAt: now + 31 * MIN }))
      await denied(write(GUEST, 'rooms/r4/meta', meta))
    })

    it('mode demo: durasi 3 menit, Check-In mulai detik ke-30, tanpa poin', async () => {
      const now = Date.now()
      const meta = { hostUid: HOST, durationMin: 3, createdAt: serverTimestamp(), expiresAt: now + 29 * MIN, mode: 'demo' }
      await allowed(write(HOST, `rooms/${ROOM}/meta`, meta))
      await denied(write(HOST, 'rooms/r2/meta', { ...meta, mode: 'lain' }))
      const { mode: _mode, ...normalMeta } = meta
      await denied(write(HOST, 'rooms/r3/meta', normalMeta))
      await denied(write(HOST, `rooms/${ROOM}/meta/durationMin`, 25))
      await denied(write(HOST, `rooms/${ROOM}/meta/mode`, null))

      const demo = { ...lobby(), meta: { ...lobby().meta, durationMin: 3, mode: 'demo' }, startRequested: true, ready: { [HOST]: true, [GUEST]: true } }
      await admin('PUT', `rooms/${ROOM}`, demo)
      const battle = (offsetMs) => ({ startedAt: serverTimestamp(), checkIns: { 0: { offsetMs } } })
      await denied(write(HOST, `rooms/${ROOM}/battle`, battle(20_000)))
      await denied(write(HOST, `rooms/${ROOM}/battle`, battle(3 * MIN)))
      await allowed(write(HOST, `rooms/${ROOM}/battle`, battle(30_000)))

      await admin('PUT', `rooms/${ROOM}/result`, { outcome: 'win', reason: 'forfeit', winnerUid: GUEST, loserUid: HOST, at: Date.now() })
      await denied(write(GUEST, `users/${GUEST}/history/${ROOM}`, { delta: 30, outcome: 'win', focusMin: 0, opponentName: 'Gusti', at: serverTimestamp() }))
    })

    it('14. orang ketiga tidak bisa masuk room yang sudah berisi 2 orang', async () => {
      const { meta } = lobby()
      await admin('PUT', `rooms/${ROOM}`, { meta })
      await denied(write(HOST, `rooms/${ROOM}/guestUid`, HOST))
      await allowed(write(GUEST, `rooms/${ROOM}/guestUid`, GUEST))
      await denied(write(STRANGER, `rooms/${ROOM}/guestUid`, STRANGER))
      await allowed(get(ref(as(STRANGER), `rooms/${ROOM}/meta`)))
      await denied(get(ref(as(STRANGER), `rooms/${ROOM}`)))
    })

    it('room kedaluwarsa tidak bisa dimasuki', async () => {
      const now = Date.now()
      await admin('PUT', `rooms/${ROOM}/meta`, { hostUid: HOST, durationMin: 25, createdAt: now - 31 * MIN, expiresAt: now - MIN })
      await denied(write(GUEST, `rooms/${ROOM}/guestUid`, GUEST))
    })

    it('room kedaluwarsa: durasi, Notes, Mulai, siap, dan battle terkunci; Batal tetap boleh', async () => {
      const now = Date.now()
      const battle = { startedAt: serverTimestamp(), checkIns: { 0: { offsetMs: 4 * MIN } } }
      await admin('PUT', `rooms/${ROOM}`, {
        ...lobby(),
        meta: { hostUid: HOST, durationMin: 25, createdAt: now - 31 * MIN, expiresAt: now - MIN },
        startRequested: true,
        ready: { [HOST]: true },
      })
      await denied(write(HOST, `rooms/${ROOM}/meta/durationMin`, 45))
      await denied(write(GUEST, `roomNotes/${ROOM}/${GUEST}`, 'Notes baru'))
      await denied(write(HOST, `rooms/${ROOM}/startRequested`, true))
      await denied(write(GUEST, `rooms/${ROOM}/ready/${GUEST}`, true))
      await denied(write(HOST, `rooms/${ROOM}/battle`, battle))
      await allowed(update(ref(as(GUEST), `rooms/${ROOM}`), { startRequested: false, ready: null }))
    })

    it('16. durasi dan Notes terkunci setelah battle mulai; Notes kosong atau lebih dari 140 ditolak', async () => {
      await admin('PUT', `rooms/${ROOM}`, lobby({ withNotes: false }))
      await denied(write(GUEST, `rooms/${ROOM}/meta/durationMin`, 45))
      await denied(write(HOST, `rooms/${ROOM}/meta/durationMin`, 30))
      await allowed(write(HOST, `rooms/${ROOM}/meta/durationMin`, 45))
      await denied(write(HOST, `roomNotes/${ROOM}/${HOST}`, ''))
      await denied(write(HOST, `roomNotes/${ROOM}/${HOST}`, 'x'.repeat(141)))
      await denied(write(HOST, `roomNotes/${ROOM}/${GUEST}`, 'Notes orang lain'))
      await denied(write(HOST, `rooms/${ROOM}/notes/${HOST}`, 'Path lama'))
      await allowed(write(HOST, `roomNotes/${ROOM}/${HOST}`, 'x'.repeat(140)))
      await allowed(write(HOST, `rooms/${ROOM}/notesSet/${HOST}`, true))

      await admin('PUT', `rooms/${ROOM}`, running(MIN))
      await denied(write(HOST, `rooms/${ROOM}/meta/durationMin`, 60))
      await denied(write(HOST, `roomNotes/${ROOM}/${HOST}`, 'Ganti setelah mulai'))
      await denied(write(HOST, `rooms/${ROOM}/notesSet/${HOST}`, null))
    })

    it('15. battle tidak bisa dimulai sebelum Notes 2/2 dan kedua siap', async () => {
      const battle = { startedAt: serverTimestamp(), checkIns: { 0: { offsetMs: 4 * MIN } } }
      await admin('PUT', `rooms/${ROOM}`, lobby({ withNotes: false }))
      await denied(write(HOST, `rooms/${ROOM}/startRequested`, true))

      await admin('PUT', `rooms/${ROOM}`, lobby())
      await denied(write(GUEST, `rooms/${ROOM}/startRequested`, true))
      await allowed(write(HOST, `rooms/${ROOM}/startRequested`, true))
      await allowed(write(HOST, `rooms/${ROOM}/ready/${HOST}`, true))
      await denied(write(HOST, `rooms/${ROOM}/battle`, battle))

      // Batal menghapus status siap kedua pemain
      await allowed(update(ref(as(GUEST), `rooms/${ROOM}`), { startRequested: false, ready: null }))
      await denied(write(GUEST, `rooms/${ROOM}/ready/${GUEST}`, true))

      await allowed(write(HOST, `rooms/${ROOM}/startRequested`, true))
      await allowed(write(HOST, `rooms/${ROOM}/ready/${HOST}`, true))
      await allowed(write(GUEST, `rooms/${ROOM}/ready/${GUEST}`, true))
      await denied(write(GUEST, `rooms/${ROOM}/battle`, battle))
      await denied(write(HOST, `rooms/${ROOM}/battle`, { ...battle, checkIns: { 0: { offsetMs: MIN } } }))
      await allowed(write(HOST, `rooms/${ROOM}/battle`, battle))
      await denied(write(HOST, `rooms/${ROOM}/battle`, battle))
    })

    it('11. lawan tidak bisa membaca Notes sebelum ada hasil, dan tetap tidak bisa bila seri', async () => {
      const read = (uid, owner) => get(ref(as(uid), `roomNotes/${ROOM}/${owner}`))
      await admin('PUT', `rooms/${ROOM}`, lobby())
      await allowed(read(HOST, HOST))
      await denied(read(GUEST, HOST))
      await denied(get(ref(as(GUEST), `roomNotes/${ROOM}`)))

      await admin('PUT', `rooms/${ROOM}`, running(26 * MIN, { result: { outcome: 'draw', reason: 'timeup', at: Date.now() } }))
      await denied(read(GUEST, HOST))
      await denied(read(HOST, GUEST))

      const win = { outcome: 'win', reason: 'forfeit', winnerUid: HOST, loserUid: GUEST, at: Date.now() }
      await admin('PUT', `rooms/${ROOM}`, running(2 * MIN, { result: win }))
      await allowed(read(GUEST, HOST))
      await denied(read(HOST, GUEST))
      await denied(read(STRANGER, HOST))
    })

    it('penanda Notes hanya boleh true bila isinya ada; keduanya ditulis sekaligus', async () => {
      await admin('PUT', 'rooms/r2', lobby({ withNotes: false }))
      await denied(write(GUEST, `rooms/r2/notesSet/${GUEST}`, true))
      await denied(write(GUEST, `rooms/r2/notesSet/${HOST}`, true))
      await allowed(update(ref(as(GUEST)), { [`roomNotes/r2/${GUEST}`]: 'Bayar parkir.', [`rooms/r2/notesSet/${GUEST}`]: true }))
      await denied(write(GUEST, `rooms/r2/notesSet/${GUEST}`, false))
    })
  })

  describe('Arena dan wasit', () => {
    it('4 dan 5. jawaban di dalam jendela 20 detik diterima, setelahnya ditolak', async () => {
      await admin('PUT', `rooms/${ROOM}`, running(4 * MIN + 5_000))
      await allowed(write(HOST, `rooms/${ROOM}/responses/${HOST}/0`, serverTimestamp()))
      await denied(write(HOST, `rooms/${ROOM}/responses/${HOST}/0`, serverTimestamp()))
      await denied(write(HOST, `rooms/${ROOM}/responses/${GUEST}/0`, serverTimestamp()))

      await admin('PUT', `rooms/${ROOM}`, running(4 * MIN + 25_000))
      await denied(write(GUEST, `rooms/${ROOM}/responses/${GUEST}/0`, serverTimestamp()))
    })

    it('9. vonis Check-In terlewat sebelum batas waktu ditolak, sesudahnya diterima', async () => {
      const claim = { outcome: 'win', reason: 'missed_checkin', winnerUid: HOST, loserUid: GUEST, checkInIndex: 0, at: serverTimestamp() }
      const now = Date.now()
      await admin('PUT', `rooms/${ROOM}`, running(4 * MIN + 10_000, { responses: { [HOST]: { 0: now - 5_000 } } }))
      await denied(write(HOST, `rooms/${ROOM}/result`, claim))

      await admin('PUT', `rooms/${ROOM}`, running(4 * MIN + 25_000, { responses: { [HOST]: { 0: now - 20_000 } } }))
      await denied(write(HOST, `rooms/${ROOM}/result`, { ...claim, winnerUid: GUEST, loserUid: HOST }))
      await allowed(write(HOST, `rooms/${ROOM}/result`, claim))
    })

    it('3. kedua pemain melewatkan Check-In yang sama: hanya seri yang diterima', async () => {
      await admin('PUT', `rooms/${ROOM}`, running(4 * MIN + 25_000))
      const win = { outcome: 'win', reason: 'missed_checkin', winnerUid: HOST, loserUid: GUEST, checkInIndex: 0, at: serverTimestamp() }
      await denied(write(HOST, `rooms/${ROOM}/result`, win))
      await allowed(write(HOST, `rooms/${ROOM}/result`, { outcome: 'draw', reason: 'missed_checkin', checkInIndex: 0, at: serverTimestamp() }))
    })

    it('8. pemain yang terputus di jendela Check-In belum bisa divonis sebelum toleransinya habis', async () => {
      const now = Date.now()
      const extra = {
        responses: { [HOST]: { 0: now - 20_000 } },
        presence: { [HOST]: { online: true, lastSeen: now }, [GUEST]: { online: false, lastSeen: now - 8_000 } },
      }
      await admin('PUT', `rooms/${ROOM}`, running(4 * MIN + 22_000, extra))
      const claim = { outcome: 'win', reason: 'missed_checkin', winnerUid: HOST, loserUid: GUEST, checkInIndex: 0, at: serverTimestamp() }
      await denied(write(HOST, `rooms/${ROOM}/result`, claim))
    })

    it('6 dan 7. putus 8 detik bukan kalah, putus 11 detik kalah', async () => {
      const now = Date.now()
      const claim = { outcome: 'win', reason: 'disconnect', winnerUid: HOST, loserUid: GUEST, at: serverTimestamp() }
      const presence = (agoMs) => ({ [HOST]: { online: true, lastSeen: now }, [GUEST]: { online: false, lastSeen: now - agoMs } })
      await admin('PUT', `rooms/${ROOM}`, running(2 * MIN, { presence: presence(8_000) }))
      await denied(write(HOST, `rooms/${ROOM}/result`, claim))
      await admin('PUT', `rooms/${ROOM}`, running(2 * MIN, { presence: presence(11_000) }))
      await allowed(write(HOST, `rooms/${ROOM}/result`, claim))
    })

    it('10. hasil hanya bisa ditulis sekali', async () => {
      await admin('PUT', `rooms/${ROOM}`, running(26 * MIN))
      const timeup = { outcome: 'draw', reason: 'timeup', at: serverTimestamp() }
      await allowed(write(HOST, `rooms/${ROOM}/result`, timeup))
      await denied(write(GUEST, `rooms/${ROOM}/result`, timeup))
    })

    it('hasil dengan field tambahan ditolak', async () => {
      await admin('PUT', `rooms/${ROOM}`, running(26 * MIN))
      const timeup = { outcome: 'draw', reason: 'timeup', at: serverTimestamp() }
      await denied(write(HOST, `rooms/${ROOM}/result`, { ...timeup, catatan: 'bebas' }))
      await allowed(write(HOST, `rooms/${ROOM}/result`, timeup))
    })

    it('timer habis: seri hanya setelah durasi lewat', async () => {
      await admin('PUT', `rooms/${ROOM}`, running(10 * MIN))
      await denied(write(HOST, `rooms/${ROOM}/result`, { outcome: 'draw', reason: 'timeup', at: serverTimestamp() }))
    })

    it('12. keluar sengaja hanya bisa diklaim oleh pemain yang keluar', async () => {
      await admin('PUT', `rooms/${ROOM}`, running(2 * MIN))
      const forfeit = { outcome: 'win', reason: 'forfeit', winnerUid: GUEST, loserUid: HOST, at: serverTimestamp() }
      await denied(write(GUEST, `rooms/${ROOM}/result`, forfeit))
      await denied(write(STRANGER, `rooms/${ROOM}/result`, forfeit))
      await allowed(write(HOST, `rooms/${ROOM}/result`, forfeit))
    })

    it('presence hanya milik sendiri', async () => {
      await admin('PUT', `rooms/${ROOM}`, running(MIN))
      await allowed(write(HOST, `rooms/${ROOM}/presence/${HOST}`, { online: false, lastSeen: serverTimestamp() }))
      await denied(write(HOST, `rooms/${ROOM}/presence/${GUEST}`, { online: false, lastSeen: serverTimestamp() }))
      await denied(write(STRANGER, `rooms/${STRANGER}/presence/${STRANGER}`, { online: true, lastSeen: serverTimestamp() }))
    })
  })

  describe('poin', () => {
    it('13. poin satu room hanya sekali dan harus cocok dengan hasil', async () => {
      const now = Date.now()
      // Battle 25 menit, kamu keluar di menit ke-12 lewat 30 detik
      const startedAt = now - 13 * MIN
      await admin('PUT', `rooms/${ROOM}`, {
        ...running(13 * MIN),
        battle: { startedAt, checkIns: { 0: { offsetMs: 4 * MIN } } },
        result: { outcome: 'win', reason: 'forfeit', winnerUid: GUEST, loserUid: HOST, at: startedAt + 12.5 * MIN },
      })
      const entry = (overrides) => ({ delta: 5, outcome: 'loss', focusMin: 12, opponentName: 'Naufal', at: serverTimestamp(), ...overrides })
      await denied(write(HOST, `users/${HOST}/history/${ROOM}`, entry({ delta: 30, outcome: 'win' })))
      await denied(write(HOST, `users/${HOST}/history/${ROOM}`, entry({ focusMin: 25 })))
      await denied(write(HOST, `users/${GUEST}/history/${ROOM}`, entry({ delta: 30, outcome: 'win' })))
      await allowed(write(HOST, `users/${HOST}/history/${ROOM}`, entry()))
      await denied(write(HOST, `users/${HOST}/history/${ROOM}`, entry()))
      await allowed(write(GUEST, `users/${GUEST}/history/${ROOM}`, entry({ delta: 30, outcome: 'win' })))
    })

    it('poin tidak bisa diklaim sebelum ada hasil', async () => {
      await admin('PUT', `rooms/${ROOM}`, running(2 * MIN))
      await denied(write(HOST, `users/${HOST}/history/${ROOM}`, { delta: 15, outcome: 'draw', focusMin: 0, opponentName: 'Naufal', at: serverTimestamp() }))
    })
  })

  describe('Belajar Mandiri', () => {
    it('sesi milik sendiri; menit fokus tidak boleh melebihi waktu yang lewat', async () => {
      const endedAt = Date.now() - 1_000
      const entry = { technique: 'pomodoro', focusMin: 25, startedAt: endedAt - 30 * MIN, endedAt, completed: false }
      await allowed(write(HOST, `users/${HOST}/solo/s1`, entry))
      await denied(write(HOST, `users/${HOST}/solo/s1`, entry))
      await denied(write(HOST, `users/${HOST}/solo/s2`, { ...entry, focusMin: 31 }))
      await denied(write(HOST, `users/${HOST}/solo/s3`, { ...entry, technique: 'lain' }))
      await denied(write(HOST, `users/${GUEST}/solo/s4`, entry))
      await denied(get(ref(as(GUEST), `users/${HOST}/solo`)))
    })
  })
})
