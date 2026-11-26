<script setup>
// Logo FokusBareng "Siapa Lengah" (lihat docs/brand/README.md).
// Tinggi mengikuti font-size kelas tipografi yang dipasang di elemen ini,
// jadi pemanggil cukup memberi kelas yang sama seperti teks lama (title-20, heading-24, ...).
import logoUrl from '@/assets/brand/fokusbareng-horizontal-dark.svg'
</script>

<template>
  <img class="brand-logo" :src="logoUrl" alt="FokusBareng" width="160" height="32" />
</template>

<style scoped>
.brand-logo {
  /* Wordmark di lockup ±0,55 dari tingginya: 1.75em membuat nama mendekati ukuran teks lama. */
  height: 1.75em;
  width: auto;
  /* Di flex kolom gambar ikut melebar; gambar tetap di kiri seperti teks lama. */
  object-fit: contain;
  object-position: left center;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
