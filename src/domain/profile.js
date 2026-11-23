// Nilai turunan profil (struktur-data.md bagian 3). Dihitung dari users/{uid}/history, tidak disimpan.
import { getNextTier, getTier } from '../config/gameRules.js'

export function summarizeHistory(history = {}) {
  const entries = Object.entries(history).map(([roomId, entry]) => ({ roomId, ...entry }))
  const points = entries.reduce((sum, entry) => sum + entry.delta, 0)
  const count = (outcome) => entries.filter((entry) => entry.outcome === outcome).length
  const lastMatch = entries.reduce((latest, entry) => (!latest || entry.at > latest.at ? entry : latest), null)

  return {
    points,
    tier: getTier(points).id,
    nextTier: getNextTier(points)?.id ?? null,
    wins: count('win'),
    draws: count('draw'),
    losses: count('loss'),
    totalFocusMin: entries.reduce((sum, entry) => sum + entry.focusMin, 0),
    lastMatch,
  }
}
