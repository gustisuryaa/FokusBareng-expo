// Penanda room "#XXXX": 4 karakter terakhir roomId, huruf kapital. Hanya tampilan.
export function roomTag(roomId) {
  return `#${String(roomId).slice(-4).toUpperCase()}`
}

// roomId dari tujuan redirect berbentuk /room/{id}..., atau null
export function roomIdFromPath(path) {
  const match = /^\/room\/([^/?#]+)/.exec(typeof path === 'string' ? path : '')
  return match ? match[1] : null
}
