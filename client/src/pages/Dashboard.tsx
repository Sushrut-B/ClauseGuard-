import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getContracts, deleteContract } from '../api/contracts'
import s from './Dashboard.module.css'

interface Contract {
  id: string
  originalName: string
  status: 'uploaded' | 'processing' | 'analyzed' | 'failed'
  fileSize: number
  createdAt: string

  riskScore?: number
}

const statusLabel: Record<string, string> = {
  uploaded: 'Uploaded',
  processing: 'Processing',
  analyzed: 'Analyzed',
  failed: 'Failed',
}

const fmt = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export default function Dashboard() {
  const navigate = useNavigate()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const data = await getContracts()
      setContracts(data)
    } catch {
      setError('Failed to load contracts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this contract?')) return
    await deleteContract(id)
    setContracts((prev) => prev.filter((c) => c.id !== id))
  }

  const analyzed = contracts.filter((c) => c.status === 'analyzed')
  const avgScore = analyzed.length
    ? Math.round(analyzed.reduce((a, c) => a + (c.riskScore ?? 0), 0) / analyzed.length)
    : null

  if (loading) return <div className={s.loading}>Loading contracts…</div>

  return (
    <div className={s.page}>
      {/* Hero */}
      <div className={s.hero}>
        <div className={s.heroEyebrow}>Contract Risk Overview</div>
        <h1 className={s.heroHeadline}>
          {contracts.length === 0
            ? 'No contracts yet'
            : analyzed.length > 0
            ? `${analyzed.length} contract${analyzed.length > 1 ? 's' : ''} analyzed`
            : `${contracts.length} contract${contracts.length > 1 ? 's' : ''} uploaded`}
        </h1>
        <p className={s.heroSub}>
          {contracts.length === 0
            ? 'Upload your first contract to get started with AI-powered risk analysis.'
            : 'Gemini 2.5 Flash reviews every clause for liability, termination, payment, IP, and dispute risk.'}
        </p>
      </div>

      {/* Metrics */}
      {contracts.length > 0 && (
        <div className={s.metrics}>
          <div className={s.metric}>
            <div className={s.metricLabel}>Total Contracts</div>
            <div className={s.metricValue}>{contracts.length}</div>
          </div>
          <div className={s.metric}>
            <div className={s.metricLabel}>Analyzed</div>
            <div className={s.metricValue}>{analyzed.length}</div>
          </div>
          <div className={s.metric}>
            <div className={s.metricLabel}>Avg Risk Score</div>
            <div className={`${s.metricValue} ${s.crimson}`}>
              {avgScore !== null ? `${avgScore}/100` : '—'}
            </div>
          </div>
          <div className={s.metric}>
            <div className={s.metricLabel}>Pending Review</div>
            <div className={s.metricValue}>
              {contracts.filter((c) => c.status === 'uploaded').length}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={s.tableWrap}>
        <div className={s.tableHead}>
          <span className={s.tableTitle}>All Contracts</span>
          <button className={s.btnPrimary} onClick={() => navigate('/upload')}>
            + Upload
          </button>
        </div>

        {error && <div className={s.error}>{error}</div>}

        {contracts.length === 0 ? (
          <div className={s.empty}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--rule-2)" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <p>No contracts yet. <span className={s.link} onClick={() => navigate('/upload')}>Upload one →</span></p>
          </div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Contract</th>
                <th>Status</th>
                <th>Risk Score</th>
                <th>Size</th>
                <th>Uploaded</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr
                  key={c.id}
                  className={s.row}
                  onClick={() => c.status === 'analyzed' && navigate(`/analysis/${c.id}`)}
                  style={{ cursor: c.status === 'analyzed' ? 'pointer' : 'default' }}
                >
                  <td className={s.name}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    {c.originalName}
                  </td>
                  <td>
                    <span className={`${s.badge} ${s[c.status]}`}>
                      {statusLabel[c.status]}
                    </span>
                  </td>
                  <td className={s.score}>
                    {c.riskScore != null ? (
                      <span className={c.riskScore >= 70 ? s.high : c.riskScore >= 40 ? s.med : s.low}>
                        {c.riskScore}/100
                      </span>
                    ) : '—'}
                  </td>
                  <td className={s.muted}>{fmt(c.fileSize)}</td>
                  <td className={s.muted}>{fmtDate(c.createdAt)}</td>

                  <td>
                    <button
                      className={s.deleteBtn}
                      onClick={(e) => handleDelete(c.id, e)}
                      title="Delete"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                    </button>
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