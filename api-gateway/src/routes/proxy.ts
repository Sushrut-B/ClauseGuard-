import { Router } from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { authenticate } from '../middleware/auth'
import { authLimiter, aiLimiter } from '../middleware/rateLimiter'

const router = Router()

// Auth routes — public
router.use('/auth', authLimiter, createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/auth' },
  on: {
    error: (err, req, res: any) => {
      res.status(503).json({ success: false, error: 'Auth service unavailable' })
    }
  }
}))

// Contract routes — protected
router.use('/contracts', authenticate, createProxyMiddleware({
  target: process.env.CONTRACT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/contracts': '/contracts' },
  on: {
    error: (err, req, res: any) => {
      res.status(503).json({ success: false, error: 'Contract service unavailable' })
    }
  }
}))

// AI routes — protected + stricter rate limit
router.use('/ai', authenticate, aiLimiter, createProxyMiddleware({
  target: process.env.AI_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/ai': '/ai' },
  on: {
    error: (err, req, res: any) => {
      res.status(503).json({ success: false, error: 'AI service unavailable' })
    }
  }
}))

// Notification routes — protected
router.use('/notifications', authenticate, createProxyMiddleware({
  target: process.env.NOTIFICATION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/notifications': '/notifications' },
  on: {
    error: (err, req, res: any) => {
      res.status(503).json({ success: false, error: 'Notification service unavailable' })
    }
  }
}))

// Billing routes — protected
router.use('/billing', authenticate, createProxyMiddleware({
  target: process.env.BILLING_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/billing': '/billing' },
  on: {
    error: (err, req, res: any) => {
      res.status(503).json({ success: false, error: 'Billing service unavailable' })
    }
  }
}))

// Scheduler routes — protected
router.use('/reminders', authenticate, createProxyMiddleware({
  target: process.env.SCHEDULER_SERVICE_URL,
  changeOrigin: true,
  // no rewrite — scheduler-service expects the full /api/reminders path as-is
  on: {
    error: (err, req, res: any) => {
      res.status(503).json({ success: false, error: 'Scheduler service unavailable' })
    }
  }
}))

export default router