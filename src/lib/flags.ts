const TEAM_FLAG_CODES: Record<string, string> = {
  // English
  Algeria: 'dz',
  Argentina: 'ar',
  Australia: 'au',
  Austria: 'at',
  Belgium: 'be',
  'Bosnia/Herzeg.': 'ba',
  Brazil: 'br',
  Canada: 'ca',
  'Cape Verde': 'cv',
  Colombia: 'co',
  Croatia: 'hr',
  Curacao: 'cw',
  'Curaçao': 'cw',
  'Czech Rep.': 'cz',
  'DR Congo': 'cd',
  Ecuador: 'ec',
  Egypt: 'eg',
  England: 'gb-eng',
  France: 'fr',
  Germany: 'de',
  Ghana: 'gh',
  Haiti: 'ht',
  'IR Iran': 'ir',
  Iraq: 'iq',
  'Ivory Coast': 'ci',
  Japan: 'jp',
  Jordan: 'jo',
  Mexico: 'mx',
  Morocco: 'ma',
  Netherlands: 'nl',
  'New Zealand': 'nz',
  Norway: 'no',
  Panama: 'pa',
  Paraguay: 'py',
  Portugal: 'pt',
  Qatar: 'qa',
  'Rep. of Korea': 'kr',
  'Saudi Arabia': 'sa',
  Scotland: 'gb-sct',
  Senegal: 'sn',
  'South Africa': 'za',
  Spain: 'es',
  Sweden: 'se',
  Switzerland: 'ch',
  Tunisia: 'tn',
  Turkey: 'tr',
  USA: 'us',
  Uruguay: 'uy',
  Uzbekistan: 'uz',
  Vietnam: 'vn',

  // Vietnamese
  'Pháp': 'fr',
  'Đức': 'de',
  'Anh': 'gb-eng',
  'Bồ Đào Nha': 'pt',
  'Tây Ban Nha': 'es',
  'Nhật Bản': 'jp',
  'Hàn Quốc': 'kr',
  'Mỹ': 'us',
  'Ý': 'it',
  'Thụy Sĩ': 'ch',
  'Thụy Điển': 'se',
  'Bỉ': 'be',
  'Hà Lan': 'nl',
  'Việt Nam': 'vn'
}

export function getFlagUrl(teamName: string) {
  if (!teamName) return null

  // Try direct match
  let code = TEAM_FLAG_CODES[teamName]

  // Try case-insensitive match
  if (!code) {
    const entry = Object.entries(TEAM_FLAG_CODES).find(
      ([key]) => key.toLowerCase() === teamName.toLowerCase()
    )
    if (entry) code = entry[1]
  }

  return code ? `https://flagcdn.com/${code}.svg` : `https://placehold.co/40x28/e2e8f0/64748b?text=${teamName.substring(0, 2).toUpperCase()}`
}
