// Galat layanan dengan kode yang sama untuk mock dan Firebase, pesan siap ditampilkan.
export class ServiceError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'ServiceError'
    this.code = code
  }
}

export const ERROR_CODES = Object.freeze({
  EMAIL_TAKEN: 'auth/email-already-in-use',
  INVALID_CREDENTIAL: 'auth/invalid-credential',
  NOT_SIGNED_IN: 'auth/not-signed-in',
  INVALID_ARGUMENT: 'invalid-argument',
  NOT_FOUND: 'not-found',
  PERMISSION_DENIED: 'permission-denied',
  ALREADY_EXISTS: 'already-exists',
  NOT_IMPLEMENTED: 'not-implemented',
})
