<script setup>
// Bingkai tablet untuk pratinjau layar desktop: bezel hitam, tepi logam tipis, sudut membulat.
// Ukuran bezel dan sudut memakai cqw supaya proporsinya sama di lebar berapa pun.
</script>

<template>
  <div class="tablet">
    <div class="tablet__body">
      <div class="tablet__screen">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.tablet {
  container-type: inline-size;
}

.tablet__body {
  /* Warna perangkat, bukan token UI */
  --device-bezel: #000;
  --device-rim: #8e8e93;
  --device-rim-inner: #2c2c2e;

  padding: 2.9cqw;
  background-color: var(--device-bezel);
  border-radius: 4.4cqw;
  box-shadow:
    inset 0 0 0 0.25cqw var(--device-rim-inner),
    0 0 0 max(1px, 0.2cqw) var(--device-rim);
}

.tablet__screen {
  overflow: hidden;
  border-radius: 1.8cqw;
}
</style>
