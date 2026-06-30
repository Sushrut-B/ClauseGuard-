import { Router, Request, Response } from 'express'
import { stripe } from '../services/stripeService'
import { upsertFromStripeEvent, markCanceled } from '../services/billingService'
import { PlanTier } from '../config/plans'
import Stripe from 'stripe'

const router = Router()

const priceIdToPlan = (priceId: string): PlanTier => {
  if (priceId === process.env.STRIPE_PRICE_ID_PRO) return 'pro'
  if (priceId === process.env.STRIPE_PRICE_ID_ENTERPRISE) return 'enterprise'
  return 'free'
}

router.post('/', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const orgId = session.metadata?.orgId || session.client_reference_id
        if (!orgId) break

        const subscriptionId = session.subscription as string
        const stripeSub = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = stripeSub.items.data[0].price.id

        await upsertFromStripeEvent({
          orgId,
          plan: priceIdToPlan(priceId),
          status: stripeSub.status as any,
          stripeCustomerId: stripeSub.customer as string,
          stripeSubscriptionId: stripeSub.id,
          stripePriceId: priceId,
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        })
        break
      }

      case 'customer.subscription.updated': {
        const stripeSub = event.data.object as Stripe.Subscription
        const orgId = stripeSub.metadata?.orgId
        const priceId = stripeSub.items.data[0].price.id

        if (orgId) {
          await upsertFromStripeEvent({
            orgId,
            plan: priceIdToPlan(priceId),
            status: stripeSub.status as any,
            stripeCustomerId: stripeSub.customer as string,
            stripeSubscriptionId: stripeSub.id,
            stripePriceId: priceId,
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object as Stripe.Subscription
        await markCanceled(stripeSub.id)
        break
      }

      default:
        break
    }

    res.json({ received: true })
  } catch (err) {
    console.error('Webhook handler error:', err)
    res.status(500).json({ success: false, error: 'Webhook handler failed' })
  }
})

export default router