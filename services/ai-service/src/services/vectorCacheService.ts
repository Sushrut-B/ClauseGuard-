import { createHash } from 'crypto'
import Redis from 'ioredis'

const redisHost = process.env.REDIS_HOST || 'localhost'
const redisPort = Number(process.env.REDIS_PORT) || 6379
const redis = new Redis({ host: redisHost, port: redisPort, lazyConnect: true })

redis.connect().catch((err) => {
  console.warn('[Redis] Connection warning for VectorCacheService:', err.message)
})

export class VectorCacheService {
  private inMemoryCache = new Map<string, { value: any; expiry: number }>()

  private hashClause(clauseText: string): string {
    return createHash('sha256').update(clauseText.trim().toLowerCase()).digest('hex')
  }

  public async getCachedAnalysis(clauseText: string): Promise<any | null> {
    const key = `clause_vector:${this.hashClause(clauseText)}`

    try {
      const cached = await redis.get(key)
      if (cached) {
        return JSON.parse(cached)
      }
    } catch {
      // Fallback to in-memory cache
      const item = this.inMemoryCache.get(key)
      if (item && item.expiry > Date.now()) {
        return item.value
      }
    }
    return null
  }

  public async cacheAnalysis(clauseText: string, analysis: any, ttlSeconds = 604800): Promise<void> {
    const key = `clause_vector:${this.hashClause(clauseText)}`
    const strValue = JSON.stringify(analysis)

    try {
      await redis.setex(key, ttlSeconds, strValue)
    } catch {
      this.inMemoryCache.set(key, {
        value: analysis,
        expiry: Date.now() + ttlSeconds * 1000,
      })
    }
  }
}

export const vectorCacheService = new VectorCacheService()
