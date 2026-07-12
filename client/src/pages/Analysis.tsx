import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getContract, getContractMeta, getAnalysis, getContracts, rewriteClause, updateLifecycleStage, sendForSignature, getSignatureStatus } from '../api/contracts'
import type { LifecycleStage } from '../api/contracts'
import { createReminder } from '../api/reminders'
import s from './Analysis.module.css'
import CollabPanel from '../components/collaboration/CollabPanel'
import ObligationTracker from '../components/obligations/ObligationTracker'
import type { Obligation } from '../api/obligations'
import JurisdictionPanel from '../components/jurisdiction/JurisdictionPanel'
import BenchmarkPanel from '../components/benchmark/BenchmarkPanel'
import AuditLogPanel from '../components/auditlog/AuditLogPanel'
import { useAuthStore } from '../store/authStore'

interface Clause {
  id: string
  text?: string
  category: string
  severity: 'high' | 'medium' | 'low'
  score?: number
  reason: string
  suggestion: string
  startIndex: number
  endIndex: number
}

interface KeyDate {
  label: string
  date: string
  type: 'effective' | 'expiry' | 'renewal' | 'payment' | 'notice' | 'other'
}

interface Analysis {
  overallScore: number
  summary: string
  clauses: Clause[]
  keyDates?: KeyDate[]
  obligations?: Obligation[]
  jurisdiction?: {
    governingLaw: string
    jurisdiction: string
    flags: Array<{ clause: string; issue: string; severity: 'high' | 'medium' | 'low' }>
  } | null
}

interface Contract {
  id: string
  originalName: string
  createdAt: string
  extractedText: string
  status: string
  lifecycleStage?: LifecycleStage
  signatureStatus?: string
}

const sevLabel = { high: 'High', medium: 'Medium', low: 'Low' }
const sevClass = { high: s.high, medium: s.med, low: s.low }

const normalizeSeverity = (cl: Clause): Clause => {
  if (cl.severity === 'high' || cl.severity === 'medium' || cl.severity === 'low') return cl
  const score = cl.score ?? 0
  return { ...cl, severity: score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low' }
}

const STAGE_COLORS: Record<LifecycleStage, string> = {
  draft:    'var(--ink-3)',
  review:   'var(--amber)',
  approved: 'var(--green)',
  signed:   'var(--green)',
  active:   '#0369A1',
  expiring: 'var(--amber)',
  expired:  'var(--crimson)',
}

const TYPE_COLOR: Record<string, string> = {
  effective: '#0369A1',
  expiry:    'var(--crimson)',
  renewal:   'var(--amber)',
  payment:   'var(--green)',
  notice:    'var(--ink-3)',
  other:     'var(--ink-3)',
}

export default function Analysis() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [contract, setContract] = useState<Contract | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeClause, setActiveClause] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; clause: Clause } | null>(null)
  const [rewriting, setRewriting] = useState<number | null>(null)
  const [rewrites, setRewrites] = useState<Record<number, string>>({})
  const [copied, setCopied] = useState<number | null>(null)
  const [lifecycleStage, setLifecycleStage] = useState<LifecycleStage>('draft')
  const [stageUpdating, setStageUpdating] = useState(false)
  const [creatingReminder, setCreatingReminder] = useState<number | null>(null)
  const [reminderCreated, setReminderCreated] = useState<Record<number, boolean>>({})
  const [signerEmail, setSignerEmail] = useState("")
  const [signerName, setSignerName] = useState("")
  const [showSignForm, setShowSignForm] = useState(false)
  const [signatureStatus, setSignatureStatus] = useState<string>("none")
  const [sendingSig, setSendingSig] = useState(false)
  const [sigError, setSigError] = useState("")
  const [showCollab, setShowCollab] = useState(false)
  const [showObligations, setShowObligations] = useState(false)
  const [showJurisdiction, setShowJurisdiction] = useState(false)
  const [showBenchmark, setShowBenchmark] = useState(false)
  const [showAuditLog, setShowAuditLog] = useState(false)
  const [activeTab, setActiveTab] = useState<'flags' | 'metadata' | 'intel'>('flags')
  const userRole = useAuthStore((s) => s.user?.role ?? 'viewer')
  const canEdit = userRole === 'admin' || userRole === 'member'

  const docRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        // Load contract metadata first (always available regardless of status)
        const meta = await getContractMeta(id)
        if (!meta) {
          setError('Contract not found.')
          setLoading(false)
          return
        }

        // Set metadata immediately so the page renders
        setLifecycleStage((meta.lifecycleStage as LifecycleStage) ?? 'draft')
        if (meta.signatureStatus) setSignatureStatus(meta.signatureStatus)

        if (meta.status !== 'analyzed') {
          setContract({
            id: meta.id,
            originalName: meta.originalName ?? 'Contract',
            createdAt: meta.createdAt ?? '',
            extractedText: '',
            status: meta.status,
            lifecycleStage: meta.lifecycleStage ?? 'draft',
            signatureStatus: meta.signatureStatus ?? 'none',
          })
          setError(
            meta.status === 'failed'
              ? 'Contract analysis failed. Please re-upload the file.'
              : `Contract is still ${meta.status}. Please wait and refresh.`
          )
          setLoading(false)
          return
        }

        // Only fetch text + analysis for analyzed contracts
        const [c, a] = await Promise.all([getContract(id), getAnalysis(id)])
        setContract({
          ...c,
          originalName: meta.originalName ?? c.originalName ?? 'Contract',
          createdAt: meta.createdAt ?? c.createdAt ?? '',
          lifecycleStage: meta.lifecycleStage ?? 'draft',
          signatureStatus: meta.signatureStatus ?? 'none',
        })
        setAnalysis({
          ...a,
          clauses: (a.clauses ?? []).map(normalizeSeverity),
          keyDates: a.keyDates ?? [],
          obligations: a.obligations ?? [],
          jurisdiction: a.jurisdiction ?? null,
        })
      } catch (err: any) {
        const msg = err?.response?.data?.error
        setError(msg || 'Failed to load analysis. The contract may still be processing.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const formatDate = (raw: string) => {
    if (!raw) return 'Unknown date'
    const d = new Date(raw)
    if (isNaN(d.getTime())) return 'Unknown date'
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const handleStageChange = async (stage: LifecycleStage) => {
    setStageUpdating(true)
    try {
      await updateLifecycleStage(id!, stage)
      setLifecycleStage(stage)
    } catch {
      // silent fail
    } finally {
      setStageUpdating(false)
    }
  }

  const handleCreateReminder = async (kd: KeyDate, i: number) => {
    setCreatingReminder(i)
    try {
      let triggerAt = new Date(kd.date)
      if (isNaN(triggerAt.getTime()) || triggerAt.getTime() <= 0) {
        // Non-ISO or epoch date — set reminder for 30 days from now as a placeholder
        triggerAt = new Date()
        triggerAt.setDate(triggerAt.getDate() + 30)
      }
      await createReminder({
        contractId: id!,
        type: kd.type === 'expiry' ? 'expiry' : kd.type === 'renewal' ? 'renewal' : 'custom',
        triggerAt: triggerAt.toISOString(),
        message: `${kd.label}: ${kd.date}`,
      })
      setReminderCreated(prev => ({ ...prev, [i]: true }))
    } catch {
      // silent fail
    } finally {
      setCreatingReminder(null)
    }
  }

  const handleSendForSignature = async () => {
    if (!signerEmail || !signerName) return
    setSendingSig(true)
    setSigError("")
    try {
      await sendForSignature(id!, signerEmail, signerName)
      setSignatureStatus("pending")
      setShowSignForm(false)
    } catch (err: any) {
      const dsError = err?.response?.data?.detail?.error
      if (dsError?.error_name === "forbidden") {
        setSigError("Test mode: only the account owner email can receive signature requests.")
      } else {
        setSigError("Failed to send for signature. Please try again.")
      }
    } finally {
      setSendingSig(false)
    }
  }

  const handleRefreshSignature = async () => {
    try {
      const result = await getSignatureStatus(id!)
      setSignatureStatus(result.signatureStatus)
    } catch {
      // silent fail
    }
  }

  const handleRewrite = async (cl: Clause, i: number) => {
    setRewriting(i)
    try {
      const result = await rewriteClause(cl.text ?? '', cl.category, cl.reason)
      setRewrites(prev => ({ ...prev, [i]: result }))
    } catch {
      setRewrites(prev => ({ ...prev, [i]: 'Failed to rewrite. Please try again.' }))
    } finally {
      setRewriting(null)
    }
  }

  const handleCopy = (text: string, i: number) => {
    navigator.clipboard.writeText(text)
    setCopied(i)
    setTimeout(() => setCopied(null), 1800)
  }

  const buildDoc = () => {
    if (!contract?.extractedText || !analysis?.clauses) return null
    const text = contract.extractedText
    const sorted = [...analysis.clauses]
      .map((c, i) => ({ ...c, idx: i }))
      .sort((a, b) => a.startIndex - b.startIndex)
    const parts: React.ReactNode[] = []
    let pos = 0
    sorted.forEach((cl) => {
      const s2 = Math.min(cl.startIndex, text.length)
      const e2 = Math.min(cl.endIndex, text.length)
      if (s2 > pos) parts.push(<span key={`t-${pos}`}>{text.slice(pos, s2)}</span>)
      if (e2 > s2) {
        parts.push(
          <mark
            key={`cl-${cl.idx}`}
            data-ci={cl.idx}
            className={`${s.mark} ${sevClass[cl.severity]}`}
            onMouseEnter={(e) => {
              const rect = (e.target as HTMLElement).getBoundingClientRect()
              setTooltip({ x: rect.left, y: rect.bottom + 6, clause: cl })
              setActiveClause(cl.idx)
            }}
            onMouseLeave={() => { setTooltip(null); setActiveClause(null) }}
          >
            {text.slice(s2, e2)}
          </mark>
        )
      }
      pos = e2
    })
    if (pos < text.length) parts.push(<span key="tail">{text.slice(pos)}</span>)
    return parts
  }

  const scrollToClause = (idx: number) => {
    const el = docRef.current?.querySelector(`[data-ci="${idx}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setActiveClause(idx)
  }

  if (loading) return <div className={s.loading}>Loading analysis...</div>
  if (error || !contract || !analysis) return (
    <div className={s.loading}>
      {error || 'Analysis not found.'}{' '}
      <span className={s.link} onClick={() => navigate('/dashboard')}>Go back</span>
    </div>
  )

  const hi = analysis.clauses.filter(c => c.severity === 'high').length
  const me = analysis.clauses.filter(c => c.severity === 'medium').length
  const lo = analysis.clauses.filter(c => c.severity === 'low').length

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div className={s.headerLeft}>
          <button className={s.back} onClick={() => navigate('/dashboard')}>&larr; Dashboard</button>
          <h2 className={s.name}>{contract.originalName}</h2>
          <p className={s.meta}>{formatDate(contract.createdAt)}</p>
          <div className={s.stageRow}>
            <span className={s.stageLabel}>Stage:</span>
            {(['draft','review','approved','signed','active','expiring','expired'] as LifecycleStage[]).map((st) => (
              <button
                key={st}
                className={`${s.stageBtn} ${lifecycleStage === st ? s.stageBtnActive : ''}`}
                style={lifecycleStage === st ? { borderColor: STAGE_COLORS[st], color: STAGE_COLORS[st] } : {}}
                onClick={() => handleStageChange(st)}
                disabled={stageUpdating || !canEdit}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
        <div className={s.headerStats}>
          <div className={s.stat}>
            <div className={s.statVal}>{analysis.overallScore}<span>/100</span></div>
            <div className={s.statLabel}>Risk Score</div>
          </div>
          <div className={s.statDiv} />
          <div className={s.stat}>
            <div className={`${s.statVal} ${s.high}`}>{hi}</div>
            <div className={s.statLabel}>High Risk</div>
          </div>
          <div className={s.statDiv} />
          <div className={s.stat}>
            <div className={`${s.statVal} ${s.med}`}>{me}</div>
            <div className={s.statLabel}>Medium</div>
          </div>
          <div className={s.statDiv} />
          <div className={s.stat}>
            <div className={`${s.statVal} ${s.low}`}>{lo}</div>
            <div className={s.statLabel}>Low</div>
          </div>
          <div className={s.statDiv} />
          <div className={s.stat}>
            <button className={s.collabBtn} onClick={() => setShowCollab(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width="14" height="14">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                <path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
              Collaborate
            </button>
          </div>
        </div>
      </div>

      <div className={s.split}>
        <div className={s.docPane}>
          <div className={s.paneHead}>
            <span className={s.paneTitle}>Contract Document</span>
            <span className={s.paneHint}>Hover underlined text for AI annotation</span>
          </div>
          <div className={s.docBody} ref={docRef}>
            <div className={s.docText}>{buildDoc()}</div>
          </div>
        </div>

        <div className={s.clausePane}>
          <div className={s.tabHeaders}>
            <button className={`${s.tabHeader} ${activeTab === 'flags' ? s.activeTab : ''}`} onClick={() => setActiveTab('flags')}>
              Flags ({analysis.clauses.length})
            </button>
            <button className={`${s.tabHeader} ${activeTab === 'metadata' ? s.activeTab : ''}`} onClick={() => setActiveTab('metadata')}>
              Dates & Sign
            </button>
            <button className={`${s.tabHeader} ${activeTab === 'intel' ? s.activeTab : ''}`} onClick={() => setActiveTab('intel')}>
              Legal Intel
            </button>
          </div>

          <div className={s.tabContent}>
            {activeTab === 'flags' && (
              <div className={s.clauseList}>
                {analysis.clauses.map((cl, i) => (
                  <div
                    key={cl.id ?? i}
                    className={`${s.clauseItem} ${activeClause === i ? s.clauseActive : ''}`}
                    style={{ borderLeftColor: cl.severity === 'high' ? 'var(--crimson)' : cl.severity === 'medium' ? 'var(--amber)' : 'var(--green)' }}
                    onClick={() => scrollToClause(i)}
                  >
                    <div className={s.clauseTop}>
                      <span className={s.clauseCat}>{cl.category}</span>
                      <span className={`${s.tag} ${sevClass[cl.severity]}`}>{sevLabel[cl.severity]}</span>
                    </div>
                    <div className={s.clauseReason}>{cl.reason}</div>
                    {!rewrites[i] ? (
                      <button
                        className={s.rewriteBtn}
                        onClick={(e) => { e.stopPropagation(); handleRewrite(cl, i) }}
                        disabled={rewriting === i}
                      >
                        {rewriting === i ? (
                          <><span className={s.spinner} /> Rewriting...</>
                        ) : 'Rewrite clause'}
                      </button>
                    ) : (
                      <div className={s.rewriteBox} onClick={e => e.stopPropagation()}>
                        <div className={s.rewriteLabel}>AI Rewrite</div>
                        <div className={s.rewriteText}>{rewrites[i]}</div>
                        <div className={s.rewriteActions}>
                          <button className={s.copyBtn} onClick={() => handleCopy(rewrites[i], i)}>
                            {copied === i ? 'Copied!' : 'Copy'}
                          </button>
                          <button className={s.redoBtn} onClick={() => { setRewrites(prev => { const n = { ...prev }; delete n[i]; return n }) }}>
                            Redo
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'metadata' && (
              <div className={s.tabScrollContainer}>
                {/* E-Signature Status */}
                <div className={s.sectionBlock}>
                  <div className={s.sectionLabel}>E-Signature</div>
                  <div className={s.signatureBox}>
                    <div className={s.sigStatusWrapper}>
                      <span className={`${s.sigStatus} ${s[`sig_${signatureStatus}`]}`}>
                        {signatureStatus === 'none' ? 'Not sent' :
                         signatureStatus === 'pending' ? 'Awaiting signature' :
                         signatureStatus === 'signed' ? 'Signed' :
                         signatureStatus === 'declined' ? 'Declined' : 'Expired'}
                      </span>
                    </div>
                    <div className={s.sigActions}>
                      {canEdit && signatureStatus === 'none' && !showSignForm && (
                        <button className={s.sigBtn} onClick={() => setShowSignForm(true)}>
                          Send for Signature
                        </button>
                      )}
                      {signatureStatus === 'pending' && (
                        <button className={s.sigBtn} onClick={handleRefreshSignature}>
                          Refresh Status
                        </button>
                      )}
                      {showSignForm && (
                        <div className={s.sigForm}>
                          <input className={s.sigInput} placeholder="Signer name" value={signerName} onChange={(e) => setSignerName(e.target.value)} />
                          <input className={s.sigInput} placeholder="Signer email" type="email" value={signerEmail} onChange={(e) => setSignerEmail(e.target.value)} />
                          <button className={s.sigBtn} onClick={handleSendForSignature} disabled={sendingSig || !signerEmail || !signerName}>
                            {sendingSig ? "Sending..." : "Send Request"}
                          </button>
                          <button className={s.sigBtnCancel} onClick={() => setShowSignForm(false)}>Cancel</button>
                          {sigError && <span className={s.sigError}>{sigError}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Key Dates List */}
                {analysis.keyDates && analysis.keyDates.length > 0 && (
                  <div className={s.sectionBlock}>
                    <div className={s.sectionLabel}>Key Dates & Reminders</div>
                    <div className={s.keyDatesListVertical}>
                      {analysis.keyDates.map((kd, i) => (
                        <div key={i} className={s.keyDateItemVertical}>
                          <div className={s.keyDateTopRow}>
                            <span className={s.keyDateType} style={{ color: TYPE_COLOR[kd.type] ?? 'var(--ink-3)' }}>{kd.type}</span>
                            <span className={s.keyDateDate}>{kd.date}</span>
                          </div>
                          <div className={s.keyDateLabel}>{kd.label}</div>
                          <div className={s.keyDateAction}>
                            {!reminderCreated[i] ? (
                              <button className={s.keyDateBtnSmall} onClick={() => handleCreateReminder(kd, i)} disabled={creatingReminder === i}>
                                {creatingReminder === i ? 'Adding alert...' : '+ Add Alert'}
                              </button>
                            ) : (
                              <span className={s.keyDateDone}>Reminder set</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'intel' && (
              <div className={s.tabScrollContainer}>
                {/* AI Executive Summary */}
                <div className={s.sectionBlock}>
                  <div className={s.sectionLabel}>AI Executive Summary</div>
                  <div className={s.summaryText}>{analysis.summary}</div>
                </div>

                {/* Jurisdiction details */}
                <div className={s.sectionBlock}>
                  <div className={s.collapsibleHeader} onClick={() => setShowJurisdiction(v => !v)}>
                    <span>Jurisdiction Details</span>
                    <span className={s.collapseChevron}>{showJurisdiction ? '▼' : '▶'}</span>
                  </div>
                  {showJurisdiction && analysis.jurisdiction && (
                    <JurisdictionPanel jurisdiction={analysis.jurisdiction} />
                  )}
                </div>

                {/* Obligations details */}
                <div className={s.sectionBlock}>
                  <div className={s.collapsibleHeader} onClick={() => setShowObligations(v => !v)}>
                    <span>Obligations Tracker</span>
                    <span className={s.collapseChevron}>{showObligations ? '▼' : '▶'}</span>
                  </div>
                  {showObligations && analysis.obligations && (
                    <ObligationTracker
                      contractId={id!}
                      obligations={analysis.obligations}
                      onUpdate={(updated) => setAnalysis(prev => prev ? { ...prev, obligations: updated } : prev)}
                    />
                  )}
                </div>

                {/* Benchmark details */}
                <div className={s.sectionBlock}>
                  <div className={s.collapsibleHeader} onClick={() => setShowBenchmark(v => !v)}>
                    <span>Risk Benchmark</span>
                    <span className={s.collapseChevron}>{showBenchmark ? '▼' : '▶'}</span>
                  </div>
                  {showBenchmark && (
                    <BenchmarkPanel contractId={id!} />
                  )}
                </div>

                {/* Audit Log Details */}
                <div className={s.sectionBlock}>
                  <div className={s.collapsibleHeader} onClick={() => setShowAuditLog(v => !v)}>
                    <span>Activity Audit Log</span>
                    <span className={s.collapseChevron}>{showAuditLog ? '▼' : '▶'}</span>
                  </div>
                  {showAuditLog && (
                    <AuditLogPanel contractId={id!} />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {tooltip && (
        <div className={s.tooltip} style={{ left: Math.min(tooltip.x, window.innerWidth - 320), top: tooltip.y }}>
          <div className={s.tooltipHead}>
            <span className={`${s.tag} ${sevClass[tooltip.clause.severity]}`}>
              {sevLabel[tooltip.clause.severity]} Risk
            </span>
            <span className={s.tooltipCat}>{tooltip.clause.category}</span>
          </div>
          <div className={s.tooltipReason}>{tooltip.clause.reason}</div>
          <div className={s.tooltipSugLabel}>Suggested revision</div>
          <div className={s.tooltipSug}>{tooltip.clause.suggestion}</div>
        </div>
      )}

      {showCollab && id && (
        <CollabPanel contractId={id} onClose={() => setShowCollab(false)} />
      )}
    </div>
  )
}