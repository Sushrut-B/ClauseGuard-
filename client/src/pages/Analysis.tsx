import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getContract, getAnalysis } from '../api/contracts'
import s from './Analysis.module.css'

interface Clause {
  id: string
  category: string
  severity: 'high' | 'medium' | 'low'
  reason: string
  suggestion: string
  startIndex: number
  endIndex: number
}

interface Analysis {
  overallScore: number
  summary: string
  clauses: Clause[]
}

interface Contract {
  id: string
  originalName: string
  createdAt: string

  extractedText: string
  status: string
}

const sevLabel = { high: 'High', medium: 'Medium', low: 'Low' }
const sevClass = { high: s.high, medium: s.med, low: s.low }

export default function Analysis() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [contract, setContract] = useState<Contract | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeClause, setActiveClause] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; clause: Clause } | null>(null)
  const docRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const [c, a] = await Promise.all([getContract(id), getAnalysis(id)])
        setContract(c)
        setAnalysis(a)
      } catch {
        setError('Failed to load analysis.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

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

  if (loading) return <div className={s.loading}>Loading analysis…</div>
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
      {/* Header */}
      <div className={s.header}>
        <div className={s.headerLeft}>
          <button className={s.back} onClick={() => navigate('/dashboard')}>
            ← Dashboard
          </button>
          <h2 className={s.name}>{contract.originalName}</h2>
          <p className={s.meta}>
            {new Date(contract.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            {' · '}Analyzed by Gemini 2.5 Flash
          </p>
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
        </div>
      </div>

      {/* Summary */}
      <div className={s.summary}>
        <span className={s.summaryLabel}>AI Summary · </span>
        {analysis.summary}
      </div>

      {/* Split view */}
      <div className={s.split}>
        {/* Document */}
        <div className={s.docPane}>
          <div className={s.paneHead}>
            <span className={s.paneTitle}>Contract Document</span>
            <span className={s.paneHint}>Hover underlined text for AI annotation</span>
          </div>
          <div className={s.docBody} ref={docRef}>
            <div className={s.docText}>{buildDoc()}</div>
          </div>
        </div>

        {/* Clause list */}
        <div className={s.clausePane}>
          <div className={s.paneHead}>
            <span className={s.paneTitle}>Flagged Clauses</span>
            <span className={s.paneHint}>{analysis.clauses.length} total</span>
          </div>
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
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className={s.tooltip}
          style={{ left: Math.min(tooltip.x, window.innerWidth - 320), top: tooltip.y }}
        >
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
    </div>
  )
}