import { reactive } from 'vue'
import { getProfile } from '@/services'

// Nama tampilan per uid, diambil sekali lalu disimpan
const names = reactive({})

export function usePlayerNames() {
  async function load(uid) {
    if (!uid || names[uid]) return
    try {
      names[uid] = (await getProfile(uid)).name
    } catch {
      names[uid] = ''
    }
  }
  return { names, load }
}
