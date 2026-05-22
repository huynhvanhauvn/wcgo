import { supabase } from './supabaseClient'

const USERNAME_EMAIL_DOMAIN = 'wcgo.example.com'
const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,31}$/

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase()
}

export function getUsernameEmail(username: string) {
  const normalized = normalizeUsername(username)
  if (!USERNAME_PATTERN.test(normalized)) {
    throw new Error('Username must be 3-32 characters and use letters, numbers, dots, underscores, or hyphens.')
  }
  return `${normalized}@${USERNAME_EMAIL_DOMAIN}`
}

export function getUserDisplayName(user: { email?: string | null; user_metadata?: any } | null) {
  if (!user) return ''
  const username = user.user_metadata?.username
  if (typeof username === 'string' && username.trim()) return username
  if (user.email?.endsWith(`@${USERNAME_EMAIL_DOMAIN}`)) return user.email.split('@')[0]
  return user.email ?? 'User'
}

export async function signUpWithUsername(username: string, password: string) {
  const normalized = normalizeUsername(username)
  const email = getUsernameEmail(normalized)
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: normalized,
        username: normalized
      }
    }
  })
}

export async function signInWithUsername(username: string, password: string) {
  const email = getUsernameEmail(username)
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange((event, session) => callback(event, session))
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser()
  return data?.user ?? null
}
