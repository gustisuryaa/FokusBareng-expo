// Inisialisasi Firebase. Dibuat saat pertama dipakai, jadi mode mock tidak pernah menyentuhnya.
import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectDatabaseEmulator, getDatabase, onValue, ref } from 'firebase/database'

const env = import.meta.env

let instance = null
let serverOffsetMs = 0

export function firebase() {
  if (instance) return instance

  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: env.VITE_FIREBASE_DATABASE_URL,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  })
  const auth = getAuth(app)
  const db = getDatabase(app)

  // Emulator lokal untuk pengembangan dan tes, contoh: VITE_FIREBASE_EMULATOR_HOST=127.0.0.1
  const emulatorHost = env.VITE_FIREBASE_EMULATOR_HOST
  if (emulatorHost) {
    connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true })
    connectDatabaseEmulator(db, emulatorHost, 9000)
  }

  // Selisih jam server dan perangkat, diperbarui terus oleh Firebase
  onValue(ref(db, '.info/serverTimeOffset'), (snapshot) => {
    serverOffsetMs = snapshot.val() ?? 0
  })

  instance = { app, auth, db }
  return instance
}

export function getOffsetMs() {
  return serverOffsetMs
}

// Perkiraan waktu server, dipakai untuk pemeriksaan sebelum menulis
export function serverNow() {
  return Date.now() + serverOffsetMs
}
