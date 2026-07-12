import rateLimit from 'express-rate-limit'

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 10000 : 200,
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 1000 : 20,
  message: { success: false, error: 'Too many auth attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 1000 : 50,
  message: { success: false, error: 'AI request limit reached, please try again in an hour' },
  standardHeaders: true,
  legacyHeaders: false,
})