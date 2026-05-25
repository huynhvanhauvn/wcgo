export type TeamStanding = {
  teamId: number
  name: string
  group: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

/**
 * Progression Map defines which match winners/losers move to which destination matches.
 * W[ID] = Winner of Match ID
 * L[ID] = Loser of Match ID
 */
export const KNOCKOUT_PROGRESSION_MAP: Record<string, { matchId: number; side: 'a' | 'b' }> = {
  // R32 -> R16
  'W73': { matchId: 89, side: 'a' }, 'W74': { matchId: 89, side: 'b' },
  'W75': { matchId: 90, side: 'a' }, 'W76': { matchId: 90, side: 'b' },
  'W77': { matchId: 91, side: 'a' }, 'W78': { matchId: 91, side: 'b' },
  'W79': { matchId: 92, side: 'a' }, 'W80': { matchId: 92, side: 'b' },
  'W81': { matchId: 93, side: 'a' }, 'W82': { matchId: 93, side: 'b' },
  'W83': { matchId: 94, side: 'a' }, 'W84': { matchId: 94, side: 'b' },
  'W85': { matchId: 95, side: 'a' }, 'W86': { matchId: 95, side: 'b' },
  'W87': { matchId: 96, side: 'a' }, 'W88': { matchId: 96, side: 'b' },

  // R16 -> QF
  'W89': { matchId: 97, side: 'a' }, 'W90': { matchId: 97, side: 'b' },
  'W91': { matchId: 98, side: 'a' }, 'W92': { matchId: 98, side: 'b' },
  'W93': { matchId: 99, side: 'a' }, 'W94': { matchId: 99, side: 'b' },
  'W95': { matchId: 100, side: 'a' }, 'W96': { matchId: 100, side: 'b' },

  // QF -> SF
  'W97': { matchId: 101, side: 'a' }, 'W98': { matchId: 101, side: 'b' },
  'W99': { matchId: 102, side: 'a' }, 'W100': { matchId: 102, side: 'b' },

  // SF -> Final & 3rd Place
  'W101': { matchId: 104, side: 'a' }, 'W102': { matchId: 104, side: 'b' },
  'L101': { matchId: 103, side: 'a' }, 'L102': { matchId: 103, side: 'b' },
}

export function calculateStandings(matches: any[], teams: any[]): TeamStanding[] {
  const standingsMap: Record<number, TeamStanding> = {}

  teams.forEach(team => {
    standingsMap[team.id] = {
      teamId: team.id,
      name: team.name,
      group: team.group_label,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0
    }
  })

  matches.filter(m => m.status === 'FINISHED' && m.stage === 'GROUP').forEach(m => {
    const sA = standingsMap[m.team_a_id]
    const sB = standingsMap[m.team_b_id]

    if (sA && sB) {
      sA.played++
      sB.played++
      sA.goalsFor += (m.score_a || 0)
      sA.goalsAgainst += (m.score_b || 0)
      sB.goalsFor += (m.score_b || 0)
      sB.goalsAgainst += (m.score_a || 0)
      sA.goalDifference = sA.goalsFor - sA.goalsAgainst
      sB.goalDifference = sB.goalsFor - sB.goalsAgainst

      if (m.score_a > m.score_b) {
        sA.won++
        sA.points += 3
        sB.lost++
      } else if (m.score_a < m.score_b) {
        sB.won++
        sB.points += 3
        sA.lost++
      } else {
        sA.drawn++
        sB.drawn++
        sA.points += 1
        sB.points += 1
      }
    }
  })

  return Object.values(standingsMap)
}

export function sortGroupStandings(groupStandings: TeamStanding[]): TeamStanding[] {
  return [...groupStandings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
    return 0
  })
}

export function getBestThirdPlaces(allStandings: TeamStanding[]): TeamStanding[] {
  const groups = Array.from(new Set(allStandings.map(s => s.group))).sort()
  const thirds: TeamStanding[] = []

  groups.forEach(group => {
    const groupTeams = allStandings.filter(s => s.group === group)
    const sorted = sortGroupStandings(groupTeams)
    if (sorted.length >= 3) {
      thirds.push(sorted[2])
    }
  })

  return sortGroupStandings(thirds).slice(0, 8)
}

export function getMatchWinner(match: any): { id: number; name: string } | null {
  if (match.status !== 'FINISHED') return null
  if (match.score_a > match.score_b) return { id: match.team_a_id, name: match.team_a }
  if (match.score_a < match.score_b) return { id: match.team_b_id, name: match.team_b }
  // For knockouts, there might be a penalty shootout or some other way to decide if draw.
  // We'll assume the score_a/score_b reflects the winner for now or handle it via a winner flag.
  return null
}

export function getMatchLoser(match: any): { id: number; name: string } | null {
  if (match.status !== 'FINISHED') return null
  if (match.score_a < match.score_b) return { id: match.team_a_id, name: match.team_a }
  if (match.score_a > match.score_b) return { id: match.team_b_id, name: match.team_b }
  return null
}
