import { createHmac, timingSafeEqual } from 'node:crypto'

export const AUTH_SESSION_COOKIE = 'ditcash_session'
export const AUTH_SESSION_MAX_AGE = 60 * 60 * 24

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET debe estar configurado con al menos 32 caracteres.')
  }
  return secret
}

function sign(payload: string) {
  return createHmac('sha256', getAuthSecret()).update(payload).digest('base64url')
}

export function createAuthSessionToken(userId: number) {
  const payload = `${userId}.${Math.floor(Date.now() / 1000) + AUTH_SESSION_MAX_AGE}`
  return `${payload}.${sign(payload)}`
}

export function readAuthSessionToken(token: string | undefined) {
  if (!token) return null

  const [userIdValue, expirationValue, signature, ...extra] = token.split('.')
  if (!userIdValue || !expirationValue || !signature || extra.length > 0) return null

  const userId = Number(userIdValue)
  const expiration = Number(expirationValue)
  if (!Number.isSafeInteger(userId) || userId <= 0 || !Number.isSafeInteger(expiration)) return null
  if (expiration <= Math.floor(Date.now() / 1000)) return null

  try {
    const payload = `${userIdValue}.${expirationValue}`
    const expected = Buffer.from(sign(payload))
    const actual = Buffer.from(signature)
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null
    return userId
  } catch (error) {
    console.error('No se pudo validar la sesión administrativa:', error)
    return null
  }
}
