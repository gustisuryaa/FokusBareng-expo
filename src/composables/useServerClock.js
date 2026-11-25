import { onBeforeUnmount, onMounted, ref } from 'vue'
import { getServerOffset } from '@/services'

// Waktu server (ms) yang diperbarui berkala. Semua logika waktu memakai ini, bukan Date.now() mentah.
const TICK_MS = 250
// Selisih jam awal bisa 0 sebelum koneksi siap, jadi dibaca ulang berkala
const OFFSET_REFRESH_MS = 10_000

export function useServerClock() {
  const offset = ref(0)
  const now = ref(Date.now())
  let timer = null
  let offsetTimer = null
  let unmounted = false

  const read = () => Date.now() + offset.value

  async function refreshOffset() {
    try {
      offset.value = await getServerOffset()
    } catch {
      // Tetap memakai selisih terakhir
    }
  }

  onMounted(async () => {
    await refreshOffset()
    // Komponen bisa dilepas selama menunggu selisih pertama
    if (unmounted) return
    now.value = read()
    timer = setInterval(() => (now.value = read()), TICK_MS)
    offsetTimer = setInterval(refreshOffset, OFFSET_REFRESH_MS)
  })
  onBeforeUnmount(() => {
    unmounted = true
    clearInterval(timer)
    clearInterval(offsetTimer)
  })

  return { now, read }
}
