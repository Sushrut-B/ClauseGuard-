import api from "./client"

export type PlanTier = "free" | "pro" | "enterprise"

export interface Subscription {
  id: string
  orgId: string
  plan: PlanTier
  status: string
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

export const getSubscription = async (): Promise<Subscription> => {
  const { data } = await api.get("/billing/subscription")
  return data.data
}

export const createCheckoutSession = async (plan: PlanTier): Promise<string> => {
  const { data } = await api.post("/billing/checkout", { plan })
  return data.data.url
}

export const createPortalSession = async (): Promise<string> => {
  const { data } = await api.post("/billing/portal")
  return data.data.url
}