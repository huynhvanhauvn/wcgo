
import axios from 'axios'

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY

export interface LiveFixture {
  status: string
  elapsed: number
  goalsA: number
  goalsB: number
  period: string
  source: string
}

/**
 * Mapping from internal status to display labels
 */
export const getStatusLabel = (status: string, elapsed: number, period: string, t: any) => {
  if (status === 'FINISHED' || period === 'FT') return t('match_hub.finished')
  if (period === 'HT') return t('match_hub.periods.half_time')
  if (period === '1H') return `${t('match_hub.periods.first_half')} - ${elapsed}'`
  if (period === '2H') return `${t('match_hub.periods.second_half')} - ${elapsed}'`
  if (period === 'ET') return `${t('match_hub.periods.extra_time')} - ${elapsed}'`
  if (period === 'P') return t('match_hub.periods.penalty')
  if (status === 'LIVE' || status === 'IN_PROGRESS') return `${t('match_hub.live')} - ${elapsed}'`
  return t('match_hub.live')
}

/**
 * Validation Engine: Checks if the incoming data is sane compared to current data
 */
export const validateUpdate = (currentMatch: any, newData: LiveFixture): { valid: boolean; reason?: string } => {
  if (!currentMatch) return { valid: true }

  // 1. Score jump check: Goals shouldn't jump by more than 2 in a single sync (60s)
  const diffA = newData.goalsA - (currentMatch.score_a || 0)
  const diffB = newData.goalsB - (currentMatch.score_b || 0)

  if (diffA < 0 || diffB < 0) {
    return { valid: false, reason: 'Scores decreased (impossible unless VAR overturn)' }
  }

  if (diffA > 2 || diffB > 2) {
    return { valid: false, reason: 'Suspicious score jump (>2 goals in 60s)' }
  }

  // 2. Status regression check: Finished matches shouldn't go back to LIVE
  if (currentMatch.status === 'FINISHED' && newData.status !== 'FINISHED') {
    return { valid: false, reason: 'Status regressed from FINISHED' }
  }

  return { valid: true }
}

/**
 * Source 1: API-Football (Primary)
 */
async function fetchFromApiFootball(teamA: string, teamB: string): Promise<LiveFixture | null> {
  if (!RAPIDAPI_KEY || RAPIDAPI_KEY === 'YOUR_KEY_HERE') return null

  try {
    const res = await axios.get('https://api-football-v3.p.rapidapi.com/v3/fixtures', {
      params: { live: 'all' },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'api-football-v3.p.rapidapi.com'
      },
      timeout: 5000
    })

    const fixtures = res.data.response
    const match = fixtures.find((f: any) =>
      (f.teams.home.name.toLowerCase().includes(teamA.toLowerCase()) || teamA.toLowerCase().includes(f.teams.home.name.toLowerCase())) &&
      (f.teams.away.name.toLowerCase().includes(teamB.toLowerCase()) || teamB.toLowerCase().includes(f.teams.away.name.toLowerCase()))
    )

    if (match) {
      return {
        status: match.fixture.status.short === 'FT' ? 'FINISHED' : 'LIVE',
        elapsed: match.fixture.status.elapsed,
        goalsA: match.goals.home ?? 0,
        goalsB: match.goals.away ?? 0,
        period: match.fixture.status.short,
        source: 'API-Football'
      }
    }
  } catch (e) {
    console.error('API-Football Error:', e)
  }
  return null
}

/**
 * Source 2: OpenLigaDB (Fallback)
 */
async function fetchFromOpenLigaDB(teamA: string, teamB: string): Promise<LiveFixture | null> {
  try {
    // Note: OpenLigaDB requires a league shortcut. This is a generic check for live matches.
    // In a real app, we would store the league shortcut in our DB.
    const res = await axios.get('https://api.openligadb.de/getmatchdata/wm2026', { timeout: 5000 })
    const fixtures = res.data

    const match = fixtures.find((m: any) =>
      m.matchIsFinished === false && // Look for ongoing matches
      (m.team1.teamName.toLowerCase().includes(teamA.toLowerCase()) || m.team2.teamName.toLowerCase().includes(teamA.toLowerCase())) &&
      (m.team1.teamName.toLowerCase().includes(teamB.toLowerCase()) || m.team2.teamName.toLowerCase().includes(teamB.toLowerCase()))
    )

    if (match) {
      // Find the latest result
      const latestResult = match.matchResults.sort((a: any, b: any) => b.resultTypeID - a.resultTypeID)[0]
      return {
        status: match.matchIsFinished ? 'FINISHED' : 'LIVE',
        elapsed: 0, // OpenLigaDB doesn't always provide live elapsed minutes in this endpoint
        goalsA: latestResult?.pointsTeam1 ?? 0,
        goalsB: latestResult?.pointsTeam2 ?? 0,
        period: match.matchIsFinished ? 'FT' : 'LIVE',
        source: 'OpenLigaDB'
      }
    }
  } catch (e) {
    console.error('OpenLigaDB Error:', e)
  }
  return null
}

/**
 * Orchestrator: Tries sources in order
 */
export async function fetchExternalLiveFixture(teamA: string, teamB: string): Promise<LiveFixture | null> {
  // 1. Try Primary
  let data = await fetchFromApiFootball(teamA, teamB)

  // 2. Try Fallback if Primary failed
  if (!data) {
    console.log('LiveSync: Primary source failed, trying Fallback...')
    data = await fetchFromOpenLigaDB(teamA, teamB)
  }

  // 3. Mock Data (Only if no real data and specifically requested or in dev)
  if (!data && (import.meta.env.DEV || !RAPIDAPI_KEY)) {
    console.log('LiveSync: Using Mock Data')
    return {
      status: 'LIVE',
      elapsed: 45,
      goalsA: 1,
      goalsB: 0,
      period: '1H',
      source: 'Mock'
    }
  }

  return data
}
