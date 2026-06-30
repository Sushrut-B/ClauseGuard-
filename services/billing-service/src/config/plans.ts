export type PlanTier = 'free' | 'pro' | 'enterprise'

export const PLANS: Record<
  PlanTier,
  { name: string; priceId: string | null; monthlyPrice: number; contractLimit: number }
> = {
  free: {
    name: 'Free',
    priceId: null,
    monthlyPrice: 0,
    contractLimit: 5,
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRICE_ID_PRO || '',
    monthlyPrice: 29,
    contractLimit: 100,
  },
  enterprise: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_PRICE_ID_ENTERPRISE || '',
    monthlyPrice: 199,
    contractLimit: -1,
  },
}
