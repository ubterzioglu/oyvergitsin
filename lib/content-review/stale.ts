import { isOlderThanDays } from '@/lib/siyaset-radari/stale'

// Bu süreden uzun zamandır doğrulanmamış kayıtlar admin'de "Gözden geçirilecekler"e düşer.
export const POSITION_REVIEW_DAYS = 180
export const PARTY_REVIEW_DAYS = 90

export function isPositionStale(lastVerifiedAt: string | null | undefined, now = new Date()): boolean {
  return isOlderThanDays(lastVerifiedAt, POSITION_REVIEW_DAYS, now)
}

export function isPartyStale(registryCheckedAt: string | null | undefined, now = new Date()): boolean {
  return isOlderThanDays(registryCheckedAt, PARTY_REVIEW_DAYS, now)
}

function timeOrMin(value: string | null | undefined): number {
  if (!value) {
    return Number.NEGATIVE_INFINITY
  }
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time
}

/** En eski (ya da hiç doğrulanmamış) kayıt başta olacak şekilde yeni bir dizi döner. */
export function sortByStaleness<T>(items: readonly T[], getDate: (item: T) => string | null | undefined): T[] {
  return [...items].sort((a, b) => timeOrMin(getDate(a)) - timeOrMin(getDate(b)))
}

/** Doğrulamadan bu yana geçen tam gün; tarih yoksa null. */
export function daysSince(value: string | null | undefined, now = new Date()): number | null {
  const time = timeOrMin(value)
  if (time === Number.NEGATIVE_INFINITY) {
    return null
  }
  return Math.floor((now.getTime() - time) / (24 * 60 * 60 * 1000))
}
