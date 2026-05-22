import React, { createContext, useContext, useEffect, useState } from 'react'
import { getCurrentUser, getUserDisplayName, onAuthStateChange, signOut } from '../lib/auth'
import * as api from '../lib/api'

type User = {
  id: string
  email?: string | null
  user_metadata?: any
}

type Profile = {
  user_id: string
  full_name?: string | null
  avatar_url?: string | null
  is_admin?: boolean | null
}

const AuthContext = createContext<{
  user: User | null
  profile: Profile | null
  isAdmin: boolean
  loading: boolean
  updateProfile: (values: { fullName: string; avatarUrl: string }) => Promise<void>
  signOut: () => Promise<void>
} | null>(null)

export const useAuth = () => {
  const c = useContext(AuthContext)
  if (!c) throw new Error('useAuth must be used within AuthProvider')
  return c
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let sub: any
    const syncUser = async (u: User | null) => {
      setUser(u)
      setProfile(null)
      setIsAdmin(false)

      if (u) {
        const name = getUserDisplayName(u)
        const avatar = u.user_metadata?.avatar_url ?? null
        let currentProfile = await api.fetchProfileById(u.id).catch(() => null)
        if (!currentProfile) {
          await api.upsertProfile(u.id, name, avatar).catch(() => {})
          currentProfile = await api.fetchProfileById(u.id).catch(() => null)
        }
        const username = getUserDisplayName(u).toLowerCase()
        setProfile(currentProfile)
        setIsAdmin(username === 'hvhau' || currentProfile?.is_admin === true)
      }
    }

    getCurrentUser().then((u) => {
      syncUser(u ?? null).finally(() => setLoading(false))
    })

    sub = onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      syncUser(u)
    })

    return () => sub?.subscription?.unsubscribe?.()
  }, [])

  const updateProfile = async ({ fullName, avatarUrl }: { fullName: string; avatarUrl: string }) => {
    if (!user) return
    const nextName = fullName.trim() || getUserDisplayName(user)
    const nextAvatar = avatarUrl.trim() || null
    await api.upsertProfile(user.id, nextName, nextAvatar)
    const nextProfile = await api.fetchProfileById(user.id)
    setProfile(nextProfile)
    setIsAdmin(getUserDisplayName(user).toLowerCase() === 'hvhau' || nextProfile?.is_admin === true)
  }

  const doSignOut = async () => {
    await signOut()
    setUser(null)
    setProfile(null)
    setIsAdmin(false)
  }

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, loading, updateProfile, signOut: doSignOut }}>
      {children}
    </AuthContext.Provider>
  )
}
