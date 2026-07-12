import { useEffect, useState } from 'react'
import { getPlaybookRules, createPlaybookRule, deletePlaybookRule } from '../api/playbook'
import type { PlaybookRule } from '../api/playbook'
import styles from './Playbook.module.css'

export default function Playbook() {
  const [rules, setRules] = useState<PlaybookRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newRuleText, setNewRuleText] = useState('')
  const [newRuleCategory, setNewRuleCategory] = useState('general')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      const data = await getPlaybookRules()
      setRules(data)
    } catch (err) {
      setError('Failed to load playbook rules.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRuleText.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await createPlaybookRule(newRuleText, newRuleCategory)
      setNewRuleText('')
      fetchRules()
    } catch (err) {
      setError('Failed to create playbook rule.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deletePlaybookRule(id)
      fetchRules()
    } catch (err) {
      setError('Failed to delete rule.')
    }
  }

  if (loading) return <div className={styles.loading}>Loading Playbook...</div>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2>Compliance Playbook</h2>
          <p>Define custom rules for the AI to enforce when analyzing contracts.</p>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.content}>
        <div className={styles.formCard}>
          <h3>Add New Rule</h3>
          <form onSubmit={handleAddRule} className={styles.form}>
            <select
              value={newRuleCategory}
              onChange={e => setNewRuleCategory(e.target.value)}
              className={styles.select}
            >
              <option value="general">General</option>
              <option value="payment">Payment Terms</option>
              <option value="liability">Liability</option>
              <option value="termination">Termination</option>
              <option value="ip">Intellectual Property</option>
              <option value="dispute">Dispute Resolution</option>
            </select>
            <input
              type="text"
              placeholder="e.g. We do not accept Net-90 payment terms."
              value={newRuleText}
              onChange={e => setNewRuleText(e.target.value)}
              className={styles.input}
            />
            <button type="submit" disabled={submitting || !newRuleText.trim()} className={styles.btn}>
              {submitting ? 'Adding...' : 'Add Rule'}
            </button>
          </form>
        </div>

        <div className={styles.rulesList}>
          {rules.length === 0 ? (
            <div className={styles.empty}>No custom playbook rules defined yet.</div>
          ) : (
            rules.map(rule => (
              <div key={rule.id} className={styles.ruleCard}>
                <div className={styles.ruleInfo}>
                  <span className={styles.categoryBadge}>{rule.category}</span>
                  <p className={styles.ruleText}>{rule.text}</p>
                </div>
                <button onClick={() => handleDelete(rule.id)} className={styles.deleteBtn}>
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
