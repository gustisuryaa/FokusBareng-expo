<script setup>
// Salinan statis M04 · Arena (Check-In) pada kanvas 390 x 844, posisi mengikuti Figma.
defineProps({
  clock: { type: String, required: true },
  progress: { type: Number, required: true },
  seconds: { type: Number, required: true },
  sheetOpen: { type: Boolean, default: true },
})

const players = [
  { initial: 'A', name: 'Kamu', self: true },
  { initial: 'B', name: 'Lawan', self: false },
]
</script>

<template>
  <div class="m04" :class="{ 'm04--sheet': sheetOpen }">
    <div class="m04__players">
      <span v-for="player in players" :key="player.initial" class="m04__chip" :class="{ 'm04__chip--self': player.self }">
        <span class="m04__avatar avatar-s">{{ player.initial }}</span>
        <span class="m04__chip-text">
          <span class="body-14-semibold m04__name">{{ player.name }}</span>
          <span class="caption-12-regular m04__muted">2 Check-In</span>
        </span>
        <i class="m04__dot" />
      </span>
    </div>

    <div class="m04__ring">
      <svg viewBox="0 0 310 310" fill="none">
        <circle cx="155" cy="155" r="150" stroke-width="10" class="m04__track" />
        <circle
          cx="155"
          cy="155"
          r="150"
          stroke-width="10"
          stroke-linecap="round"
          pathLength="100"
          class="m04__progress"
          :stroke-dasharray="`${progress * 100} 100`"
          transform="rotate(-90 155 155)"
        />
      </svg>
      <span class="m04__ring-center">
        <span class="label-12 m04__muted">SISA WAKTU</span>
        <span class="angka-timer-m">{{ clock }}</span>
        <span class="body-14-regular m04__muted">dari 25 menit</span>
      </span>
    </div>

    <p class="m04__hint caption-13-regular m04__muted">Tetap di tab ini. Check-In muncul acak. Keluar dari Arena dihitung kalah.</p>
    <span class="m04__leave body-14-semibold">Keluar dari Arena</span>

    <div class="m04__trail">
      <span class="m04__trail-head">
        <span class="label-12 m04__muted">JEJAK CHECK-IN</span>
        <span class="caption-13-semibold m04__success">2 dijawab berdua</span>
      </span>
      <span class="m04__trail-track">
        <i class="m04__trail-line" />
        <i class="m04__trail-done" />
        <i class="m04__tick" style="left: 29.5px" />
        <i class="m04__tick" style="left: 95.5px" />
        <i class="m04__now" />
      </span>
      <span class="m04__trail-head">
        <span class="label-12 m04__muted">MULAI</span>
        <span class="caption-12-regular m04__muted">25:00</span>
      </span>
    </div>

    <span class="m04__scrim" />
    <div class="m04__sheet">
      <i class="m04__grabber" />
      <span class="label-12 m04__amber">CHECK-IN</span>
      <span class="heading-28">Masih fokus?</span>
      <span class="angka-hero-m m04__amber">{{ seconds }}</span>
      <span class="body-14-regular m04__muted">detik untuk menjawab</span>
      <span class="m04__answer body-16-bold">Masih fokus</span>
    </div>
  </div>
</template>

<style scoped>
.m04 {
  position: relative;
  width: 390px;
  height: 844px;
  overflow: hidden;
  background-color: var(--bg-base);
  color: var(--text-primary);
}

.m04__muted {
  color: var(--text-secondary);
}

.m04__amber {
  color: var(--accent-amber);
}

.m04__success {
  color: var(--status-success);
}

.m04__players {
  position: absolute;
  top: 56px;
  left: 20px;
  display: flex;
  gap: 8px;
  width: 350px;
}

.m04__chip {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 10px;
  height: 52px;
  padding: 0 16px 0 6px;
  background-color: var(--bg-surface);
  border: 1.5px solid transparent;
  border-radius: var(--radius-pill);
}

.m04__chip--self {
  border-color: var(--accent-amber);
}

.m04__chip--self .m04__name {
  color: var(--accent-amber);
}

.m04__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: var(--bg-elevated);
  border-radius: var(--radius-pill);
}

.m04__chip-text {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.m04__dot {
  width: 8px;
  height: 8px;
  background-color: var(--status-success);
  border-radius: var(--radius-pill);
}

.m04__ring {
  position: absolute;
  top: 148px;
  left: 40px;
  width: 310px;
  height: 310px;
}

.m04__ring svg {
  position: absolute;
  inset: 0;
}

.m04__track {
  stroke: var(--bg-pressed);
}

.m04__progress {
  stroke: var(--accent-amber);
  transition: stroke-dasharray 1s linear;
}

.m04__ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.m04__hint {
  position: absolute;
  top: 478px;
  left: 40px;
  width: 310px;
  margin: 0;
  text-align: center;
}

.m04__leave {
  position: absolute;
  top: 526px;
  left: 117px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 156px;
  height: 44px;
  border: 1px solid var(--line-subtle);
  border-radius: var(--radius-pill);
}

.m04__trail {
  position: absolute;
  top: 641px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 350px;
  padding: 20px;
  background-color: var(--bg-surface);
  border-radius: var(--radius-20);
}

.m04__trail-head {
  display: flex;
  justify-content: space-between;
}

.m04__trail-track {
  position: relative;
  height: 22px;
}

.m04__trail-line,
.m04__trail-done {
  position: absolute;
  top: 9px;
  left: 0;
  height: 4px;
  border-radius: var(--radius-pill);
}

.m04__trail-line {
  width: 100%;
  background-color: var(--bg-pressed);
}

.m04__trail-done {
  width: 50%;
  background-color: var(--line-input);
}

.m04__tick {
  position: absolute;
  top: 3px;
  width: 3px;
  height: 16px;
  background-color: var(--status-success);
  border-radius: var(--radius-pill);
}

.m04__now {
  position: absolute;
  top: 5px;
  left: calc(50% - 6px);
  width: 12px;
  height: 12px;
  background-color: var(--accent-amber);
  border-radius: var(--radius-pill);
}

/* Sheet Check-In: naik dari bawah seperti di Arena sungguhan */
.m04__scrim {
  position: absolute;
  inset: 0;
  background-color: var(--overlay-scrim);
  opacity: 0;
  transition: opacity 240ms var(--ease-out);
}

.m04__sheet {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 344px;
  padding: 36px 24px 0;
  background-color: var(--bg-elevated);
  border-radius: var(--radius-28) var(--radius-28) 0 0;
  transform: translateY(100%);
  transition: transform 360ms var(--ease-out);
}

.m04--sheet .m04__scrim {
  opacity: 1;
}

.m04--sheet .m04__sheet {
  transform: none;
}

.m04__grabber {
  position: absolute;
  top: 12px;
  width: 40px;
  height: 4px;
  background-color: var(--line-subtle);
  border-radius: var(--radius-pill);
}

.m04__sheet .heading-28 {
  margin: 8px 0 16px;
}

.m04__answer {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 64px;
  margin-top: 24px;
  background-color: var(--accent-amber);
  border-radius: var(--radius-pill);
  color: var(--text-on-accent);
}
</style>
