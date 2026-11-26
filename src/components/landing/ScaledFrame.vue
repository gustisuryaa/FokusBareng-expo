<script setup>
// Menampilkan layar berukuran asli Figma (misal 1440 x 900) dalam ukuran berapa pun, proporsinya tetap.
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  width: { type: Number, required: true },
  height: { type: Number, required: true },
})

const root = ref(null)
const scale = ref(1)
let observer = null

function update() {
  if (root.value) scale.value = root.value.clientWidth / props.width
}

onMounted(() => {
  update()
  if ('ResizeObserver' in window) {
    observer = new ResizeObserver(update)
    observer.observe(root.value)
  }
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div ref="root" class="scaled" :style="{ aspectRatio: `${width} / ${height}` }">
    <div class="scaled__canvas" :style="{ width: `${width}px`, height: `${height}px`, transform: `scale(${scale})` }">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.scaled {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.scaled__canvas {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
}
</style>
