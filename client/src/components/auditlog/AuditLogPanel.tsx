import { useEffect, useState } from "react"
import { getAuditLog } from "../../api/auditLog"
import type { AuditLogEntry, AuditAction } from "../../api/auditLog"
import styles from "./AuditLogPanel.module.css"

interface Props { contractId: string }

const ACTION_LABELS: Record<AuditAction, string> = {
  'contract.viewed':        'Viewed contract',
  'contract.uploaded':      'Uploaded contract',
  'contract.analyzed':      'Ran AI analysis',
  'contract.deleted':       'Deleted contract',
  'contract.stage_changed': 'Changed stage',
  'contract.shared':        'Invited collaborator',
  'contract.signed':        'Sent for signature',
  'obligation.updated':     'Updated obligation',
  'comment.added':          'Added comment',
}

const ACTION_COLORS: Record<AuditAction, string> = {
  'contract.viewed':        'var(--ink-3)',
  'contract.uploaded':      '#0369A1',
  'contract.analyzed':      'var(--amber)',
  'contract.deleted':       'var(--crimson)',
  'contract.stage_changed': 'var(--green)',
  'contract.shared':        '#7C3AED',
  'contract.signed':        'var(--green)',
  'obligation.updated':     'var(--amber)',
  'comment.added':          '#0369A1',
}

const formatTime = (raw: string) => {
  const d = new Date(raw)
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const getMetaDesc = (entry: AuditLogEntry): string => {
  const m = entry.metadata
  if (entry.action === 'contract.stage_changed' && m.stage) return `to "${m.stage}"`
  if (entry.action === 'contract.shared' && m.email) return `with ${m.email} (${m.role})`
  if (entry.action === 'obligation.updated' && m.status) return `status to "${m.status}"`
  return ''
}

export default function AuditLogPanel({ contractId }: Props) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    getAuditLog(contractId)
      .then(setLogs)
      .catch(() => setError("Failed to load audit log"))
      .finally(() => setLoading(false))
  }, [contractId])

  const uniqueActions = Array.from(new Set(logs.map(l => l.action)))
  const filtered = filter === "all" ? logs : logs.filter(l => l.action === filter)

  if (loading) return <div className={styles.loading}>Loading audit log...</div>
  if (error) return <div className={styles.loading}>{error}</div>

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${filter === "all" ? styles.filterActive : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({logs.length})
          </button>
          {uniqueActions.map(action => (
            <button
              key={action}
              className={`${styles.filterBtn} ${filter === action ? styles.filterActive : ""}`}
              onClick={() => setFilter(action)}
            >
              {ACTION_LABELS[action] ?? action}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>No audit events found.</div>
      ) : (
        <div className={styles.timeline}>
          {filtered.map((entry, i) => (
            <div key={entry.id} className={styles.entry}>
              <div className={styles.entryLeft}>
                <div
                  className={styles.dot}
                  style={{ background: ACTION_COLORS[entry.action] ?? 'var(--ink-3)' }}
                />
                {i < filtered.length - 1 && <div className={styles.line} />}
              </div>
              <div className={styles.entryBody}>
                <div className={styles.entryTop}>
                  <span
                    className={styles.action}
                    style={{ color: ACTION_COLORS[entry.action] ?? 'var(--ink-3)' }}
                  >
                    {ACTION_LABELS[entry.action] ?? entry.action}
                  </span>
                  {getMetaDesc(entry) && (
                    <span className={styles.meta}>{getMetaDesc(entry)}</span>
                  )}
                </div>
                <div className={styles.entryBottom}>
                  <span className={styles.email}>{entry.userEmail}</span>
                  <span className={styles.time}>{formatTime(entry.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}