import { useEffect, useState } from "react"
import { listReminders, createReminder, cancelReminder, Reminder, ReminderType } from "../api/reminders"
import styles from "./Reminders.module.css"

const TYPE_LABELS: Record<ReminderType, string> = {
  expiry: "Expiry",
  renewal: "Renewal",
  custom: "Custom",
}

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [contractId, setContractId] = useState("")
  const [type, setType] = useState<ReminderType>("expiry")
  const [triggerAt, setTriggerAt] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchReminders()
  }, [])

  const fetchReminders = async () => {
    try {
      const data = await listReminders()
      setReminders(data)
    } catch (err) {
      setError("Failed to load reminders")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contractId || !triggerAt) return
    setSubmitting(true)
    try {
      await createReminder({
        contractId,
        type,
        triggerAt: new Date(triggerAt).toISOString(),
        message: message || undefined,
      })
      setContractId("")
      setTriggerAt("")
      setMessage("")
      setType("expiry")
      setShowForm(false)
      fetchReminders()
    } catch (err) {
      setError("Failed to create reminder")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (id: string) => {
    try {
      await cancelReminder(id)
      fetchReminders()
    } catch (err) {
      setError("Failed to cancel reminder")
    }
  }

  if (loading) return <div className={styles.loading}>Loading reminders...</div>

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroEyebrow}>Scheduler</div>
        <div className={styles.heroHeadline}>Reminders</div>
        <div className={styles.heroSub}>
          Schedule expiry and renewal reminders for your contracts.
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableWrap}>
        <div className={styles.tableHead}>
          <div className={styles.tableTitle}>Upcoming Reminders</div>
          <button className={styles.btnPrimary} onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Cancel" : "+ New Reminder"}
          </button>
        </div>

        {showForm && (
          <form className={styles.form} onSubmit={handleCreate}>
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Contract ID</label>
                <input
                  className={styles.input}
                  value={contractId}
                  onChange={(e) => setContractId(e.target.value)}
                  placeholder="Paste contract ID"
                  required
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Type</label>
                <select className={styles.input} value={type} onChange={(e) => setType(e.target.value as ReminderType)}>
                  <option value="expiry">Expiry</option>
                  <option value="renewal">Renewal</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Trigger Date</label>
                <input
                  type="datetime-local"
                  className={styles.input}
                  value={triggerAt}
                  onChange={(e) => setTriggerAt(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Message (optional)</label>
              <input
                className={styles.input}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Custom reminder message"
              />
            </div>
            <button className={styles.btnPrimary} type="submit" disabled={submitting}>
              {submitting ? "Scheduling..." : "Schedule Reminder"}
            </button>
          </form>
        )}

        {reminders.length === 0 ? (
          <div className={styles.empty}>No reminders scheduled yet.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Type</th>
                <th>Trigger Date</th>
                <th>Status</th>
                <th>Message</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reminders.map((r) => (
                <tr key={r.id} className={styles.row}>
                  <td>{TYPE_LABELS[r.type]}</td>
                  <td className={styles.muted}>{new Date(r.triggerAt).toLocaleString()}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[r.status]}`}>{r.status}</span>
                  </td>
                  <td className={styles.muted}>{r.message ?? "-"}</td>
                  <td>
                    {r.status === "pending" && (
                      <span className={styles.link} onClick={() => handleCancel(r.id)}>
                        Cancel
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}