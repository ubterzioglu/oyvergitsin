import 'server-only'

// In-memory sliding-window limiter. Resets on process restart and is scoped to a
// single server instance — fine for this app's current single-container deployment
// (see docker-compose.yml), but will under-limit if ever scaled to multiple
// instances/replicas. Swap for a shared store (Upstash Redis, Vercel KV) if that
// happens.
const requestLog = new Map<string, number[]>()

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup(windowMs: number) {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now

  requestLog.forEach((timestamps, key) => {
    const recent = timestamps.filter((t: number) => now - t < windowMs)
    if (recent.length === 0) {
      requestLog.delete(key)
    } else {
      requestLog.set(key, recent)
    }
  })
}

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  cleanup(windowMs)

  const now = Date.now()
  const timestamps = requestLog.get(key) || []
  const recent = timestamps.filter((t) => now - t < windowMs)

  if (recent.length >= limit) {
    requestLog.set(key, recent)
    return true
  }

  recent.push(now)
  requestLog.set(key, recent)
  return false
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') || 'unknown'
}
