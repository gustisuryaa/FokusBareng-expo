import { onBeforeUnmount, onMounted, ref } from 'vue'
import { getServerOffset } from '@/services'

// Waktu server (ms) yang diperbarui berkala. Semua logika waktu memakai ini, bukan Date.now() mentah.
const TICK_MS = 250

export function useServerClock() {
  const offset = ref(0)
  const now = ref(Date.now())
  let timer = null

  const read = () => Date.now() + offset.value

  onMounted(async () => {
    try {
      offset.value = await getServerOffset()
    } catch {
      offset.value = 0
    }
    now.value = read()
    timer = setInterval(() => (now.value = read()), TICK_MS)
  })
  onBeforeUnmount(() => clearInterval(timer))

  return { now, read }
}
