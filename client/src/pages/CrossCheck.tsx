import { useEffect, useState } from 'react'
import { getContracts, crossCheckContracts } from '../api/contracts'
import styles from './CrossCheck.module.css'

interface Contract {
  id: string
  originalName: string
  createdAt: string
  status: string
}

interface Conflict {
  issue: string
  doc1Excerpt: string
  doc2Excerpt: string
  recommendation: string
}

export default function CrossCheck() {


  const [contracts, setContracts] = useState<Contract[]>([])
  const [doc1, setDoc1] = useState<string>('')
  const [doc2, setDoc2] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [conflicts, setConflicts] = useState<Conflict[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchContracts()
  }, [])

  const fetchContracts = async () => {
    try {
      const data = await getContracts()
      const analyzed = data.filter((c: Contract) => c.status === 'analyzed')
      setContracts(analyzed)
    } catch (err) {
      setError('Failed to load contracts')
    } finally {
      setLoading(false)
    }
  }

  const handleCheck = async () => {
    if (!doc1 || !doc2) return
    if (doc1 === doc2) {
      setError('Please select two different documents to compare.')
      return
    }
    setChecking(true)
    setError('')
    setConflicts(null)
    try {
      const res = await crossCheckContracts(doc1, doc2)
      setConflicts(res)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to analyze documents.')
    } finally {
      setChecking(false)
    }
  }

  if (loading) return <div className={styles.loading}>Loading...</div>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2>Cross-Document RAG</h2>
          <p>Detect conflicts and contradictions between two active agreements.</p>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.selectorArea}>
        <div className={styles.selectGroup}>
          <label>Document 1 (e.g. MSA)</label>
          <select value={doc1} onChange={e => setDoc1(e.target.value)} className={styles.select}>
            <option value="">Select a contract...</option>
            {contracts.map(c => <option key={c.id} value={c.id}>{c.originalName}</option>)}
          </select>
        </div>
        
        <div className={styles.vsIcon}>
          VS
        </div>

        <div className={styles.selectGroup}>
          <label>Document 2 (e.g. SOW)</label>
          <select value={doc2} onChange={e => setDoc2(e.target.value)} className={styles.select}>
            <option value="">Select a contract...</option>
            {contracts.map(c => <option key={c.id} value={c.id}>{c.originalName}</option>)}
          </select>
        </div>
      </div>

      <button className={styles.checkBtn} onClick={handleCheck} disabled={checking || !doc1 || !doc2 || doc1 === doc2}>
        {checking ? 'Analyzing Conflicts...' : 'Run Cross-Check'}
      </button>

      {conflicts && (
        <div className={styles.resultsArea}>
          <h3>Analysis Results</h3>
          {conflicts.length === 0 ? (
            <div className={styles.successBox}>
              ✅ No direct contradictions found between these documents.
            </div>
          ) : (
            <div className={styles.conflictList}>
              {conflicts.map((c, i) => (
                <div key={i} className={styles.conflictCard}>
                  <div className={styles.issueHeader}>
                    <span className={styles.badge}>Conflict Detected</span>
                    <h4>{c.issue}</h4>
                  </div>
                  <div className={styles.excerptsPane}>
                    <div className={styles.excerptBox}>
                      <span className={styles.excerptLabel}>Document 1</span>
                      <p>"{c.doc1Excerpt}"</p>
                    </div>
                    <div className={styles.excerptBox}>
                      <span className={styles.excerptLabel}>Document 2</span>
                      <p>"{c.doc2Excerpt}"</p>
                    </div>
                  </div>
                  <div className={styles.recommendation}>
                    <strong>Recommendation:</strong> {c.recommendation}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
