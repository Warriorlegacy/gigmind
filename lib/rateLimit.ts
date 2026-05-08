type RateLimitRecord = {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitRecord>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (record.count >= limit) return false

  record.count += 1
  return true
}
