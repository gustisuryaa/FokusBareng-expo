import { reactive } from 'vue'

// Lama toast tampil. Ini aturan tampilan, bukan aturan main, jadi tidak di gameRules.js.
const TOAST_DURATION_MS = 2400

// Satu toast dalam satu waktu. id berganti supaya pesan yang sama tetap dianimasikan ulang.
export const toastState = reactive({ message: '', id: 0 })

let hideTimer = null

export function showToast(message) {
  clearTimeout(hideTimer)
  toastState.message = message
  toastState.id += 1
  hideTimer = setTimeout(() => {
    toastState.message = ''
  }, TOAST_DURATION_MS)
}

export function useToast() {
  return { showToast }
}
