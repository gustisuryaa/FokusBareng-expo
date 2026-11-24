<script setup>
// Figma: M10 Belajar Mandiri, M11 Pemilihan Teknik, D07 keduanya dalam satu layar.
// Di ponsel step menentukan bagian yang tampil; di desktop keduanya selalu tampil.
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import TechniquePicker from '@/components/solo/TechniquePicker.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import { useServerClock } from '@/composables/useServerClock'
import { SOLO_RULES } from '@/config/gameRules'
import { buildSegments, createSession, formatDuration, getPlanMs, getTechnique, summarizeSolo } from '@/domain/solo'
import { listSoloSessions } from '@/services'
import { setSoloSession, soloStore } from '@/stores/soloStore'

defineProps({
  step: { type: String, default: 'overview', validator: (value) => ['overview', 'technique'].includes(value) },
})

const router = useRouter()
const { now, read } = useServerClock()

const entries = ref({})
const loadError = ref(false)
const summary = computed(() => summarizeSolo(entries.value, now.value))

const techniqueId = ref(SOLO_RULES.defaultTechniqueId)
const blockMin = ref(SOLO_RULES.defaultBlockMin)
const checkIn = ref(SOLO_RULES.checkInDefault)
const responseSec = SOLO_RULES.checkIn.responseWindowMs / 1000

const totalText = computed(() => formatDuration(getPlanMs(buildSegments(getTechnique(techniqueId.value), blockMin.value))))

const dateFormat = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })
const historyRows = computed(() =>
  summary.value.recent.map((entry) => ({
    id: entry.id,
    name: getTechnique(entry.technique)?.name ?? entry.technique,
    meta: `${dateFormat.format(entry.endedAt)} · ${entry.completed ? 'Selesai' : 'Dihentikan'}`,
    focus: `${entry.focusMin} mnt`,
  })),
)

function startSession() {
  setSoloSession(createSession({ techniqueId: techniqueId.value, blockMin: blockMin.value, checkIn: checkIn.value, now: read() }))
  router.push({ name: 'solo-session' })
}

onMounted(async () => {
  // Sesi yang masih berjalan di tab ini (misalnya setelah refresh) dilanjutkan
  if (soloStore.session) {
    router.replace({ name: 'solo-session' })
    return
  }
  try {
    entries.value = await listSoloSessions()
  } catch {
    loadError.value = true
  }
})
</script>

<template>
  <div class="solo" :class="`solo--${step}`">
    <header class="solo__app-header only-desktop">
      <p class="heading-24">FokusBareng</p>
      <p class="label-12 solo__chip">BELAJAR MANDIRI · TANPA POIN</p>
    </header>

    <main class="solo__body">
      <!-- M10 · panel kiri D07 -->
      <section class="solo__overview" aria-labelledby="solo-title">
        <div class="solo__top only-mobile">
          <RouterLink :to="{ name: 'dashboard' }" class="solo__icon-button" aria-label="Kembali ke Dasbor">
            <AppIcon name="back" />
          </RouterLink>
          <p class="solo__chip body-16-semibold">Belajar Mandiri</p>
          <p class="solo__chip label-12">TANPA POIN</p>
        </div>
        <RouterLink :to="{ name: 'dashboard' }" class="solo__icon-button solo__icon-button--panel only-desktop" aria-label="Kembali ke Dasbor">
          <AppIcon name="back" />
        </RouterLink>

        <div class="solo__intro">
          <p class="label-12 solo__muted">FOKUS SENDIRI</p>
          <h1 id="solo-title" class="heading-28 d-heading-48">Belajar tanpa lawan</h1>
          <p class="body-16-regular solo__muted">
            Tidak ada poin dan gelar. Check-In acak tetap bisa dinyalakan supaya kamu tidak meninggalkan layar.
          </p>
        </div>

        <dl class="solo__stats">
          <div class="solo__stat">
            <dt class="caption-13-regular solo__muted">Hari ini</dt>
            <dd class="heading-24 d-angka-stat">{{ summary.todayMin }} mnt</dd>
          </div>
          <div class="solo__stat">
            <dt class="caption-13-regular solo__muted">Minggu ini</dt>
            <dd class="heading-24 d-angka-stat">{{ summary.weekMin }} mnt</dd>
          </div>
          <div class="solo__stat">
            <dt class="caption-13-regular solo__muted">
              <span class="only-mobile">Sesi selesai</span>
              <span class="only-desktop">Sesi</span>
            </dt>
            <dd class="heading-24 d-angka-stat">{{ summary.completedCount }}</dd>
          </div>
        </dl>

        <section class="solo__history" aria-labelledby="history-title">
          <h2 id="history-title" class="label-12 solo__muted">RIWAYAT</h2>
          <p v-if="loadError" class="body-16-semibold" role="alert">Riwayat gagal dimuat.</p>
          <template v-else-if="historyRows.length === 0">
            <p class="body-16-semibold">Belum ada sesi mandiri.</p>
            <p class="caption-13-regular d-body-14-regular solo__muted">Sesi yang selesai muncul di sini dengan teknik dan durasinya.</p>
          </template>
          <ul v-else class="solo__history-list">
            <li v-for="row in historyRows" :key="row.id" class="solo__history-row">
              <span class="solo__history-text">
                <span class="body-16-semibold">{{ row.name }}</span>
                <span class="caption-13-regular solo__muted">{{ row.meta }}</span>
              </span>
              <span class="body-16-semibold">{{ row.focus }}</span>
            </li>
          </ul>
        </section>

        <AppButton block class="solo__cta only-mobile" :to="{ name: 'solo-technique' }">Pilih teknik belajar</AppButton>
      </section>

      <!-- M11 · kolom kanan D07 -->
      <section class="solo__technique" aria-labelledby="technique-title">
        <div class="solo__top only-mobile">
          <RouterLink :to="{ name: 'solo' }" class="solo__icon-button" aria-label="Kembali ke Belajar Mandiri">
            <AppIcon name="back" />
          </RouterLink>
          <p class="solo__chip body-16-semibold">Teknik belajar</p>
          <p class="solo__chip label-12">TANPA POIN</p>
        </div>

        <div class="solo__intro solo__intro--technique">
          <p class="label-12 solo__muted">LAMAN PEMILIHAN TEKNIK</p>
          <h1 id="technique-title" class="heading-28 d-heading-40">Pilih cara fokusmu</h1>
        </div>

        <TechniquePicker v-model="techniqueId" v-model:block-min="blockMin" />

        <div class="solo__setting">
          <div class="solo__setting-text">
            <p id="checkin-setting" class="body-16-bold">Check-In acak</p>
            <p id="checkin-setting-desc" class="caption-13-regular solo__muted">Jawab dalam {{ responseSec }} detik, sama seperti di Arena.</p>
          </div>
          <AppSwitch v-model="checkIn" labelledby="checkin-setting" describedby="checkin-setting-desc" />
        </div>

        <div class="solo__footer">
          <p class="solo__total">
            <span class="solo__muted">
              <span class="only-mobile body-14-regular">Total sesi</span>
              <span class="only-desktop label-12">TOTAL SESI</span>
            </span>
            <span class="body-14-semibold d-heading-24">{{ totalText }}</span>
          </p>
          <AppButton class="solo__start" @click="startSession">Mulai sesi</AppButton>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* Ponsel dan tablet */
.solo {
  width: 100%;
  max-width: var(--container-tablet);
  min-height: 100dvh;
  margin-inline: auto;
}

.solo__body,
.solo__overview,
.solo__technique {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

.solo__overview,
.solo__technique {
  padding: var(--space-56) var(--space-20) var(--space-28);
}

.solo--overview .solo__technique,
.solo--technique .solo__overview {
  display: none;
}

.solo__muted {
  color: var(--text-secondary);
}

.solo__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-28);
}

.solo__chip {
  display: flex;
  align-items: center;
  min-height: var(--tap-min);
  padding: 0 var(--space-16);
  background-color: var(--bg-surface);
  border-radius: var(--radius-pill);
}

.solo__icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--tap-min);
  height: var(--tap-min);
  background-color: var(--bg-surface);
  border-radius: var(--radius-pill);
  color: var(--text-primary);
}

.solo__intro {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  margin-bottom: var(--space-24);
}

.solo__intro--technique {
  margin-bottom: var(--space-20);
}

.solo__stats {
  display: flex;
  margin: 0 0 var(--space-12);
  padding: var(--space-20);
  background-color: var(--bg-surface);
  border-radius: var(--radius-24);
}

.solo__stat {
  display: flex;
  flex: 1;
  flex-direction: column-reverse;
  gap: var(--space-4);
  min-width: 0;
}

.solo__stat dd {
  margin: 0;
}

.solo__history {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding: var(--space-20);
  background-color: var(--bg-surface);
  border-radius: var(--radius-24);
}

.solo__history-list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}

.solo__history-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-12);
  padding-block: var(--space-12);
}

.solo__history-row + .solo__history-row {
  border-top: var(--line-width) solid var(--bg-pressed);
}

.solo__history-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
}

.solo__cta {
  margin-top: auto;
}

.solo__overview .solo__history {
  margin-bottom: var(--space-28);
}

.solo__setting {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  margin-top: var(--space-12);
  padding: var(--space-16);
  background-color: var(--bg-surface);
  border-radius: var(--radius-20);
}

.solo__setting-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
}

.solo__footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  margin-top: auto;
  padding-top: var(--space-28);
}

.solo__total {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.solo__start {
  width: 100%;
}

/* Desktop D07: header 88 px, panel ringkasan kiri, pemilihan teknik kanan */
@media (min-width: 1024px) {
  .solo {
    display: flex;
    flex-direction: column;
    max-width: none;
    height: 100dvh;
    min-height: 0;
  }

  .solo__app-header {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    height: var(--header-height-d);
    padding-inline: var(--space-40);
  }

  .solo__body {
    flex: 1;
    flex-direction: row;
    gap: var(--space-24);
    min-height: 0;
    padding: 0 var(--space-40) var(--space-40);
  }

  .solo--overview .solo__technique,
  .solo--technique .solo__overview {
    display: flex;
  }

  .solo__overview {
    flex: 0 1 var(--panel-solo-width);
    gap: var(--space-20);
    min-width: 0;
    min-height: 0;
    padding: var(--space-40);
    overflow-y: auto;
    background-color: var(--bg-surface);
    border-radius: var(--radius-32);
  }

  .solo__icon-button--panel {
    flex-shrink: 0;
    background-color: var(--bg-elevated);
  }

  .solo__intro {
    gap: var(--space-20);
    margin: 0;
  }

  .solo__stats {
    margin: 0;
    padding: var(--space-24);
    background-color: var(--bg-elevated);
  }

  .solo__stat {
    gap: var(--space-8);
  }

  /* Riwayat menempel di bawah panel, tanpa kartu */
  .solo__overview .solo__history {
    gap: var(--space-20);
    margin: auto 0 0;
    padding: 0;
    background: transparent;
  }

  .solo__technique {
    flex: 1;
    gap: var(--space-16);
    min-width: 0;
    min-height: 0;
    padding: 0;
    overflow-y: auto;
  }

  .solo__intro--technique {
    gap: var(--space-16);
  }

  .solo__setting {
    margin: 0;
  }

  .solo__footer {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding-top: var(--space-16);
  }

  .solo__total {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-4);
  }

  .solo__start {
    width: auto;
  }
}
</style>
