import { onBeforeUnmount } from 'vue'
import { setPresence } from '@/services'

// Presence pemain di room: online saat halaman terlihat, offline saat tab disembunyikan,
// ditutup, atau komponen dilepas. Firebase menambahkan onDisconnect di setPresence.
export function usePresence() {
  let roomId = null

  const write = (online) => {
    if (roomId) setPresence(roomId, online).catch(() => {})
  }
  const onVisibility = () => write(document.visibilityState === 'visible')
  const onPageHide = () => write(false)

  function start(id) {
    if (roomId === id) return
    stop()
    roomId = id
    write(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)
  }

  function stop() {
    if (!roomId) return
    write(false)
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('pagehide', onPageHide)
    roomId = null
  }

  onBeforeUnmount(stop)
  return { start, stop }
}
