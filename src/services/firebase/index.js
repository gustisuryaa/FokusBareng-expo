// Implementasi Firebase dari kontrak services (struktur-data.md bagian 4).
// Dikerjakan bersama back-end (Naufal). Sampai saat itu setiap fungsi melempar galat,
// jadi pemakaian tanpa sengaja langsung terlihat. Pilih mock lewat VITE_DATA_SOURCE=mock.

import { ERROR_CODES, ServiceError } from '../errors.js'

function notImplemented(name) {
  return () => {
    throw new ServiceError(ERROR_CODES.NOT_IMPLEMENTED, `services/firebase: ${name} belum diimplementasikan.`)
  }
}

export const signUp = notImplemented('signUp')
export const signIn = notImplemented('signIn')
export const signOut = notImplemented('signOut')
export const onAuthChange = notImplemented('onAuthChange')
export const getProfile = notImplemented('getProfile')
export const createRoom = notImplemented('createRoom')
export const openRoom = notImplemented('openRoom')
export const setDuration = notImplemented('setDuration')
export const setNotes = notImplemented('setNotes')
export const requestStart = notImplemented('requestStart')
export const cancelStart = notImplemented('cancelStart')
export const confirmReady = notImplemented('confirmReady')
export const startBattle = notImplemented('startBattle')
export const setPresence = notImplemented('setPresence')
export const answerCheckIn = notImplemented('answerCheckIn')
export const forfeit = notImplemented('forfeit')
export const claimResult = notImplemented('claimResult')
export const applyPoints = notImplemented('applyPoints')
export const listenRoom = notImplemented('listenRoom')
export const getServerOffset = notImplemented('getServerOffset')
