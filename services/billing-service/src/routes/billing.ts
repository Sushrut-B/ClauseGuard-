import { Router, Response } from 'express'
import { z } from 'zod'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { PLANS, PlanTier } from '../config/plans'
import {
  createCheckoutSession,
  createBillingPortalSession,
} from '../services/stripeService'
import { getOrCreateSubscription } from '../services/billingService'

const router = Router()

router.get('/plans', (_req, res: Response) => {
  res.json({ success: true, data: PLANS })
})

router.get('/subscription', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const sub = await getOrCreateSubscription(req.user!.orgId)
    res.json({ success: true, data: sub })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch subscription' })
  }
})

const checkoutSchema = z.object({
  plan: z.enum(['pro', 'enterprise']),
})

router.post(
  '/checkout',
  requireAuth,
  validate(checkoutSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const plan = req.body.plan as PlanTier
      const priceId = PLANS[plan].priceId
      if (!priceId) {
        return res
          .status(400)
          .json({ success: false, error: 'Plan is not purchasable' })
      }

      const sub = await getOrCreateSubscription(req.user!.orgId)

      const session = await createCheckoutSession({
        orgId: req.user!.orgId,
        priceId,
        customerId: sub.stripeCustomerId,
        customerEmail: req.user!.id, // replace with real email once auth-service exposes it via token claim
      })

      res.json({ success: true, data: { url: session.url } })
    } catch (err) {
      console.error('Checkout error:', err)
      res.status(500).json({ success: false, error: 'Failed to create checkout session' })
    }
  }
)

router.post('/portal', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const sub = await getOrCreateSubscription(req.user!.orgId)
    if (!sub.stripeCustomerId) {
      return res
        .status(400)
        .json({ success: false, error: 'No billing account found for this org' })
    }
    const session = await createBillingPortalSession(sub.stripeCustomerId)
    res.json({ success: true, data: { url: session.url } })
  } catch (err) {
    console.error('Portal error:', err)
    res.status(500).json({ success: false, error: 'Failed to create portal session' })
  }
})

export default router