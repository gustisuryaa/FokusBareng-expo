import { reactive } from 'vue'

// Sesi Belajar Mandiri yang sedang berjalan. Disimpan per tab di sessionStorage
// supaya refresh melanjutkan sesi, bukan mengulang dari awal. Baru masuk database saat selesai.
const KEY = 'fokusbareng:solo-session'
const hasBrowser = typeof window !== 'undefined' && typeof sessionStorage !== 'undefined'

function read() {
  if (!hasBrowser) return null
  try {
    return JSON.parse(sessionStorage.getItem(KEY))
  } catch {
    return null
  }
}

export const soloStore = reactive({
  session: read(),
})

export function setSoloSession(session) {
  soloStore.session = session
  if (!hasBrowser) return
  if (session) sessionStorage.setItem(KEY, JSON.stringify(session))
  else sessionStorage.removeItem(KEY)
}
