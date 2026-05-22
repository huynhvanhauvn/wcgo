import { supabase } from './supabaseClient'

export async function fetchMatches() {
  const { data, error } = await supabase.from('matches').select('*').order('start_time', { ascending: true })
  if (error) throw error
  return data
}

export async function fetchPredictionsByMatch(matchId: number) {
  const { data, error } = await supabase.from('predictions').select('*').eq('match_id', matchId)
  if (error) throw error
  return data
}

export async function fetchUserPredictions(userId: string) {
  const { data, error } = await supabase.from('predictions').select('*').eq('user_id', userId)
  if (error) throw error
  return data
}

export async function fetchPredictionForUserMatch(userId: string, matchId: number) {
  const { data, error } = await supabase.from('predictions').select('*').eq('user_id', userId).eq('match_id', matchId).limit(1).single()
  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}

export async function fetchUserTotals() {
  const { data, error } = await supabase.from('user_totals').select('*').order('total', { ascending: false })
  if (error) throw error
  return data
}

export function subscribeUserTotals(onChange: (payload: any) => void) {
  const channel = supabase.channel('public:user_totals')
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'user_totals' }, (payload) => {
    onChange(payload)
  })
  channel.subscribe()
  return channel
}

export function subscribeMatches(onChange: (payload: any) => void) {
  const channel = supabase.channel('public:matches')
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, (payload) => {
    onChange(payload)
  })
  channel.subscribe()
  return channel
}

export async function upsertProfile(userId: string, fullName?: string | null, avatarUrl?: string | null) {
  const payload: any = { user_id: userId }
  if (fullName !== undefined) payload.full_name = fullName
  if (avatarUrl !== undefined) payload.avatar_url = avatarUrl
  const { data, error } = await supabase.from('profiles').upsert(payload, { onConflict: ['user_id'] })
  if (error) throw error
  return data
}

export async function fetchProfileById(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function fetchProfilesByIds(ids: string[]) {
  if (!ids || ids.length === 0) return []
  const { data, error } = await supabase.from('profiles').select('*').in('user_id', ids)
  if (error) throw error
  return data
}

export async function fetchAllProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function fetchLeaderboardWithProfiles() {
  const totals = await fetchUserTotals()
  const profiles = await fetchAllProfiles()
  const totalMap: Record<string, any> = {}
  ;(totals || []).forEach((t: any) => (totalMap[t.user_id] = t))
  const rows = (profiles || []).map((profile: any) => ({
    user_id: profile.user_id,
    total: totalMap[profile.user_id]?.total ?? 0,
    profile
  }))
  return rows.sort((a: any, b: any) => b.total - a.total)
}

export async function uploadAvatar(userId: string, file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Avatar must be an image file.')
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || 'png'
  const path = `${userId}/${Date.now()}.${extension}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, {
    cacheControl: '3600',
    upsert: true
  })

  if (error) throw error

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}

export async function savePrediction(userId: string, matchId: number, predictedA: number, predictedB: number) {
  const payload = { user_id: userId, match_id: matchId, predicted_a: predictedA, predicted_b: predictedB }
  const { data, error } = await supabase.from('predictions').upsert(payload, { onConflict: ['user_id', 'match_id'] })
  if (error) throw error
  return data
}

export async function settleMatch(matchId: number, scoreA: number, scoreB: number) {
  const { data, error } = await supabase.rpc('settle_match', {
    p_match_id: matchId,
    p_score_a: scoreA,
    p_score_b: scoreB
  })
  if (error) throw error
  return data
}

export async function resetMatch(matchId: number) {
  const { data, error } = await supabase.rpc('reset_match', {
    p_match_id: matchId
  })
  if (error) throw error
  return data
}
