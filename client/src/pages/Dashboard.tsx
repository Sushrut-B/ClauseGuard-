import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getContracts, deleteContract, reanalyzeContract } from '../api/contracts'
import { listReminders, type Reminder } from '../api/reminders'
import type { LifecycleStage } from '../api/contracts'
import TiltedCard from '../components/ui/TiltedCard'
import FlowingMenu from '../components/ui/FlowingMenu'
import SpotlightCard from '../components/ui/SpotlightCard'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import FilterBar from '../components/ui/FilterBar'
import RiskGauge from '../components/ui/RiskGauge'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [activeRisk, setActiveRisk] = useState<'all' | 'high' | 'medium' | 'low'>('all')


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

  const filteredContracts = contracts.filter((c) => {

    const matchesQuery = c.originalName.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesQuery) return false
    if (activeRisk === 'all') return true
    const score = c.riskScore ?? 0
    if (activeRisk === 'high') return score >= 70
    if (activeRisk === 'medium') return score >= 40 && score < 70
    if (activeRisk === 'low') return score < 40
    return true
  })

  const highCount = contracts.filter((c) => (c.riskScore ?? 0) >= 70).length
  const medCount = contracts.filter((c) => (c.riskScore ?? 0) >= 40 && (c.riskScore ?? 0) < 70).length
  const lowCount = contracts.filter((c) => (c.riskScore ?? 0) < 40).length

  return (

    <div className={s.page}>
      <PageHeader
        title="Contract Intelligence Dashboard"
        subtitle={
          contracts.length === 0
            ? 'Upload your first contract to get started with AI-powered risk analysis.'
            : `${contracts.length} contract${contracts.length > 1 ? 's' : ''} in repository. The AI reviews every clause for liability, termination, payment, IP, and dispute risk.`
        }
        breadcrumbs={['ClauseGuard', 'Dashboard']}
        actions={
          <Button onClick={() => navigate('/upload')}>
            + Upload Contract
          </Button>
        }
      />

      {contracts.length > 0 && (
        <div className={s.metrics}>
          <StatCard
            title="Total Contracts"
            value={contracts.length}
            change="+12.5%"
            isPositive={true}
            description="vs last month"
            progressPercent={100}
          />
          <StatCard
            title="Analyzed Contracts"
            value={analyzed.length}
            change={`${Math.round((analyzed.length / Math.max(1, contracts.length)) * 100)}%`}
            isPositive={true}
            description="completion rate"
            progressPercent={Math.round((analyzed.length / Math.max(1, contracts.length)) * 100)}
          />
          <StatCard
            title="Avg Risk Score"
            value={avgScore !== null ? `${avgScore}/100` : '-'}
            change={avgScore && avgScore > 50 ? 'High Risk' : 'Low Risk'}
            isPositive={avgScore ? avgScore < 50 : true}
            description="portfolio average"
            progressPercent={avgScore ?? 0}
          />
          <StatCard
            title="Pending Review"
            value={contracts.filter((c) => c.status === 'uploaded').length}
            description="queued jobs"
            progressPercent={25}
          />
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
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeRisk={activeRisk}
          onRiskChange={setActiveRisk}
          counts={{ all: contracts.length, high: highCount, medium: medCount, low: lowCount }}
        />

        <div className={s.tableHead}>
          <span className={s.tableTitle}>All Contracts ({filteredContracts.length})</span>
          <button className={s.btnPrimary} onClick={() => navigate('/upload')}>
            + Upload
          </button>
        </div>

        {error && <div className={s.error}>{error}</div>}

        {filteredContracts.length === 0 ? (
          <TiltedCard containerHeight="200px" rotateAmplitude={8} scaleOnHover={1.02}>
            <div className={s.empty}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--rule-2)" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <p>No matching contracts found. <span className={s.link} onClick={() => navigate('/upload')}>Upload one</span></p>
            </div>
          </TiltedCard>
        ) : (
          <div className={s.contractList}>
            <div className={s.listHeader}>
              <span className={s.colName}>Name</span>
              <span className={s.colStage}>Stage</span>
              <span className={s.colScore}>Risk Score</span>
              <span className={s.colSize}>Size</span>
              <span className={s.colDate}>Date</span>
              <span className={s.colAction}>Actions</span>
            </div>
            
            <div className={s.listBody}>
              {filteredContracts.map((c) => (
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
                      <Badge variant={c.status === 'analyzed' ? (c.riskScore && c.riskScore >= 70 ? 'high' : c.riskScore && c.riskScore >= 40 ? 'medium' : 'low') : 'pending'}>
                        {statusLabel[c.status]}
                      </Badge>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {c.riskScore !== undefined ? (
                        <>
                          <RiskGauge score={c.riskScore} size={36} strokeWidth={4} showLabel={false} />
                          <span className={s.scoreNum}>{c.riskScore}/100</span>
                        </>
                      ) : (
                        <span className={s.dim}>Pending</span>
                      )}
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