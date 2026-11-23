// Angka aturan main FokusBareng. Sumber: docs/keputusan-aturan.md bagian 3, 8, dan 9.
// Semua nilai di file ini berstatus [USULAN]: belum masuk Charter/WBS, jadi hanya disimpan di sini.
// Komponen dan logika lain tidak boleh menulis angka aturan sendiri.

const SECOND = 1000
const MINUTE = 60 * SECOND

export const MODES = Object.freeze({ NORMAL: 'normal', DEMO: 'demo' })

export const NORMAL_RULES = Object.freeze({
  mode: MODES.NORMAL,
  durationsMin: [15, 25, 45, 60],
  defaultDurationMin: 25,
  roomTtlMs: 30 * MINUTE,
  maxPlayers: 2,
  checkIn: Object.freeze({
    responseWindowMs: 20 * SECOND,
    firstAtMs: 4 * MINUTE,
    intervalMinMs: 4 * MINUTE,
    intervalMaxMs: 8 * MINUTE,
    // Tidak ada Check-In di rentang terakhir ini
    quietEndMs: 60 * SECOND,
  }),
  disconnectToleranceMs: 10 * SECOND,
  maxClockDriftMs: 3 * SECOND,
  // Ambang layar "Menjelang akhir" (M03b)
  endingSoonMs: 60 * SECOND,
  notes: Object.freeze({ minLength: 1, maxLength: 140 }),
  awardsPoints: true,
  points: Object.freeze({ win: 30, draw: 15, lose: 5 }),
})

// Mode demo expo, dipilih lewat ?mode=demo. Saat ini hanya untuk sumber data mock.
export const DEMO_RULES = Object.freeze({
  ...NORMAL_RULES,
  mode: MODES.DEMO,
  durationsMin: [3],
  defaultDurationMin: 3,
  checkIn: Object.freeze({
    ...NORMAL_RULES.checkIn,
    firstAtMs: 30 * SECOND,
    intervalMinMs: 40 * SECOND,
    intervalMaxMs: 60 * SECOND,
    quietEndMs: 30 * SECOND,
  }),
  endingSoonMs: 30 * SECOND,
  awardsPoints: false,
  points: Object.freeze({ win: 0, draw: 0, lose: 0 }),
})

// Urut dari ambang terendah. Akun baru: 0 poin, gelar Teralihkan.
export const TIERS = Object.freeze([
  Object.freeze({ id: 'teralihkan', name: 'Teralihkan', minPoints: 0 }),
  Object.freeze({ id: 'terjaga', name: 'Terjaga', minPoints: 90 }),
  Object.freeze({ id: 'teguh', name: 'Teguh', minPoints: 240 }),
  Object.freeze({ id: 'tajam', name: 'Tajam', minPoints: 480 }),
  Object.freeze({ id: 'jawara', name: 'Jawara', minPoints: 900 }),
])

export function getRules(mode) {
  return mode === MODES.DEMO ? DEMO_RULES : NORMAL_RULES
}

// Membaca mode dari query route, misalnya route.query
export function resolveMode(query) {
  return query?.mode === MODES.DEMO ? MODES.DEMO : MODES.NORMAL
}

export function getTier(points) {
  let current = TIERS[0]
  for (const tier of TIERS) {
    if (points >= tier.minPoints) current = tier
  }
  return current
}

// Gelar berikutnya, atau null bila sudah Jawara
export function getNextTier(points) {
  return TIERS.find((tier) => tier.minPoints > points) ?? null
}
