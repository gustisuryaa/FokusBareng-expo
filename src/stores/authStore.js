import { reactive } from 'vue'

// Sementara hanya menyimpan state. Diisi oleh service mock/firebase di sesi Auth.
export const authStore = reactive({
  user: null,
  ready: true,
})

export function isSignedIn() {
  return authStore.user !== null
}
