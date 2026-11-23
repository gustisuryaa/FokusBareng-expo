// Tes services Firebase terhadap Emulator Auth dan Realtime Database.
// Jalankan: npm run test:emulator (butuh Java). Di `npm test` biasa tes ini dilewati.
// Rules di sini sengaja terbuka (tests/emulator/open.rules.json): yang diuji alur services,
// bukan rules. Tes rules sungguhan ada di tests/rules.test.js setelah database.rules.json final.

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

const hasEmulator = Boolean(process.env.FIREBASE_DATABASE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST)
const PASSWORD = 'rahasia123'

describe.skipIf(!hasEmulator)('services Firebase (emulator)', () => {
  let services
  let ERROR_CODES
  const run = Date.now()
  const emailA = `a${run}@fokusbareng.test`
  const emailB = `b${run}@fokusbareng.test`
  const emailC = `c${run}@fokusbareng.test`
  let uidA
  let uidB
  let roomId

  async function as(email) {
    await services.signOut()
    return services.signIn({ email, password: PASSWORD })
  }

  beforeAll(async () => {
    vi.stubEnv('VITE_FIREBASE_EMULATOR_HOST', '127.0.0.1')
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'demo-fokusbareng')
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'demo-key')
    vi.stubEnv('VITE_FIREBASE_DATABASE_URL', 'http://127.0.0.1:9000?ns=demo-fokusbareng')
    services = await import('../src/services/firebase/index.js')
    ;({ ERROR_CODES } = await import('../src/services/errors.js'))
  })

  afterAll(async () => {
    await services.signOut()
    vi.unstubAllEnvs()
  })

  it('mendaftar dan memetakan galat auth', async () => {
    uidA = (await services.signUp({ name: 'Pemain A', email: emailA, password: PASSWORD })).uid
    await services.signOut()
    const b = await services.signUp({ name: 'Pemain B', email: emailB, password: PASSWORD })
    uidB = b.uid
    expect(b.name).toBe('Pemain B')

    await expect(services.signUp({ name: 'Lagi', email: emailA, password: PASSWORD })).rejects.toMatchObject({
      code: ERROR_CODES.EMAIL_TAKEN,
    })
    await services.signOut()
    await expect(services.signIn({ email: emailA, password: 'salah-sandi' })).rejects.toMatchObject({
      code: ERROR_CODES.INVALID_CREDENTIAL,
    })
  })

  it('onAuthChange memberi nama dari profil', async () => {
    await as(emailA)
    const user = await new Promise((resolve) => {
      const stop = services.onAuthChange((value) => {
        if (value) {
          stop()
          resolve(value)
        }
      })
    })
    expect(user).toMatchObject({ uid: uidA, name: 'Pemain A', email: emailA })
  })

  it('host membuat room, tamu bergabung, orang ketiga ditolak', async () => {
    roomId = await services.createRoom({ durationMin: 25 })
    expect(await services.openRoom(roomId)).toBe('host_lobby')
    await services.setDuration(roomId, 15)

    await as(emailB)
    expect(await services.openRoom(roomId)).toBe('guest_lobby')
    expect(await services.openRoom(roomId)).toBe('guest_lobby')
    await expect(services.setDuration(roomId, 45)).rejects.toMatchObject({ code: ERROR_CODES.PERMISSION_DENIED })

    await services.signOut()
    await services.signUp({ name: 'Pemain C', email: emailC, password: PASSWORD })
    expect(await services.openRoom(roomId)).toBe('full')
    expect(await services.openRoom('room-tidak-ada')).toBe('invalid')
  })

  it('Notes, Mulai, siap, lalu battle berjalan', async () => {
    await as(emailB)
    await services.setNotes(roomId, 'Traktir es teh.')
    await as(emailA)
    await expect(services.requestStart(roomId)).rejects.toMatchObject({ code: ERROR_CODES.PERMISSION_DENIED })
    await services.setNotes(roomId, 'Bayar parkir.')
    await services.requestStart(roomId)
    await services.confirmReady(roomId)

    // Batal menghapus status siap kedua pemain
    await services.cancelStart(roomId)
    await services.requestStart(roomId)
    await services.confirmReady(roomId)
    await as(emailB)
    await services.confirmReady(roomId)
    await services.setPresence(roomId, true)

    await as(emailA)
    await services.startBattle(roomId)
    await expect(services.startBattle(roomId)).rejects.toMatchObject({ code: ERROR_CODES.PERMISSION_DENIED })

    const room = await new Promise((resolve) => {
      const stop = services.listenRoom(roomId, (value) => {
        if (value?.battle) {
          stop()
          resolve(value)
        }
      })
    })
    expect(room.meta.durationMin).toBe(15)
    expect(typeof room.battle.startedAt).toBe('number')
    expect(Object.keys(room.battle.checkIns).length).toBeGreaterThan(0)
    expect(room.ready).toEqual({ [uidA]: true, [uidB]: true })
    expect(room.presence[uidB].online).toBe(true)
    expect(await services.openRoom(roomId)).toBe('arena')
  })

  it('keluar Arena ditulis sekali, poin tercatat sekali', async () => {
    await services.forfeit(roomId)
    await expect(services.forfeit(roomId)).rejects.toMatchObject({ code: ERROR_CODES.PERMISSION_DENIED })

    await as(emailB)
    await expect(
      services.claimResult(roomId, { outcome: 'draw', reason: 'timeup' }),
    ).rejects.toMatchObject({ code: ERROR_CODES.ALREADY_EXISTS })

    const entry = await services.applyPoints(roomId)
    expect(entry).toMatchObject({ outcome: 'win', delta: 30, opponentName: 'Pemain A', focusMin: 0 })
    await expect(services.applyPoints(roomId)).rejects.toMatchObject({ code: ERROR_CODES.ALREADY_EXISTS })

    const profileB = await services.getProfile(uidB)
    expect(profileB).toMatchObject({ name: 'Pemain B', points: 30, wins: 1, losses: 0 })

    await as(emailA)
    await services.applyPoints(roomId)
    expect(await services.getProfile(uidA)).toMatchObject({ points: 5, losses: 1 })
    expect(await services.openRoom(roomId)).toBe('result')
  })

  it('selisih jam server berupa angka', async () => {
    expect(typeof (await services.getServerOffset())).toBe('number')
  })
})
