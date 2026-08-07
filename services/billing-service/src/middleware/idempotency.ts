import { Request, Response, NextFunction } from 'express'

interface CachedResponse {
  status: number
  body: any
  expiry: number
}

const cache = new Map<string, CachedResponse>()

// Cleanup expired keys every minute
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of cache.entries()) {
    if (val.expiry < now) {
      cache.delete(key)
    }
  }
}, 60000)

export const checkIdempotency = (req: Request, res: Response, next: NextFunction) => {
  const key = req.headers['x-idempotency-key'] as string
  if (!key) return next()

  const cached = cache.get(`idempotency:${key}`)
  if (cached && cached.expiry > Date.now()) {
    return res.status(cached.status).json(cached.body)
  }

  const originalJson = res.json.bind(res)
  res.json = function (body: any) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      cache.set(`idempotency:${key}`, {
        status: res.statusCode,
        body,
        expiry: Date.now() + 86400 * 1000, // 24 hours
      })
    }
    return originalJson(body)
  }
  next()
}
