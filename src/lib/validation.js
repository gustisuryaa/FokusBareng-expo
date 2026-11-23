// Validasi form akun. Batas kata sandi mengikuti Firebase Auth (minimal 6),
// batas nama mengikuti struktur-data.md (users/{uid}/profile/name 1 sampai 60).
export const PASSWORD_MIN_LENGTH = 6
export const NAME_MAX_LENGTH = 60

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isEmailValid(email) {
  return EMAIL_PATTERN.test(String(email ?? '').trim())
}

export function isPasswordValid(password) {
  return String(password ?? '').length >= PASSWORD_MIN_LENGTH
}

export function isNameValid(name) {
  const length = String(name ?? '').trim().length
  return length >= 1 && length <= NAME_MAX_LENGTH
}
