import { useState } from "react"
import { updateObligationStatus } from "../../api/obligations"
import type { Obligation, ObligationStatus } from "../../api/obligations"
import styles from "./ObligationTracker.module.css"

interface Props {
  contractId: string
  obligations: Obligation[]
  onUpdate: (updated: Obligation[]) => void
}

const STATUS_LABELS: Record<ObligationStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  fulfilled: "Fulfilled",
  overdue: "Overdue",
}

const PARTY_COLORS: Record<string, string> = {
  company: "#0369A1",
  contractor: "var(--crimson)",
  both: "var(--amber)",
}

const CAT_ICONS: Record<string, string> = {
  payment: "$",
  delivery: "D",
  reporting: "R",
  confidentiality: "C",
  compliance: "L",
  other: "O",
}

export default function ObligationTracker({ contractId, obligations, onUpdate }: Props) {
  const [updating, setUpdating] = useState<string | null>(null)
  const [filter, setFilter] = useState<ObligationStatus | "all">("all")

  const handleStatusChange = async (obligationId: string, status: ObligationStatus) => {
    setUpdating(obligationId)
    try {
      const updated = await updateObligationStatus(contractId, obligationId, status)
      onUpdate(updated)
    } catch {
      // silent fail
    } finally {
      setUpdating(null)
    }
  }

  const filtered = filter === "all"
    ? obligations
    : obligations.filter(o => o.status === filter)

  const counts = {
    pending: obligations.filter(o => o.status === "pending").length,
    in_progress: obligations.filter(o => o.status === "in_progress").length,
    fulfilled: obligations.filter(o => o.status === "fulfilled").length,
    overdue: obligations.filter(o => o.status === "overdue").length,
  }

  if (obligations.length === 0) return (
    <div className={styles.empty}>
      No obligations extracted. Re-analyze the contract to extract obligations.
    </div>
  )

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          {(["all", "pending", "in_progress", "fulfilled", "overdue"] as const).map(f => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? `All (${obligations.length})` :
               f === "pending" ? `Pending (${counts.pending})` :
               f === "in_progress" ? `In Progress (${counts.in_progress})` :
               f === "fulfilled" ? `Fulfilled (${counts.fulfilled})` :
               `Overdue (${counts.overdue})`}
            </button>
          ))}
        </div>
        <div className={styles.compliance}>
          <span className={styles.complianceLabel}>Compliance</span>
          <span className={styles.complianceVal}>
            {obligations.length > 0
              ? `${Math.round((counts.fulfilled / obligations.length) * 100)}%`
              : "0%"}
          </span>
        </div>
      </div>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>No obligations in this category.</div>
        ) : (
          filtered.map(o => (
            <div key={o.id} className={`${styles.item} ${styles[`status_${o.status}`]}`}>
              <div className={styles.itemLeft}>
                <div
                  className={styles.catIcon}
                  style={{ background: PARTY_COLORS[o.party] ?? "var(--ink-3)" }}
                >
                  {CAT_ICONS[o.category] ?? "O"}
                </div>
                <div className={styles.itemBody}>
                  <div className={styles.itemAction}>{o.action}</div>
                  <div className={styles.itemMeta}>
                    <span
                      className={styles.partyTag}
                      style={{ color: PARTY_COLORS[o.party] }}
                    >
                      {o.party}
                    </span>
                    <span className={styles.catTag}>{o.category}</span>
                    {o.deadline && (
                      <span className={styles.deadline}>Due: {o.deadline}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.itemRight}>
                <select
                  className={`${styles.statusSelect} ${styles[`sel_${o.status}`]}`}
                  value={o.status}
                  onChange={e => handleStatusChange(o.id, e.target.value as ObligationStatus)}
                  disabled={updating === o.id}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="fulfilled">Fulfilled</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}