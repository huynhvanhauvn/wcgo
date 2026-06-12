type Prediction = {
  id: string
  user_id: string
  match_id: number
  predicted_a: number
  predicted_b: number
}

export function getMultiplier(matchId: number) {
  // Theo luật:
  // Vòng bảng (1-72) & Vòng 32 (73-88): x1
  // Vòng 16 (89-96), Tứ kết (97-100), Bán kết (101-102): x2
  // Chung kết (104) & Hạng 3 (103): x3
  if (matchId >= 89 && matchId <= 102) return 2
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

  // 3đ: Đúng tỉ số chính xác
  if (pA === actualA && pB === actualB) return 3 * m

  const predDiff = pA - pB
  const actualDiff = actualA - actualB

  // 2đ: Đúng đội thắng VÀ đúng cách biệt (GD) - Chỉ áp dụng cho thắng/thua, không tính Hòa
  if (predDiff === actualDiff && actualDiff !== 0) return 2 * m

  // 1đ: Chỉ đúng kết quả Thắng/Hòa/Thua
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
  const top3Score = ranked.filter((u) => u.rank <= 3).at(-1)?.total ?? (ranked.length > 0 ? ranked[0].total : 0)
  const bottomScore = sorted.length > 0 ? sorted[sorted.length - 1].total : 0

  return ranked.map((u) => {
    if (u.rank <= 3) return { user_id: u.user_id, penalty: 0 }

    // Nếu tất cả bằng điểm nhau, không có penalty
    if (top3Score === bottomScore) return { user_id: u.user_id, penalty: 0 }

    // Tính mức phạt tối đa 500,000 dựa trên khoảng cách điểm
    const pen = Math.round(500000 * (top3Score - u.total) / (top3Score - bottomScore))
    return { user_id: u.user_id, penalty: pen }
  })
}
