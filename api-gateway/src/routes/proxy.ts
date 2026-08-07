import { Router } from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { authenticate } from '../middleware/auth'
import { authLimiter, aiLimiter } from '../middleware/rateLimiter'
import { randomUUID } from 'crypto'

const router = Router()

// Correlation ID injection middleware
router.use((req, res, next) => {
  const correlationId = (req.headers['x-correlation-id'] as string) || randomUUID()
  const traceId = (req.headers['x-trace-id'] as string) || randomUUID()
  const spanId = randomUUID()

  req.headers['x-correlation-id'] = correlationId
  req.headers['x-trace-id'] = traceId
  req.headers['x-span-id'] = spanId

  res.setHeader('X-Correlation-ID', correlationId)
  res.setHeader('X-Trace-ID', traceId)
  res.setHeader('X-Span-ID', spanId)
  next()
})


// Auth routes — public
router.use('/auth', authLimiter, createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/auth' },
  onError: (_err: Error, _req: any, res: any) => {
    res.status(503).json({ success: false, error: 'Auth service unavailable' })
  }
}))

// Contract routes — protected
router.use('/contracts', authenticate, createProxyMiddleware({
  target: process.env.CONTRACT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/contracts': '/contracts' },
  onError: (_err: Error, _req: any, res: any) => {
    res.status(503).json({ success: false, error: 'Contract service unavailable' })
  }
}))

// AI routes — protected + stricter rate limit
router.use('/ai', authenticate, aiLimiter, createProxyMiddleware({
  target: process.env.AI_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/ai': '/ai' },
  onError: (_err: Error, _req: any, res: any) => {
    res.status(503).json({ success: false, error: 'AI service unavailable' })
  }
}))

// Notification routes — protected
router.use('/notifications', authenticate, createProxyMiddleware({
  target: process.env.NOTIFICATION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/notifications': '/notifications' },
  onError: (_err: Error, _req: any, res: any) => {
    res.status(503).json({ success: false, error: 'Notification service unavailable' })
  }
}))

// Billing routes — protected
router.use('/billing', authenticate, createProxyMiddleware({
  target: process.env.BILLING_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/billing': '/billing' },
  onError: (_err: Error, _req: any, res: any) => {
    res.status(503).json({ success: false, error: 'Billing service unavailable' })
  }
}))

// Scheduler routes — protected
router.use('/reminders', authenticate, createProxyMiddleware({
  target: process.env.SCHEDULER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/reminders': '/reminders' },
  onError: (_err: Error, _req: any, res: any) => {
    res.status(503).json({ success: false, error: 'Scheduler service unavailable' })
  }
}))

router.use('/clause-templates', authenticate, createProxyMiddleware({
  target: process.env.CONTRACT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/clause-templates': '/clause-templates' },
  onError: (_err: Error, _req: any, res: any) => {
    res.status(503).json({ success: false, error: 'Contract service unavailable' })
  }
}))

router.use('/audit', authenticate, createProxyMiddleware({
  target: process.env.CONTRACT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/audit': '/audit' },
  onError: (_err: Error, _req: any, res: any) => {
    res.status(503).json({ success: false, error: 'Contract service unavailable' })
  }
}))

export default router