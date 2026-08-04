const DAY_MS = 24 * 60 * 60 * 1000

export function isOlderThanDays(value: string | null | undefined, days: number, now = new Date()): boolean {
  if (!value) {
    return true
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return true
  }
  return now.getTime() - parsed.getTime() > days * DAY_MS
}

export function isJournalistStatusStale(value: string | null | undefined, now = new Date()): boolean {
  return isOlderThanDays(value, 30, now)
}

export function isParliamentSnapshotStale(value: string | null | undefined, now = new Date()): boolean {
  return isOlderThanDays(value, 7, now)
}
