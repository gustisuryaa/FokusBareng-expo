<script setup>
// Figma: Ring gelar di Dasbor (M01 99:15, D01 99:389). Busur 270 derajat, path diambil dari Figma.
// Progres digambar ulang dari data, memakai path yang sama dengan pathLength 100.
defineProps({
  // 0..1 menuju gelar berikutnya
  progress: { type: Number, required: true },
})

const ARC = 'M41.5614 208.439C25.0588 191.936 13.8204 170.91 9.26734 148.021C4.71428 125.131 7.05107 101.405 15.9822 79.8434C24.9134 58.2817 40.0377 39.8526 59.4427 26.8866C78.8477 13.9206 101.662 7 125 7C148.338 7 171.152 13.9206 190.557 26.8866C209.962 39.8526 225.087 58.2817 234.018 79.8434C242.949 101.405 245.286 125.131 240.733 148.021C236.18 170.91 224.941 191.936 208.439 208.439'
</script>

<template>
  <div class="tier-ring">
    <svg class="tier-ring__svg" viewBox="0 0 250 250" fill="none" aria-hidden="true" focusable="false">
      <path :d="ARC" class="tier-ring__track" stroke-width="10" stroke-linecap="round" />
      <path
        v-if="progress > 0"
        :d="ARC"
        class="tier-ring__progress"
        stroke-width="10"
        stroke-linecap="round"
        pathLength="100"
        :stroke-dasharray="`${progress * 100} 100`"
      />
    </svg>
    <div class="tier-ring__center">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.tier-ring {
  position: relative;
  width: var(--ring-tier-m);
  /* Bagian bawah busur terbuka, jadi tinggi dipotong seperti frame Figma (215 dari 250) */
  aspect-ratio: 250 / 215;
  overflow: hidden;
}

.tier-ring__svg {
  position: absolute;
  inset: 0 0 auto;
  width: 100%;
  height: auto;
  aspect-ratio: 1;
}

.tier-ring__track {
  stroke: var(--line-subtle);
}

.tier-ring__progress {
  stroke: var(--accent-amber);
  transition: stroke-dasharray var(--motion-base) var(--ease-out);
}

.tier-ring__center {
  position: absolute;
  /* Posisi blok angka dari Figma: 75 px dari atas ring 250 px (M01) */
  top: calc(var(--ring-tier-m) * 0.3);
  inset-inline: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

@media (min-width: 1024px) {
  .tier-ring {
    width: var(--ring-tier-d);
  }

  /* D01: 97,2 px dari atas ring 360 px */
  .tier-ring__center {
    top: calc(var(--ring-tier-d) * 0.27);
  }
}
</style>
