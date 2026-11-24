<script setup>
// Figma: Dasbor M01·D01 (kosong), M01w/k/s·D01w/k/s (sesudah menang/kalah/seri, sisi tamu sama),
// menu profil M01b·D01b, sheet Tangga gelar M01g.
// Tombol Teman tidak dirender (keputusan-aturan.md bagian 7). Belajar mandiri masuk lingkup 24 Nov 2026.
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProfileMenu from '@/components/layout/ProfileMenu.vue'
import TierBadge from '@/components/profile/TierBadge.vue'
import TierLadder from '@/components/profile/TierLadder.vue'
import TierRing from '@/components/profile/TierRing.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import SheetDialog from '@/components/ui/SheetDialog.vue'
import { useIsDesktop } from '@/composables/useMediaQuery'
import { useTierProgress } from '@/composables/useTierProgress'
import { showToast } from '@/composables/useToast'
import { NORMAL_RULES, resolveMode } from '@/config/gameRules'
import { createRoom, getProfile, signOut } from '@/services'
import { authStore } from '@/stores/authStore'

const route = useRoute()
const router = useRouter()
const isDesktop = useIsDesktop()

const profile = ref(null)
const loadError = ref(false)
const creating = ref(false)
const ladderOpen = ref(false)

const tier = useTierProgress(computed(() => profile.value?.points ?? 0))
const { points: POINTS } = NORMAL_RULES
const pointsRule = `Menang +${POINTS.win} · Seri +${POINTS.draw} · Kalah +${POINTS.lose}`

const lastMatchText = computed(() => {
  const last = profile.value?.lastMatch
  if (!last) return 'Belum ada battle. Buat room, lalu kirim tautannya ke teman.'
  if (last.outcome === 'win') return `Terakhir: menang lawan ${last.opponentName}.`
  if (last.outcome === 'loss') return `Terakhir: kalah dari ${last.opponentName}. Jangan lupa jalankan Notes-nya.`
  return `Terakhir: seri dengan ${last.opponentName}.`
})

const nextTierText = computed(() =>
  tier.value.next ? `${tier.value.remaining} poin lagi menuju` : 'Gelar tertinggi sudah kamu raih',
)

async function loadProfile() {
  loadError.value = false
  try {
    profile.value = await getProfile(authStore.user.uid)
  } catch {
    loadError.value = true
  }
}

async function handleCreateRoom() {
  if (creating.value) return
  creating.value = true
  try {
    const mode = resolveMode(route.query)
    const roomId = await createRoom({ durationMin: NORMAL_RULES.defaultDurationMin, mode })
    await router.push({ name: 'lobby', params: { id: roomId }, query: mode === 'demo' ? { mode } : {} })
  } catch {
    showToast('Room gagal dibuat. Coba lagi.')
  } finally {
    creating.value = false
  }
}

async function handleSignOut() {
  await signOut()
  await router.replace({ name: 'login' })
}

onMounted(loadProfile)
</script>

<template>
  <div class="dashboard">
    <header class="dashboard__header">
      <p class="heading-24 only-desktop">FokusBareng</p>
      <div class="dashboard__header-actions">
        <p class="caption-12-semibold dashboard__points-chip only-desktop">{{ tier.points }} poin</p>
        <ProfileMenu :name="authStore.user?.name ?? ''" :email="authStore.user?.email" @sign-out="handleSignOut" />
      </div>
    </header>

    <p v-if="loadError" class="body-14-regular dashboard__error" role="alert">
      Profil gagal dimuat.
      <button type="button" class="dashboard__retry body-14-semibold" @click="loadProfile">Coba lagi</button>
    </p>

    <main class="dashboard__body" :aria-busy="!profile">
      <!-- Panel gelar. Di ponsel, mengetuknya membuka sheet Tangga gelar. -->
      <section class="dashboard__tier" aria-labelledby="tier-title">
        <component
          :is="isDesktop ? 'div' : 'button'"
          :type="isDesktop ? undefined : 'button'"
          class="dashboard__hero"
          :aria-haspopup="isDesktop ? undefined : 'dialog'"
          @click="!isDesktop && (ladderOpen = true)"
        >
          <TierRing :progress="tier.progress">
            <span class="angka-hero-s d-angka-hero-m">{{ tier.points }}</span>
            <span class="label-12 dashboard__muted">POIN</span>
          </TierRing>
          <span id="tier-title" class="dashboard__tier-name">
            <TierBadge :tier="tier.current.id" :size="isDesktop ? 28 : 22" />
            <span class="heading-28 d-heading-40">{{ tier.current.name }}</span>
          </span>
          <span class="dashboard__next body-14-regular d-body-16-regular">
            <span class="dashboard__muted">{{ nextTierText }}</span>
            <template v-if="tier.next">
              <TierBadge :tier="tier.next.id" :achieved="tier.next.id !== 'jawara'" :size="isDesktop ? 16 : 14" />
              <span class="body-14-semibold d-body-16-semibold dashboard__accent">{{ tier.next.name }}</span>
            </template>
            <AppIcon v-if="!isDesktop" name="chev" class="dashboard__muted" />
          </span>
        </component>
      </section>

      <div class="dashboard__side">
        <div class="dashboard__intro only-desktop">
          <p class="label-12 dashboard__muted">DASBOR</p>
          <h1 class="heading-48">Siap adu fokus?</h1>
          <p class="body-16-regular dashboard__muted">Buat room, kirim tautan ke teman, lalu fokus bareng sampai timer habis.</p>
          <div class="dashboard__desktop-actions">
            <AppButton :disabled="creating" @click="handleCreateRoom">
              <AppIcon name="plus" />
              Buat room
            </AppButton>
            <AppButton variant="secondary" :to="{ name: 'solo' }">
              <AppIcon name="book" :size="20" />
              Belajar mandiri
            </AppButton>
          </div>
        </div>

        <section class="dashboard__record" aria-label="Rekor">
          <p class="label-12 dashboard__muted only-desktop">REKOR</p>
          <dl class="dashboard__stats">
            <div class="dashboard__stat">
              <dt class="caption-13-regular d-body-14-regular dashboard__stat-label"><span class="dot dot--win" />Menang</dt>
              <dd class="angka-stat">{{ profile?.wins ?? 0 }}</dd>
            </div>
            <div class="dashboard__stat">
              <dt class="caption-13-regular d-body-14-regular dashboard__stat-label"><span class="dot dot--loss" />Kalah</dt>
              <dd class="angka-stat">{{ profile?.losses ?? 0 }}</dd>
            </div>
            <div class="dashboard__stat">
              <dt class="caption-13-regular d-body-14-regular dashboard__stat-label"><span class="dot dot--draw" />Seri</dt>
              <dd class="angka-stat">{{ profile?.draws ?? 0 }}</dd>
            </div>
            <div class="dashboard__stat dashboard__stat--focus only-desktop">
              <dt class="body-14-regular dashboard__stat-label"><span class="dot dot--focus" />Waktu fokus</dt>
              <dd class="angka-stat">{{ profile?.totalFocusMin ?? 0 }} mnt</dd>
            </div>
          </dl>
          <div class="dashboard__focus only-mobile">
            <span class="body-14-regular dashboard__muted">Total waktu fokus</span>
            <span class="body-16-semibold">{{ profile?.totalFocusMin ?? 0 }} mnt</span>
          </div>
        </section>

        <section class="dashboard__ladder only-desktop" aria-labelledby="ladder-title">
          <div class="dashboard__ladder-head">
            <h2 id="ladder-title" class="label-12">TANGGA GELAR</h2>
            <p class="caption-13-regular">{{ pointsRule }}</p>
          </div>
          <TierLadder variant="track" :current-id="tier.current.id" :reached-ids="tier.reachedIds" />
        </section>
      </div>

      <div class="dashboard__mobile-actions only-mobile">
        <p class="body-14-regular dashboard__muted dashboard__last">{{ lastMatchText }}</p>
        <AppButton block :disabled="creating" @click="handleCreateRoom">Buat room</AppButton>
        <AppButton block variant="secondary" :to="{ name: 'solo' }">
          <AppIcon name="book" :size="20" />
          Belajar mandiri
        </AppButton>
      </div>
    </main>

    <SheetDialog :open="ladderOpen && !isDesktop" labelledby="ladder-sheet-title" @close="ladderOpen = false">
      <div class="ladder-sheet">
        <p class="label-12 dashboard__muted">TANGGA GELAR</p>
        <h2 id="ladder-sheet-title" class="heading-24">
          {{ tier.next ? `${tier.remaining} poin lagi menuju ${tier.next.name}` : 'Gelar tertinggi sudah kamu raih' }}
        </h2>
        <TierLadder :current-id="tier.current.id" :reached-ids="tier.reachedIds" />
        <p class="caption-13-regular dashboard__muted">{{ pointsRule }}</p>
        <AppButton variant="secondary" block @click="ladderOpen = false">Tutup</AppButton>
      </div>
    </SheetDialog>
  </div>
</template>

<style scoped>
/* Ponsel dan tablet */
.dashboard {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: var(--container-tablet);
  min-height: 100dvh;
  margin-inline: auto;
  padding: var(--space-56) var(--space-20) var(--space-28);
}

.dashboard__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dashboard__header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.dashboard__muted {
  color: var(--text-secondary);
}

.dashboard__accent {
  color: var(--accent-amber);
}

.dashboard__error {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  margin-top: var(--space-16);
  color: var(--status-danger);
}

.dashboard__retry {
  min-height: var(--tap-min);
  padding: 0 var(--space-12);
  background: transparent;
  border: var(--line-width) solid var(--line-subtle);
  border-radius: var(--radius-pill);
  color: var(--text-primary);
}

.dashboard__body {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.dashboard__tier {
  margin-top: var(--space-28);
}

.dashboard__hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-12);
  width: 100%;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: var(--radius-24);
  color: var(--text-primary);
}

.dashboard__tier-name,
.dashboard__next {
  display: flex;
  align-items: center;
}

.dashboard__tier-name {
  gap: var(--space-8);
}

.dashboard__next {
  gap: var(--space-4);
}

.dashboard__record {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
  margin-top: var(--space-28);
  padding: var(--space-20);
  background-color: var(--bg-surface);
  border-radius: var(--radius-24);
}

.dashboard__stats {
  display: flex;
}

.dashboard__stat {
  display: flex;
  flex: 1;
  flex-direction: column-reverse;
  align-items: center;
  gap: var(--space-4);
}

.dashboard__stat dd {
  margin: 0;
  white-space: nowrap;
}

.dashboard__stat-label {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  color: var(--text-secondary);
}

.dot {
  width: var(--dot-size);
  height: var(--dot-size);
  border-radius: var(--radius-pill);
}

.dot--win {
  background-color: var(--status-success);
}

.dot--loss {
  background-color: var(--status-danger);
}

.dot--draw {
  background-color: var(--text-secondary);
}

.dot--focus {
  background-color: var(--accent-amber);
}

.dashboard__focus {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-16);
  border-top: var(--line-width) solid var(--bg-pressed);
}

.dashboard__mobile-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  margin-top: auto;
  padding-top: var(--space-28);
}

.dashboard__last {
  text-align: center;
}

.ladder-sheet {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

/* Desktop: header 88 px, panel gelar kiri, kolom kanan */
@media (min-width: 1024px) {
  .dashboard {
    max-width: none;
    height: 100dvh;
    min-height: 0;
    padding: 0;
  }

  .dashboard__header {
    flex-shrink: 0;
    height: var(--header-height-d);
    padding-inline: var(--space-40);
  }

  .dashboard__points-chip {
    display: flex;
    align-items: center;
    min-height: var(--tap-min);
    padding: 0 var(--space-16);
    background-color: var(--bg-surface);
    border-radius: var(--radius-pill);
  }

  .dashboard__error {
    margin: 0 var(--space-40) var(--space-16);
  }

  .dashboard__body {
    flex-direction: row;
    gap: var(--space-24);
    min-height: 0;
    padding: 0 var(--space-40) var(--space-40);
  }

  /* Panel gelar dan kolom kanan berbagi lebar 2 : 3, panel gelar maksimal selebar Figma (540) */
  .dashboard__tier {
    display: flex;
    flex: 2 1 0;
    max-width: var(--panel-tier-width);
    align-items: center;
    justify-content: center;
    min-width: 0;
    margin: 0;
    padding: var(--space-40);
    background-color: var(--bg-surface);
    border-radius: var(--radius-32);
  }

  .dashboard__hero {
    gap: var(--space-16);
  }

  .dashboard__side {
    display: flex;
    flex: 3 1 0;
    flex-direction: column;
    gap: var(--space-24);
    min-width: 0;
    overflow-y: auto;
  }

  .dashboard__intro {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
  }

  .dashboard__desktop-actions {
    display: flex;
    gap: var(--space-12);
    margin-top: var(--space-16);
  }

  .dashboard__record,
  .dashboard__ladder {
    gap: var(--space-20);
    margin: 0;
    padding: var(--space-28);
    background-color: var(--bg-surface);
    border-radius: var(--radius-28);
  }

  .dashboard__ladder {
    display: flex;
    flex-direction: column;
  }

  .dashboard__ladder-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--text-secondary);
  }

  .dashboard__stat {
    align-items: flex-start;
    gap: var(--space-8);
  }
}
</style>
