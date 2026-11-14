/** Lower-case, strip accents and punctuation: "Les Misérables" → "les miserables", "B-110" → "b 110". */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

const compact = (text: string) => normalize(text).replace(/ /g, '')

/** True when every word of the query appears somewhere in the given values, in any order. */
export function matchesAll(query: string, values: unknown[]): boolean {
  const q = normalize(query)
  if (!q) return true
  const hay = normalize(values.filter((v) => typeof v === 'string' || typeof v === 'number').join(' '))
  const hayCompact = hay.replace(/ /g, '')
  return q.split(' ').every((t) => hay.includes(t) || hayCompact.includes(t))
}

/**
 * Ranks a record for a search box. 0 means no match.
 * Exact ID beats ID prefix beats name prefix beats a word in the name beats a match anywhere.
 */
export function rank(query: string, id: string, name: string, extra: unknown[] = []): number {
  const q = normalize(query)
  if (!q) return 1
  const qc = q.replace(/ /g, '')
  const idc = compact(id)
  if (idc === qc) return 1000
  if (!matchesAll(query, [id, name, ...extra])) return 0
  // Typing the start of an ID: keep those together; callers order ties by ID (B110, B111, …).
  if (idc.startsWith(qc)) return 500
  const n = normalize(name)
  let score = 10
  if (n.startsWith(q)) score += 300
  else if ((' ' + n).includes(' ' + q.split(' ')[0])) score += 150
  return score - Math.min(n.length, 100) / 100 // shorter names first on ties
}
