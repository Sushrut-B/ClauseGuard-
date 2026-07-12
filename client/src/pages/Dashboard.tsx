import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getContracts, deleteContract, reanalyzeContract } from '../api/contracts'
import { listReminders, type Reminder } from '../api/reminders'
import type { LifecycleStage } from '../api/contracts'
import TiltedCard from '../components/ui/TiltedCard'
import FlowingMenu from '../components/ui/FlowingMenu'
import SpotlightCard from '../components/ui/SpotlightCard'
import s from './Dashboard.module.css'

interface Contract {
  id: string
  originalName: string
  status: 'uploaded' | 'processing' | 'analyzed' | 'failed'
  lifecycleStage?: LifecycleStage
  signatureStatus?: string
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

const stageColors: Record<LifecycleStage, string> = {
  draft:    'var(--ink-3)',
  review:   'var(--amber)',
  approved: 'var(--green)',
  signed:   'var(--green)',
  active:   '#0369A1',
  expiring: 'var(--amber)',
  expired:  'var(--crimson)',
}

const fmt = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const quickActionItems = [
  { link: '/upload', text: 'Upload Contract', image: '/images/upload.png' },
  { link: '/comparison', text: 'Compare Versions', image: '/images/compare.png' },
  { link: '/insights', text: 'View Insights', image: '/images/insights.png' },
  { link: '/reminders', text: 'Reminders & Alerts', image: '/images/reminders.png' }
];

export default function Dashboard() {
  const navigate = useNavigate()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retrying, setRetrying] = useState<string | null>(null)

  const load = async () => {
    try {
      const [data, rmData] = await Promise.all([getContracts(), listReminders()])
      setContracts(data)
      setReminders(rmData.slice(0, 5)) // get top 5 upcoming
    } catch {
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const hasActive = contracts.some((c) => c.status === 'uploaded' || c.status === 'processing')
    if (!hasActive) return

    const interval = setInterval(async () => {
      try {
        const data = await getContracts()
        setContracts(data)
      } catch (err) {
        console.error('Polling contracts error:', err)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [contracts])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this contract?')) return
    await deleteContract(id)
    setContracts((prev) => prev.filter((c) => c.id !== id))
  }

  const handleRetry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setRetrying(id)
    try {
      await reanalyzeContract(id)
      await load()
    } catch {
      // silent — status will show if still failed
      await load()
    } finally {
      setRetrying(null)
    }
  }

  const analyzed = contracts.filter((c) => c.status === 'analyzed')
  const avgScore = analyzed.length
    ? Math.round(analyzed.reduce((a, c) => a + (c.riskScore ?? 0), 0) / analyzed.length)
    : null

  if (loading) return <div className={s.loading}>Loading contracts...</div>

  return (
    <div className={s.page}>
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
            : 'The AI reviews every clause for liability, termination, payment, IP, and dispute risk.'}
        </p>
      </div>

      {contracts.length > 0 && (
        <div className={s.metrics}>
          <TiltedCard scaleOnHover={1.03}>
            <div className={s.metric}>
              <div className={s.metricLabel}>Total Contracts</div>
              <div className={s.metricValue}>{contracts.length}</div>
            </div>
          </TiltedCard>
          <TiltedCard scaleOnHover={1.03}>
            <div className={s.metric}>
              <div className={s.metricLabel}>Analyzed</div>
              <div className={s.metricValue}>{analyzed.length}</div>
            </div>
          </TiltedCard>
          <TiltedCard scaleOnHover={1.03}>
            <div className={s.metric}>
              <div className={s.metricLabel}>Avg Risk Score</div>
              <div className={`${s.metricValue} ${s.crimson}`}>
                {avgScore !== null ? `${avgScore}/100` : '-'}
              </div>
            </div>
          </TiltedCard>
          <TiltedCard scaleOnHover={1.03}>
            <div className={s.metric}>
              <div className={s.metricLabel}>Pending Review</div>
              <div className={s.metricValue}>
                {contracts.filter((c) => c.status === 'uploaded').length}
              </div>
            </div>
          </TiltedCard>
        </div>
      )}

      {reminders.length > 0 && (
        <div className={s.obligationsWidget}>
          <div className={s.widgetHeader}>
            <span className={s.widgetTitle}>Upcoming Obligations & Key Dates</span>
            <button className={s.linkBtn} onClick={() => navigate('/reminders')}>View all &rarr;</button>
          </div>
          <div className={s.widgetBody}>
            {reminders.map((r) => {
              const contract = contracts.find(c => c.id === r.contractId)
              return (
                <div key={r.id} className={s.obligationItem}>
                  <div className={s.obType}>{r.type}</div>
                  <div className={s.obDesc}>
                    <div className={s.obMsg}>{r.message || 'Auto-Extracted Obligation'}</div>
                    <div className={s.obMeta}>{contract?.originalName}</div>
                  </div>
                  <div className={s.obDate}>{fmtDate(r.triggerAt)}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ height: '400px', margin: '24px', borderRadius: '12px', overflow: 'hidden' }}>
        <FlowingMenu 
          items={quickActionItems}
          bgColor="#FBFBFA"
          textColor="var(--ink-2)"
          marqueeBgColor="var(--ink)"
          marqueeTextColor="var(--gold)"
          borderColor="var(--rule)"
        />
      </div>

      <div className={s.tableWrap}>
        <div className={s.tableHead}>
          <span className={s.tableTitle}>All Contracts</span>
          <button className={s.btnPrimary} onClick={() => navigate('/upload')}>
            + Upload
          </button>
        </div>

        {error && <div className={s.error}>{error}</div>}

        {contracts.length === 0 ? (
          <TiltedCard containerHeight="200px" rotateAmplitude={8} scaleOnHover={1.02}>
            <div className={s.empty}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--rule-2)" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <p>No contracts yet. <span className={s.link} onClick={() => navigate('/upload')}>Upload one</span></p>
            </div>
          </TiltedCard>
        ) : (
          <div className={s.contractList}>
            <div className={s.listHeader}>
              <span style={{ paddingLeft: 16 }}>Contract</span>
              <span>Status</span>
              <span>Stage</span>
              <span>Signature</span>
              <span>Risk</span>
              <span>Size</span>
              <span>Uploaded</span>
              <span></span>
            </div>
            
            <div className={s.listBody}>
              {contracts.map((c) => (
                <SpotlightCard
                  key={c.id}
                  className={s.contractCard}
                  onClick={() => navigate(`/analysis/${c.id}`)}
                >
                  <div className={s.cardGrid}>
                    <div className={s.nameCol}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      {c.originalName}
                    </div>
                    <div>
                      <span className={`${s.badge} ${s[c.status]}`}>
                        {statusLabel[c.status]}
                      </span>
                    </div>
                    <div>
                      {c.lifecycleStage ? (
                        <span
                          className={s.stagePill}
                          style={{ color: stageColors[c.lifecycleStage], borderColor: stageColors[c.lifecycleStage] }}
                        >
                          {c.lifecycleStage}
                        </span>
                      ) : (
                        <span className={s.stagePill} style={{ color: 'var(--ink-3)', borderColor: 'var(--rule-2)' }}>
                          draft
                        </span>
                      )}
                    </div>
                    <div>
                      {c.signatureStatus && c.signatureStatus !== 'none' ? (
                        <span className={`${s.sigPill} ${s[`sig_${c.signatureStatus}`]}`}>
                          {c.signatureStatus}
                        </span>
                      ) : (
                        <span className={s.muted}>-</span>
                      )}
                    </div>
                    <div className={s.score}>
                      {c.riskScore != null ? (
                        <span className={c.riskScore >= 70 ? s.high : c.riskScore >= 40 ? s.med : s.low}>
                          {c.riskScore}/100
                        </span>
                      ) : '-'}
                    </div>
                    <div className={s.muted}>{fmt(c.fileSize)}</div>
                    <div className={s.muted}>{fmtDate(c.createdAt)}</div>
                    <div className={s.actionCol}>
                      {c.status === 'failed' && (
                        <button
                          className={s.deleteBtn}
                          style={{ color: 'var(--amber)' }}
                          onClick={(e) => handleRetry(c.id, e)}
                          disabled={retrying === c.id}
                          title="Retry analysis"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/><path d="M3 2v6h6"/></svg>
                        </button>
                      )}
                      <button
                        className={s.deleteBtn}
                        onClick={(e) => handleDelete(c.id, e)}
                        title="Delete contract"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                      </button>
                    </div>
                  </div>
                </SpotlightCard>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}