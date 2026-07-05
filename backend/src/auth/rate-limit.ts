import { HttpException, HttpStatus } from '@nestjs/common'

/**
 * Tiny in-memory rate limiter for the auth endpoints (login/register/invite
 * accept). Per-IP sliding window; fine for a single-instance deployment.
 */
const buckets = new Map<string, number[]>()

export function rateLimit(key: string, ip: string, max = 10, windowMs = 10 * 60 * 1000): void {
  const now = Date.now()
  const bucketKey = `${key}:${ip}`
  const hits = (buckets.get(bucketKey) || []).filter(t => now - t < windowMs)
  if (hits.length >= max) {
    throw new HttpException('Too many attempts — try again later', HttpStatus.TOO_MANY_REQUESTS)
  }
  hits.push(now)
  buckets.set(bucketKey, hits)
  // Opportunistic cleanup so the map doesn't grow unbounded
  if (buckets.size > 10000) {
    for (const [k, v] of buckets) {
      if (v.every(t => now - t >= windowMs)) buckets.delete(k)
    }
  }
}
