import { onBeforeUnmount, ref } from 'vue'
import { onConnectionChange } from '@/services'

// Status sambungan ke database. "Terputus" baru dilaporkan setelah pernah tersambung,
// supaya jeda awal sebelum socket siap tidak tampil sebagai putus sinyal.
export function useConnection() {
  const connected = ref(true)
  let seenOnline = false
  const stop = onConnectionChange((online) => {
    if (online) seenOnline = true
    if (seenOnline) connected.value = online
  })
  onBeforeUnmount(stop)
  return { connected }
}
