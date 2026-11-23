// Pintu masuk services. Komponen dan store hanya mengimpor dari file ini,
// tidak pernah langsung dari mock/ atau firebase/.
import * as firebaseServices from './firebase/index.js'
import * as mockServices from './mock/index.js'

export const DATA_SOURCE = import.meta.env.VITE_DATA_SOURCE === 'firebase' ? 'firebase' : 'mock'

const services = DATA_SOURCE === 'firebase' ? firebaseServices : mockServices

export const {
  signUp,
  signIn,
  signOut,
  onAuthChange,
  getProfile,
  createRoom,
  openRoom,
  setDuration,
  setNotes,
  requestStart,
  cancelStart,
  confirmReady,
  startBattle,
  setPresence,
  answerCheckIn,
  forfeit,
  claimResult,
  applyPoints,
  listenRoom,
  getServerOffset,
} = services

export { ServiceError, ERROR_CODES } from './errors.js'
