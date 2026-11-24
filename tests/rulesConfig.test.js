// Rules Firebase tidak bisa membaca gameRules.js, jadi angkanya ditulis ulang di database.rules.json.
// Tes ini gagal bila salah satu diubah tanpa yang lain.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { NORMAL_RULES, SOLO_RULES } from '../src/config/gameRules.js'

const rules = readFileSync(new URL('../database.rules.json', import.meta.url), 'utf8')

describe('angka di database.rules.json sama dengan gameRules.js', () => {
  it.each([
    ['jendela Check-In', `+ ${NORMAL_RULES.checkIn.responseWindowMs}`],
    ['toleransi putus', `+ ${NORMAL_RULES.disconnectToleranceMs}`],
    ['Check-In pertama', `>= ${NORMAL_RULES.checkIn.firstAtMs}`],
    ['umur room', `+ ${NORMAL_RULES.roomTtlMs}`],
    ['panjang Notes', `length <= ${NORMAL_RULES.notes.maxLength}`],
    ['poin menang', `=== ${NORMAL_RULES.points.win}`],
    ['poin seri', `=== ${NORMAL_RULES.points.draw}`],
    ['poin kalah', `=== ${NORMAL_RULES.points.lose}`],
  ])('%s', (_, fragment) => {
    expect(rules).toContain(fragment)
  })

  it('pilihan durasi', () => {
    for (const minutes of NORMAL_RULES.durationsMin) expect(rules).toContain(`newData.val() === ${minutes}`)
  })

  it('teknik Belajar Mandiri', () => {
    for (const { id } of SOLO_RULES.techniques) expect(rules).toContain(`=== '${id}'`)
  })
})
