import { Subscription, PlanTier, SubscriptionStatus } from '../models/subscription'

export const getOrCreateSubscription = async (orgId: string) => {
  let sub = await Subscription.findOne({ where: { orgId } })
  if (!sub) {
    sub = await Subscription.create({ orgId, plan: 'free', status: 'active' })
  }
  return sub
}

export const upsertFromStripeEvent = async (params: {
  orgId: string
  plan: PlanTier
  status: SubscriptionStatus
  stripeCustomerId: string
  stripeSubscriptionId: string
  stripePriceId: string
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
}) => {
  const [sub] = await Subscription.findOrCreate({
    where: { orgId: params.orgId },
    defaults: { orgId: params.orgId, plan: params.plan, status: params.status },
  })

  await sub.update({
    plan: params.plan,
    status: params.status,
    stripeCustomerId: params.stripeCustomerId,
    stripeSubscriptionId: params.stripeSubscriptionId,
    stripePriceId: params.stripePriceId,
    currentPeriodEnd: params.currentPeriodEnd,
    cancelAtPeriodEnd: params.cancelAtPeriodEnd,
  })

  return sub
}

export const markCanceled = async (stripeSubscriptionId: string) => {
  const sub = await Subscription.findOne({ where: { stripeSubscriptionId } })
  if (!sub) return null
  await sub.update({ status: 'canceled', plan: 'free' })
  return sub
}