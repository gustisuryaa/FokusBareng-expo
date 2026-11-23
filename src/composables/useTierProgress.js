import { computed, unref } from 'vue'
import { TIERS, getNextTier, getTier } from '@/config/gameRules'

// Gelar sekarang, gelar berikutnya, sisa poin, dan progres 0..1 menuju gelar berikutnya
export function useTierProgress(pointsRef) {
  return computed(() => {
    const points = unref(pointsRef) ?? 0
    const current = getTier(points)
    const next = getNextTier(points)
    const progress = next ? (points - current.minPoints) / (next.minPoints - current.minPoints) : 1
    return {
      points,
      current,
      next,
      remaining: next ? next.minPoints - points : 0,
      progress: Math.min(1, Math.max(0, progress)),
      reachedIds: TIERS.filter((tier) => points >= tier.minPoints).map((tier) => tier.id),
    }
  })
}
