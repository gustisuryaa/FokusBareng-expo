import { describe, expect, it } from 'vitest'
import { DEMO_RULES, NORMAL_RULES, getNextTier, getRules, getTier, resolveMode } from '../src/config/gameRules.js'

describe('gameRules', () => {
  it('memilih profil dari query ?mode', () => {
    expect(resolveMode({ mode: 'demo' })).toBe('demo')
    expect(resolveMode({})).toBe('normal')
    expect(resolveMode(undefined)).toBe('normal')
    expect(getRules('demo')).toBe(DEMO_RULES)
    expect(getRules('lain')).toBe(NORMAL_RULES)
  })

  it('profil demo tidak memberi poin dan tetap memakai batas respons 20 detik', () => {
    expect(DEMO_RULES.awardsPoints).toBe(false)
    expect(DEMO_RULES.checkIn.responseWindowMs).toBe(NORMAL_RULES.checkIn.responseWindowMs)
  })

  it('menentukan gelar dari poin', () => {
    expect(getTier(0).id).toBe('teralihkan')
    expect(getTier(89).id).toBe('teralihkan')
    expect(getTier(90).id).toBe('terjaga')
    expect(getTier(899).id).toBe('tajam')
    expect(getTier(5000).id).toBe('jawara')
    expect(getNextTier(0).id).toBe('terjaga')
    expect(getNextTier(900)).toBeNull()
  })
})
