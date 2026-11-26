<script setup>
// Bingkai ponsel untuk pratinjau layar mobile: bezel hitam, tepi titanium, Dynamic Island, tombol samping.
// Ukuran Dynamic Island dalam persen layar 390 x 844 (126 x 37 px, 11 px dari atas).
</script>

<template>
  <div class="phone">
    <div class="phone__body">
      <i class="phone__button phone__button--action" />
      <i class="phone__button phone__button--volume-up" />
      <i class="phone__button phone__button--volume-down" />
      <i class="phone__button phone__button--power" />
      <div class="phone__screen">
        <slot />
        <i class="phone__island" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.phone {
  container-type: inline-size;
}

.phone__body {
  /* Warna perangkat, bukan token UI */
  --device-bezel: #000;
  --device-rim: #4a4a4f;
  --device-rim-inner: #26262a;
  --device-button: #3a3a3e;

  position: relative;
  padding: 3.6cqw;
  background-color: var(--device-bezel);
  border-radius: 15.5cqw;
  box-shadow:
    inset 0 0 0 0.6cqw var(--device-rim-inner),
    0 0 0 max(1.5px, 0.9cqw) var(--device-rim);
}

.phone__screen {
  position: relative;
  overflow: hidden;
  border-radius: 12cqw;
}

.phone__island {
  position: absolute;
  top: 1.3%;
  left: 50%;
  z-index: 1;
  width: 32.3%;
  height: 4.4%;
  background-color: var(--device-bezel);
  border-radius: var(--radius-pill);
  /* Layar aplikasi juga gelap, jadi tepinya perlu sedikit terang supaya bentuknya terbaca */
  box-shadow: 0 0 0 max(1px, 0.4cqw) var(--device-rim-inner);
  transform: translateX(-50%);
}

.phone__button {
  position: absolute;
  width: 1.2cqw;
  background-color: var(--device-button);
}

.phone__button--action,
.phone__button--volume-up,
.phone__button--volume-down {
  left: -2.1cqw;
  border-radius: 1cqw 0 0 1cqw;
}

.phone__button--action {
  top: 21%;
  height: 4%;
}

.phone__button--volume-up {
  top: 28.5%;
  height: 7.5%;
}

.phone__button--volume-down {
  top: 38%;
  height: 7.5%;
}

.phone__button--power {
  top: 33%;
  right: -2.1cqw;
  height: 11.5%;
  border-radius: 0 1cqw 1cqw 0;
}
</style>
