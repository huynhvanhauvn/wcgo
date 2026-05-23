import React, { createContext, useContext, useEffect, useState } from 'react'
import { getCurrentUser, getUserDisplayName, onAuthStateChange, signOut } from '../lib/auth'
import { supabase } from '../lib/supabaseClient'
import * as api from '../lib/api'

type User = {
  id: string
  email?: string | null
  user_metadata?: any
}

type Profile = {
  user_id: string
  username?: string | null
  display_name?: string | null
  avatar_url?: string | null
  is_admin?: boolean | null
  is_deleted?: boolean | null
  deletion_status?: string | null
  deletion_requested_at?: string | null
}

const AuthContext = createContext<{
  user: User | null
  profile: Profile | null
  isAdmin: boolean
  loading: boolean
  updateProfile: (values: { username?: string; displayName?: string; avatarUrl?: string }) => Promise<void>
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
    let authSub: any
    let profileChannel: any

    const cleanupProfileSub = async () => {
      if (profileChannel) {
        await supabase.removeChannel(profileChannel)
        profileChannel = null
      }
    }

    const syncUser = async (u: User | null) => {
      // 1. Always cleanup existing subscription when user changes
      await cleanupProfileSub()

      if (!u) {
        setUser(null)
        setProfile(null)
        setIsAdmin(false)
        return
      }

      setUser(u)

      const fetchAndSetProfile = async () => {
        let currentProfile = await api.fetchProfileById(u.id).catch(() => null)

        if (!currentProfile) {
          const name = getUserDisplayName(u)
          const avatar = u.user_metadata?.avatar_url ?? null
          await api.upsertProfile(u.id, name, avatar).catch(() => {})
          currentProfile = await api.fetchProfileById(u.id).catch(() => null)
        }

        if (currentProfile?.is_deleted) {
          await signOut()
          setUser(null)
          setProfile(null)
          setIsAdmin(false)
          return
        }

        setProfile(currentProfile)
        const username = (currentProfile?.username || getUserDisplayName(u)).toLowerCase()
        setIsAdmin(username === 'hvhau' || currentProfile?.is_admin === true)
      }

      await fetchAndSetProfile()

      // 2. Setup NEW subscription with a unique channel name to avoid conflicts
      profileChannel = supabase
        .channel(`profile_realtime_${u.id}_${Date.now()}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${u.id}`
        }, (payload) => {
          const updated = payload.new as Profile
          if (updated.is_deleted) {
            // Force logout if admin deletes account while user is online
            signOut().then(() => {
              window.location.href = '/login'
            })
          } else {
            setProfile(updated)
          }
        })
        .subscribe()
    }

    getCurrentUser().then((u) => {
      syncUser(u ?? null).finally(() => setLoading(false))
    })

    authSub = onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      syncUser(u)
    })

    return () => {
      authSub?.subscription?.unsubscribe?.()
      cleanupProfileSub()
    }
  }, [])

  const updateProfile = async ({ username, displayName, avatarUrl }: { username?: string; displayName?: string; avatarUrl?: string }) => {
    if (!user) return
    const nextUsername = username?.trim() ?? profile?.username ?? getUserDisplayName(user)
    const nextDisplayName = displayName?.trim() ?? profile?.display_name ?? null
    const nextAvatar = avatarUrl?.trim() ?? profile?.avatar_url ?? null

    await api.upsertProfile(user.id, nextUsername, nextAvatar, nextDisplayName)
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
