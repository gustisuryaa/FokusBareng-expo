<script setup>
// Figma: kartu pemain di Arena. Mobile = pil "Pemain A/B" (M03 dan M22t 135:383),
// desktop = kartu besar (D03 39:715). Satu komponen, bentuknya diatur CSS di 1024 px.
import { computed } from 'vue'

const props = defineProps({
  initial: { type: String, required: true },
  name: { type: String, required: true },
  // Kartu milik pemain sendiri: bingkai dan nama amber
  self: { type: Boolean, default: false },
  answeredCount: { type: Number, default: 0 },
  connection: {
    type: String,
    default: 'connected',
    validator: (value) => ['connected', 'disconnected'].includes(value),
  },
  // Sisa toleransi putus dalam detik, dipakai saat terputus
  secondsLeft: { type: Number, default: 0 },
})

const disconnected = computed(() => props.connection === 'disconnected')
const mobileDetail = computed(() =>
  disconnected.value ? 'Terputus' : `${props.answeredCount} Check-In`,
)
const desktopStatus = computed(() => {
  if (!disconnected.value) return 'ONLINE'
  return `${props.self ? 'MENYAMBUNG' : 'TERPUTUS'} · ${props.secondsLeft} DTK`
})
</script>

<template>
  <div class="presence-chip" :class="{ 'presence-chip--self': self, 'presence-chip--disconnected': disconnected }">
    <span class="presence-chip__avatar avatar-s d-avatar-m" aria-hidden="true">
      <!-- Ponsel saat terputus: lingkaran avatar menampilkan hitung mundur supaya teks tidak terpotong -->
      <span v-if="disconnected" class="only-mobile presence-chip__countdown">{{ secondsLeft }}</span>
      <span :class="{ 'only-desktop': disconnected }">{{ initial }}</span>
    </span>
    <span class="presence-chip__text">
      <span class="presence-chip__name body-14-semibold d-heading-24">{{ name }}</span>
      <span class="presence-chip__detail caption-12-regular only-mobile">{{ mobileDetail }}</span>
    </span>
    <span v-if="disconnected" class="visually-hidden only-mobile">, {{ secondsLeft }} detik lagi</span>
    <span v-else class="presence-chip__dot only-mobile" aria-hidden="true" />

    <span class="presence-chip__divider only-desktop" aria-hidden="true" />
    <span class="presence-chip__status label-12 only-desktop">
      <span class="presence-chip__dot" aria-hidden="true" />
      {{ desktopStatus }}
    </span>
    <span class="presence-chip__count only-desktop">
      <span class="body-14-regular">Check-In dijawab</span>
      <span class="title-20">{{ answeredCount }}</span>
    </span>
    <span v-if="!disconnected" class="visually-hidden only-mobile">tersambung</span>
  </div>
</template>

<style scoped>
.presence-chip {
  display: flex;
  flex: 1;
  align-items: center;
  gap: var(--space-8);
  min-width: 0;
  height: var(--control-row);
  padding: 0 var(--space-16) 0 var(--space-8);
  background-color: var(--bg-surface);
  border: var(--line-width-strong) solid transparent;
  border-radius: var(--radius-pill);
  color: var(--text-primary);
  transition: border-color var(--motion-base) var(--ease-out);
}

.presence-chip__avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: var(--space-40);
  height: var(--space-40);
  background-color: var(--bg-elevated);
  border-radius: var(--radius-pill);
}

.presence-chip__text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.presence-chip__name,
.presence-chip__detail {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.presence-chip__detail {
  color: var(--text-secondary);
}

.presence-chip__dot {
  flex-shrink: 0;
  width: var(--dot-presence);
  height: var(--dot-presence);
  background-color: var(--status-success);
  border-radius: var(--radius-pill);
}

.presence-chip--self {
  border-color: var(--accent-amber);
}

.presence-chip--self .presence-chip__name {
  color: var(--accent-amber);
}

.presence-chip--disconnected .presence-chip__detail,
.presence-chip--disconnected .presence-chip__status {
  color: var(--accent-amber);
}

.presence-chip--disconnected .presence-chip__dot {
  background-color: var(--accent-amber);
}

.presence-chip__countdown {
  color: var(--accent-amber);
  font-variant-numeric: tabular-nums;
}

.presence-chip--disconnected .presence-chip__avatar {
  box-shadow: inset 0 0 0 var(--line-width-strong) var(--accent-amber);
}

/* Desktop: kartu besar */
@media (min-width: 1024px) {
  .presence-chip {
    /* Boleh menyusut di 1024 px supaya dua kartu dan ring tetap muat */
    flex: 0 1 var(--arena-card-width);
    min-width: 0;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-16);
    height: auto;
    padding: var(--space-28);
    border-radius: var(--radius-28);
  }

  .presence-chip__avatar {
    width: var(--avatar-arena-d);
    height: var(--avatar-arena-d);
  }

  .presence-chip--self .presence-chip__avatar {
    border: var(--focus-ring-width) solid var(--accent-amber);
  }

  .presence-chip__text {
    flex: 0 0 auto;
    width: 100%;
  }

  .presence-chip__divider {
    width: 100%;
    height: var(--line-width);
    background-color: var(--bg-pressed);
  }

  .presence-chip__status {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    color: var(--status-success);
  }

  .presence-chip__count {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    color: var(--text-secondary);
  }

  .presence-chip__count .title-20 {
    color: var(--text-primary);
  }
}
</style>
