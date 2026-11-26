<script setup>
import BrandLogo from '@/components/ui/BrandLogo.vue'
// Salinan statis D03 · Arena (berjalan) pada kanvas 1440 x 900, posisi mengikuti Figma.
// Hanya untuk pratinjau di landing, jadi pakai kelas tipe dasar (tanpa varian d-*) agar tidak ikut berubah di breakpoint.
defineProps({
  clock: { type: String, required: true },
  progress: { type: Number, required: true },
})

const players = [
  { initial: 'A', name: 'Kamu', self: true, left: 40 },
  { initial: 'B', name: 'Lawan', self: false, left: 1120 },
]
</script>

<template>
  <div class="d03">
    <header class="d03__header">
      <BrandLogo class="heading-24" />
      <span class="d03__room label-12">ROOM #XXXX · 25 MENIT</span>
    </header>

    <div
      v-for="player in players"
      :key="player.initial"
      class="d03__card"
      :class="{ 'd03__card--self': player.self }"
      :style="{ left: `${player.left}px` }"
    >
      <span class="d03__avatar avatar-m">{{ player.initial }}</span>
      <span class="heading-24 d03__name">{{ player.name }}</span>
      <span class="d03__divider" />
      <span class="d03__online label-12"><i class="d03__dot" />ONLINE</span>
      <span class="d03__count">
        <span class="body-14-regular d03__muted">Check-In dijawab</span>
        <span class="title-20">2</span>
      </span>
    </div>

    <div class="d03__ring">
      <svg viewBox="0 0 480 480" fill="none">
        <circle cx="240" cy="240" r="234" stroke-width="12" class="d03__track" />
        <circle
          cx="240"
          cy="240"
          r="234"
          stroke-width="12"
          stroke-linecap="round"
          pathLength="100"
          class="d03__progress"
          :stroke-dasharray="`${progress * 100} 100`"
          transform="rotate(-90 240 240)"
        />
      </svg>
      <span class="d03__ring-center">
        <span class="label-12 d03__muted">SISA WAKTU</span>
        <span class="angka-timer-l">{{ clock }}</span>
        <span class="body-16-regular d03__muted">dari 25 menit</span>
      </span>
    </div>

    <p class="d03__hint body-16-regular d03__muted">
      Tetap di tab ini. Check-In muncul acak, jawab dalam 20 detik. Keluar dari Arena dihitung kalah.
    </p>
    <span class="d03__leave body-14-semibold">Keluar dari Arena</span>

    <div class="d03__trail">
      <span class="d03__trail-head">
        <span class="label-12 d03__muted">JEJAK CHECK-IN</span>
        <span class="caption-13-semibold d03__success">2 dijawab berdua</span>
      </span>
      <span class="d03__trail-track">
        <i class="d03__trail-line" />
        <i class="d03__trail-done" />
        <i class="d03__tick" style="left: 128.5px" />
        <i class="d03__tick" style="left: 404.5px" />
        <i class="d03__now" />
      </span>
      <span class="d03__trail-head">
        <span class="label-12 d03__muted">MULAI</span>
        <span class="caption-12-regular d03__muted">25:00</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.d03 {
  position: relative;
  width: 1440px;
  height: 900px;
  background-color: var(--bg-base);
  color: var(--text-primary);
}

.d03 p {
  margin: 0;
}

.d03__muted {
  color: var(--text-secondary);
}

.d03__success {
  color: var(--status-success);
}

.d03__header {
  position: absolute;
  inset: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88px;
  padding: 0 40px;
}

.d03__room {
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 16px;
  background-color: var(--bg-surface);
  border-radius: var(--radius-pill);
}

.d03__card {
  position: absolute;
  top: 261px;
  display: flex;
  flex-direction: column;
  width: 280px;
  height: 268px;
  padding: 28px;
  background-color: var(--bg-surface);
  border: 1.5px solid transparent;
  border-radius: var(--radius-24);
}

.d03__card--self {
  border-color: var(--accent-amber);
}

.d03__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  background-color: var(--bg-elevated);
  border-radius: var(--radius-pill);
}

.d03__card--self .d03__avatar {
  background-color: var(--bg-base);
  border: 2px solid var(--accent-amber);
}

.d03__name {
  margin-top: 16px;
}

.d03__card--self .d03__name {
  color: var(--accent-amber);
}

.d03__divider {
  height: 1px;
  margin-top: 16px;
  background-color: var(--line-subtle);
}

.d03__online {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  color: var(--status-success);
}

.d03__dot {
  width: 8px;
  height: 8px;
  background-color: var(--status-success);
  border-radius: var(--radius-pill);
}

.d03__count {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
}

.d03__ring {
  position: absolute;
  top: 105px;
  left: 480px;
  width: 480px;
  height: 480px;
}

.d03__ring svg {
  position: absolute;
  inset: 0;
}

.d03__track {
  stroke: var(--bg-pressed);
}

.d03__progress {
  stroke: var(--accent-amber);
  transition: stroke-dasharray 1s linear;
}

.d03__ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.d03__hint {
  position: absolute;
  top: 605px;
  right: 0;
  left: 0;
  text-align: center;
}

.d03__leave {
  position: absolute;
  top: 641px;
  left: 642px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 156px;
  height: 44px;
  border: 1px solid var(--line-subtle);
  border-radius: var(--radius-pill);
}

.d03__trail {
  position: absolute;
  top: 726px;
  left: 40px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 1360px;
  height: 134px;
  padding: 24px 32px;
  background-color: var(--bg-surface);
  border-radius: var(--radius-24);
}

.d03__trail-head {
  display: flex;
  justify-content: space-between;
}

.d03__trail-track {
  position: relative;
  height: 24px;
}

.d03__trail-line,
.d03__trail-done {
  position: absolute;
  top: 10px;
  left: 0;
  height: 4px;
  border-radius: var(--radius-pill);
}

.d03__trail-line {
  width: 100%;
  background-color: var(--bg-pressed);
}

.d03__trail-done {
  width: 50%;
  background-color: var(--line-input);
}

.d03__tick {
  position: absolute;
  top: 3px;
  width: 3px;
  height: 18px;
  background-color: var(--status-success);
  border-radius: var(--radius-pill);
}

.d03__now {
  position: absolute;
  top: 5px;
  left: calc(50% - 7px);
  width: 14px;
  height: 14px;
  background-color: var(--accent-amber);
  border-radius: var(--radius-pill);
}
</style>
