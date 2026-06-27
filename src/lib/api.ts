import { supabase } from './supabaseClient'

export async function fetchMatches() {
  const { data, error } = await supabase.from('matches').select('*, team_a_data:team_a_id(*), team_b_data:team_b_id(*)').order('start_time', { ascending: true })
  if (error) throw error
  return data
}

export async function fetchTeams() {
  const { data, error } = await supabase.from('teams').select('*').order('group_label', { ascending: true })
  if (error) throw error
  return data
}

export async function fetchPredictionsByMatch(matchId: number) {
  const { data, error } = await supabase
    .from('predictions')
    .select(`
      *,
      profiles:user_id (
        display_name,
        username,
        avatar_url,
        real_name
      )
    `)
    .eq('match_id', matchId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching predictions:', error)
    throw error
  }
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

export async function upsertProfile(userId: string, username?: string | null, avatarUrl?: string | null, displayName?: string | null, realName?: string | null) {
  const payload: any = { user_id: userId }
  if (username !== undefined) payload.username = username
  if (avatarUrl !== undefined) payload.avatar_url = avatarUrl
  if (displayName !== undefined) payload.display_name = displayName
  if (realName !== undefined) payload.real_name = realName
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
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })
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
  // SECURITY PRE-CHECK: Ensure match is not locked (kickoff - 15 mins)
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('start_time, status')
    .eq('id', matchId)
    .single()

  if (matchError) throw matchError

  const startTime = new Date(match.start_time).getTime()
  const now = new Date().getTime()
  const lockTime = startTime - (15 * 60 * 1000)

  if (match.status === 'FINISHED' || now > lockTime) {
    throw new Error('MATCH_LOCKED')
  }

  const payload = { user_id: userId, match_id: matchId, predicted_a: predictedA, predicted_b: predictedB }
  const { data, error } = await supabase.from('predictions').upsert(payload, { onConflict: ['user_id', 'match_id'] })
  if (error) throw error
  return data
}

export async function requestAccountDeletion(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      deletion_requested_at: new Date().toISOString(),
      deletion_status: 'PENDING'
    })
    .eq('user_id', userId)
  if (error) throw error
  return data
}

export async function cancelAccountDeletionRequest(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      deletion_requested_at: null,
      deletion_status: null
    })
    .eq('user_id', userId)
  if (error) throw error
  return data
}

export async function rejectAccountDeletionRequest(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      deletion_requested_at: null,
      deletion_status: 'REJECTED'
    })
    .eq('user_id', userId)
  if (error) throw error
  return data
}

export async function fetchDeletionRequests() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('deletion_status', 'PENDING')
  if (error) throw error
  return data
}

export async function fetchUserMatchPoints(userId: string) {
  const { data, error } = await supabase
    .from('match_points')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error
  return data
}

export async function approveAccountDeletion(userId: string) {
  // Use RPC for actual data cleaning and marking as deleted
  const { data, error } = await supabase.rpc('delete_user_by_admin', { p_user_id: userId })
  if (error) throw error
  return data
}

export async function settleMatch(matchId: number, scoreA: number, scoreB: number, status: string = 'FINISHED') {
  const { data, error } = await supabase.rpc('settle_match', {
    p_match_id: matchId,
    p_score_a: scoreA,
    p_score_b: scoreB,
    p_status: status
  })
  if (error) {
    const details = [error.message, error.details, error.hint].filter(Boolean).join(' | ')
    const err = new Error(details || 'settle_match failed')
    // attach original for easier inspect in console
    ;(err as any).supabaseError = error
    throw err
  }
  return data
}

export async function resetMatch(matchId: number) {
  const { data, error } = await supabase.rpc('reset_match', {
    p_match_id: matchId
  })
  if (error) throw error
  return data
}

export async function verifyUserProfile(userId: string, verified: boolean, realName?: string) {
  const payload: any = { is_verified: verified }
  if (realName !== undefined) payload.real_name = realName

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('user_id', userId)
  if (error) throw error
  return data
}

export async function deleteUserByAdmin(userId: string) {
  const { data, error } = await supabase.rpc('delete_user_by_admin', { p_user_id: userId })
  if (error) throw error
  return data
}

export async function createPasswordResetRequest(email: string) {
  // 1. Find user by email
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('username', email) // assuming username is used for login/email context
    .single()

  if (userError) throw new Error('User not found')

  // 2. Generate random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()

  // 3. Create request
  const { data, error } = await supabase
    .from('password_reset_requests')
    .insert({ user_id: userData.user_id, otp, status: 'PENDING' })

  if (error) throw error
  return { success: true }
}

export async function fetchPasswordResetRequests() {
  const { data, error } = await supabase
    .from('password_reset_requests')
    .select(`
      *,
      profiles:user_id (
        display_name,
        username,
        real_name
      )
    `)
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Fetch reset requests error:', error)
    throw error
  }
  return data
}

export async function adminResetPassword(requestId: string, userId: string, newPass: string) {
  // 1. Call RPC to change password in auth.users
  const { error: rpcError } = await supabase.rpc('admin_reset_user_password', {
    p_user_id: userId,
    p_new_password: newPass
  })
  if (rpcError) throw rpcError

  // 2. Mark request as USED
  const { error: updateError } = await supabase
    .from('password_reset_requests')
    .update({ status: 'USED' })
    .eq('id', requestId)

  if (updateError) throw updateError
  return { success: true }
}

export async function updateMatchTeam(matchId: number, side: 'a' | 'b', teamId: number | null, teamName?: string) {
  const payload: any = {}
  if (side === 'a') {
    payload.team_a_id = teamId
    if (teamName) payload.team_a = teamName
  } else {
    payload.team_b_id = teamId
    if (teamName) payload.team_b = teamName
  }

  const { data, error } = await supabase.from('matches').update(payload).eq('id', matchId)
  if (error) throw error
  return data
}

export async function syncKnockoutBracket(standings: any[]) {
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
  const groupResults: any = {}

  groups.forEach(g => {
    const groupTeams = standings.filter(s => s.group === g)
    // sortGroupStandings import would be needed if logic was here, but we assume it's pre-sorted or use simple logic
    const sorted = groupTeams.sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference)
    groupResults[g] = { first: sorted[0], second: sorted[1], third: sorted[2] }
  })

  const bestThirds = standings.filter(s => {
    const groupTeams = standings.filter(inner => inner.group === s.group)
    const sorted = groupTeams.sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference)
    return s.teamId === sorted[2]?.teamId
  }).sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference).slice(0, 8)

  // Mapping updates for R32 (IDs 73-88)
  const updates: Promise<any>[] = []

  // Simple 1st and 2nd place updates
  if (groupResults['A'].first) updates.push(updateMatchTeam(73, 'a', groupResults['A'].first.teamId, groupResults['A'].first.name))
  if (groupResults['B'].second) updates.push(updateMatchTeam(73, 'b', groupResults['B'].second.teamId, groupResults['B'].second.name))

  if (groupResults['C'].first) updates.push(updateMatchTeam(76, 'a', groupResults['C'].first.teamId, groupResults['C'].first.name))
  if (groupResults['F'].second) updates.push(updateMatchTeam(76, 'b', groupResults['F'].second.teamId, groupResults['F'].second.name))

  // Best 3rd place example (Simplified)
  if (bestThirds[0]) updates.push(updateMatchTeam(74, 'b', bestThirds[0].teamId, bestThirds[0].name))

  return Promise.all(updates)
}

export async function updateMatchLive(matchId: number, scoreA: number, scoreB: number, status: string, elapsed?: number, period?: string) {
  const payload: any = {
    score_a: scoreA,
    score_b: scoreB,
    status,
    elapsed,
    period
  }
  const { data, error } = await supabase.from('matches').update(payload).eq('id', matchId)
  if (error) throw error
  return data
}

export async function fetchComments(matchId: number) {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      profiles:user_id (
        display_name,
        avatar_url,
        username
      )
    `)
    .eq('match_id', matchId)
    .order('created_at', { ascending: false })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function postComment(matchId: number, userId: string, content: string, type: 'CHAT' | 'REACT' = 'CHAT', emoji?: string) {
  const { data, error } = await supabase
    .from('comments')
    .insert({ match_id: matchId, user_id: userId, content, type, emoji })
  if (error) throw error
  return data
}

export function subscribeToMatchHub(matchId: number, onEvent: (payload: any) => void) {
  const channel = supabase.channel(`match_hub:${matchId}`)
    .on('postgres_changes', {
      event: '*', // Listen for all changes including DELETE
      schema: 'public',
      table: 'comments',
      filter: `match_id=eq.${matchId}`
    }, (payload) => {
      onEvent(payload)
    })
    .subscribe()
  return channel
}

export async function deleteComment(commentId: string) {
  const { data, error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
  if (error) throw error
  return data
}

export async function deleteComments(commentIds: string[]) {
  if (!commentIds || commentIds.length === 0) return
  const { data, error } = await supabase
    .from('comments')
    .delete()
    .in('id', commentIds)
  if (error) throw error
  return data
}
