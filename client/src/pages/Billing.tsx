import { useEffect, useState } from "react"
import { getSubscription, createCheckoutSession, createPortalSession, Subscription, PlanTier } from "../api/billing"
import styles from "./Billing.module.css"

const PLAN_DETAILS: Record<PlanTier, { name: string; price: string; features: string[] }> = {
  free: { name: "Free", price: "$0", features: ["5 contracts / month", "Basic risk scoring", "Email support"] },
  pro: { name: "Pro", price: "$29/mo", features: ["100 contracts / month", "Advanced clause analysis", "Renewal reminders", "Priority support"] },
  enterprise: { name: "Enterprise", price: "$199/mo", features: ["Unlimited contracts", "Custom risk models", "Dedicated support", "SSO"] },
}

export default function Billing() {
  const [sub, setSub] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionLoading, setActionLoading] = useState<PlanTier | "portal" | null>(null)

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const data = await getSubscription()
      setSub(data)
    } catch (err) {
      setError("Failed to load subscription")
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (plan: PlanTier) => {
    setActionLoading(plan)
    try {
      const url = await createCheckoutSession(plan)
      window.location.href = url
    } catch (err) {
      setError("Failed to start checkout")
      setActionLoading(null)
    }
  }

  const handleManage = async () => {
    setActionLoading("portal")
    try {
      const url = await createPortalSession()
      window.location.href = url
    } catch (err) {
      setError("Failed to open billing portal")
      setActionLoading(null)
    }
  }

  if (loading) return <div className={styles.loading}>Loading billing details...</div>

  const currentPlan = sub?.plan ?? "free"

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroEyebrow}>Billing</div>
        <div className={styles.heroHeadline}>Plan & Usage</div>
        <div className={styles.heroSub}>
          Manage your subscription and view available plans.
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {sub && (
        <div className={styles.currentWrap}>
          <div className={styles.currentCard}>
            <div className={styles.currentLabel}>Current Plan</div>
            <div className={styles.currentPlanName}>{PLAN_DETAILS[currentPlan].name}</div>
            <div className={styles.currentMeta}>
              <span className={`${styles.badge} ${styles[sub.status]}`}>{sub.status}</span>
              {sub.currentPeriodEnd && (
                <span className={styles.muted}>
                  {sub.cancelAtPeriodEnd ? "Cancels" : "Renews"} on{" "}
                  {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                </span>
              )}
            </div>
            {currentPlan !== "free" && (
              <button className={styles.btnSecondary} onClick={handleManage} disabled={actionLoading === "portal"}>
                {actionLoading === "portal" ? "Opening..." : "Manage Subscription"}
              </button>
            )}
          </div>
        </div>
      )}

      <div className={styles.plansGrid}>
        {(Object.keys(PLAN_DETAILS) as PlanTier[]).map((tier) => {
          const plan = PLAN_DETAILS[tier]
          const isCurrent = tier === currentPlan
          return (
            <div key={tier} className={`${styles.planCard} ${isCurrent ? styles.planCardActive : ""}`}>
              <div className={styles.planName}>{plan.name}</div>
              <div className={styles.planPrice}>{plan.price}</div>
              <ul className={styles.planFeatures}>
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              {isCurrent ? (
                <div className={styles.currentTag}>Current Plan</div>
              ) : tier === "free" ? (
                <button className={styles.btnSecondary} disabled>
                  Downgrade via Portal
                </button>
              ) : (
                <button
                  className={styles.btnPrimary}
                  onClick={() => handleUpgrade(tier)}
                  disabled={actionLoading === tier}
                >
                  {actionLoading === tier ? "Redirecting..." : `Upgrade to ${plan.name}`}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}