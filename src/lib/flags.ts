const TEAM_FLAG_CODES: Record<string, string> = {
  // --- Official Database Names (Keys must match migration_standings_corrected.sql) ---
  'Algeria': 'dz',
  'Argentina': 'ar',
  'Australia': 'au',
  'Austria': 'at',
  'Belgium': 'be',
  'Bosnia/Herzegovina': 'ba',
  'Brazil': 'br',
  'Canada': 'ca',
  'Cape Verde': 'cv',
  'Colombia': 'co',
  'Croatia': 'hr',
  'Curacao': 'cw',
  'Czechia': 'cz',
  'DR Congo': 'cd',
  'Ecuador': 'ec',
  'Egypt': 'eg',
  'England': 'gb-eng',
  'France': 'fr',
  'Germany': 'de',
  'Ghana': 'gh',
  'Haiti': 'ht',
  'Iran': 'ir',
  'Iraq': 'iq',
  'Ivory Coast': 'ci',
  'Japan': 'jp',
  'Jordan': 'jo',
  'Mexico': 'mx',
  'Morocco': 'ma',
  'Netherlands': 'nl',
  'New Zealand': 'nz',
  'Norway': 'no',
  'Panama': 'pa',
  'Paraguay': 'py',
  'Portugal': 'pt',
  'Qatar': 'qa',
  'Saudi Arabia': 'sa',
  'Scotland': 'gb-sct',
  'Senegal': 'sn',
  'South Africa': 'za',
  'South Korea': 'kr',
  'Spain': 'es',
  'Sweden': 'se',
  'Switzerland': 'ch',
  'Tunisia': 'tn',
  'Turkey': 'tr',
  'USA': 'us',
  'Uruguay': 'uy',
  'Uzbekistan': 'uz',

  // --- Common Variants, Abbreviations & Aliases ---
  'Bosnia/Herzeg.': 'ba',
  'Bosnia & Herz.': 'ba',
  'Bosnia & Herzegovina': 'ba',
  'Czech Rep.': 'cz',
  'Czech Republic': 'cz',
  'Rep. of Korea': 'kr',
  'Republic of Korea': 'kr',
  'United States': 'us',
  'Curaçao': 'cw',
  'Türkiye': 'tr',
  'IR Iran': 'ir',
  'Ivory Coast (Cote d\'Ivoire)': 'ci',
  'Cote d\'Ivoire': 'ci',
  'Vietnam': 'vn'
}

/**
 * Returns the flag URL for a given team name.
 */
export function getFlagUrl(teamName: string) {
  if (!teamName) return null

  // Clean team name (remove leading/trailing spaces)
  const cleanName = teamName.trim()

  // 1. Direct exact match
  let code = TEAM_FLAG_CODES[cleanName]

  // 2. Case-insensitive match
  if (!code) {
    const entry = Object.entries(TEAM_FLAG_CODES).find(
      ([key]) => key.toLowerCase() === cleanName.toLowerCase()
    )
    if (entry) code = entry[1]
  }

  // 3. Fallback for common placeholders (Don't show flag icon for TBD matches)
  if (!code && (
    cleanName.includes('#') ||
    cleanName.includes('Group') ||
    cleanName.includes('Winner') ||
    cleanName.includes('Runner-up') ||
    cleanName.includes('TBD')
  )) {
    return null
  }

  // 4. Final URL construction
  // We use flagcdn.com for high-quality SVG flags
  return code
    ? `https://flagcdn.com/${code}.svg`
    : `https://placehold.co/40x28/e2e8f0/64748b?text=${cleanName.substring(0, 2).toUpperCase()}`
}
