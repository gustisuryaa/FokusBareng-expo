import { onBeforeUnmount } from 'vue'
import { onConnectionChange, setPresence } from '@/services'

// Presence pemain di room: online saat halaman terlihat, offline saat tab disembunyikan,
// ditutup, atau komponen dilepas. Firebase menambahkan onDisconnect di setPresence.
// Setelah sambungan putus, server sudah menulis offline dan onDisconnect habis terpakai,
// jadi presence ditulis ulang setiap kali tersambung lagi.
export function usePresence() {
  let roomId = null
  let stopConnection = null

  const write = (online) => {
    if (roomId) setPresence(roomId, online).catch(() => {})
  }
  const onVisibility = () => write(document.visibilityState === 'visible')
  const onPageHide = () => write(false)
  const onConnection = (online) => {
    if (online) write(document.visibilityState === 'visible')
  }

  function start(id) {
    if (roomId === id) return
    stop()
    roomId = id
    write(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)
    stopConnection = onConnectionChange(onConnection)
  }

  function stop() {
    if (!roomId) return
    write(false)
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('pagehide', onPageHide)
    stopConnection?.()
    stopConnection = null
    roomId = null
  }

  onBeforeUnmount(stop)
  return { start, stop }
}
