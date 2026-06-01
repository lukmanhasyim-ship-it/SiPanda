import { callGAS } from './gas'

const AUTH_KEY = 'sipanda_auth'

export async function googleLogin(credential) {
  const result = await callGAS({
    action: 'verifyGoogleToken',
    googleToken: credential,
  })
  if (!result.success) throw new Error(result.error || 'Gagal verifikasi token')
  const session = {
    email: result.data.email,
    name: result.data.name,
    picture: result.data.picture,
    token: credential,
    loggedInAt: new Date().toISOString(),
  }
  localStorage.setItem(AUTH_KEY, JSON.stringify(session))
  return session
}

export function logout() {
  localStorage.removeItem(AUTH_KEY)
}

export function isLoggedIn() {
  try {
    const s = localStorage.getItem(AUTH_KEY)
    if (!s) return false
    const data = JSON.parse(s)
    return !!data.token && !!data.email
  } catch { return false }
}

export function getCurrentUser() {
  try {
    const s = localStorage.getItem(AUTH_KEY)
    return s ? JSON.parse(s) : null
  } catch { return null }
}
