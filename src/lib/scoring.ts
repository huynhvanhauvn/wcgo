type Prediction = {
  id: string
  user_id: string
  match_id: number
  predicted_a: number
  predicted_b: number
}

export function getMultiplier(matchId: number) {
  if (matchId >= 73 && matchId <= 102) return 2
  if (matchId === 103 || matchId === 104) return 3
  return 1
}

function outcome(a: number, b: number) {
  if (a === b) return 'D'
  return a > b ? 'A' : 'B'
}

export function calculateMatchPoints(pred: Prediction, actualA: number, actualB: number) {
  const pA = pred.predicted_a
  const pB = pred.predicted_b
  const m = getMultiplier(pred.match_id)

  if (pA === actualA && pB === actualB) return 3 * m

  const predDiff = pA - pB
  const actualDiff = actualA - actualB

  if (Math.sign(predDiff) === Math.sign(actualDiff) && predDiff === actualDiff) return 2 * m

  if (outcome(pA, pB) === outcome(actualA, actualB)) return 1 * m

  return 0
}

export function settleMatchPredictions(predictions: Prediction[], match: { id: number; score_a: number; score_b: number }) {
  return predictions.map((p) => ({
    user_id: p.user_id,
    points: calculateMatchPoints(p, match.score_a, match.score_b)
  }))
}

export function calculatePenalties(userTotals: { user_id: string; total: number }[]) {
  if (userTotals.length === 0) return []
  const sorted = [...userTotals].sort((a, b) => b.total - a.total)
  let previousScore: number | null = null
  let lastRank = 0
  const ranked = sorted.map((u, idx) => {
    const rank = previousScore === u.total ? lastRank : idx + 1
    previousScore = u.total
    lastRank = rank
    return { ...u, rank }
  })
  const top3Score = ranked.filter((u) => u.rank <= 3).at(-1)?.total ?? ranked[ranked.length - 1].total
  const bottomScore = sorted[sorted.length - 1].total

  return ranked.map((u) => {
    if (u.rank <= 3) return { user_id: u.user_id, penalty: 0 }
    if (u.total === bottomScore) return { user_id: u.user_id, penalty: 500000 }
    const denom = top3Score - bottomScore
    if (denom === 0) return { user_id: u.user_id, penalty: 0 }
    const pen = Math.round(500000 * (top3Score - u.total) / denom)
    return { user_id: u.user_id, penalty: pen }
  })
}
