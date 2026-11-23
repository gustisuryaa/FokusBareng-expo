import { reactive } from 'vue'
import { onAuthChange } from '@/services'

// Pengguna yang sedang masuk: { uid, name } atau null.
// ready = false sampai status auth pertama diketahui (Firebase memuatnya secara async).
export const authStore = reactive({
  user: null,
  ready: false,
})

export function isSignedIn() {
  return authStore.user !== null
}

let unsubscribe = null
let resolveReady
const readyPromise = new Promise((resolve) => {
  resolveReady = resolve
})

// Route guard menunggu ini supaya tidak salah mengarahkan saat auth belum dimuat
export function waitForAuth() {
  return readyPromise
}

// Dipanggil sekali di main.js sebelum router dipasang
export function initAuth() {
  if (unsubscribe) return
  unsubscribe = onAuthChange((user) => {
    authStore.user = user
    authStore.ready = true
    resolveReady()
  })
}
