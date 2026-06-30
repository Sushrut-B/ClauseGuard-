import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
})

export const createCheckoutSession = async (params: {
  orgId: string
  priceId: string
  customerId: string | null
  customerEmail: string
}) => {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: params.priceId, quantity: 1 }],
    customer: params.customerId || undefined,
    customer_email: params.customerId ? undefined : params.customerEmail,
    client_reference_id: params.orgId,
    success_url: `${process.env.CLIENT_URL}/billing?success=true`,
    cancel_url: `${process.env.CLIENT_URL}/billing?canceled=true`,
    metadata: { orgId: params.orgId },
  })
  return session
}

export const createBillingPortalSession = async (customerId: string) => {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.CLIENT_URL}/billing`,
  })
  return session
}

export const cancelSubscription = async (stripeSubscriptionId: string) => {
  return stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  })
}