import { useEffect, useState } from "react"
import { getClauseTemplates } from "../api/clauseLibrary"
import type { ClauseTemplate, ClauseCategory, RiskLevel } from "../api/clauseLibrary"
import styles from "./ClauseLibrary.module.css"

const CATEGORIES: { value: ClauseCategory | ''; label: string }[] = [
  { value: '', label: 'All Categories' },
  { value: 'liability', label: 'Liability' },
  { value: 'termination', label: 'Termination' },
  { value: 'payment', label: 'Payment' },
  { value: 'ip', label: 'Intellectual Property' },
  { value: 'dispute', label: 'Dispute Resolution' },
]

const RISK_LEVELS: { value: RiskLevel | ''; label: string }[] = [
  { value: '', label: 'All Risk Levels' },
  { value: 'safe', label: 'Safe' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'caution', label: 'Caution' },
]

const RISK_COLORS: Record<RiskLevel, string> = {
  safe: 'var(--green)',
  balanced: '#0369A1',
  caution: 'var(--amber)',
}

const RISK_BG: Record<RiskLevel, string> = {
  safe: 'var(--grn-dim)',
  balanced: 'rgba(3,105,161,0.08)',
  caution: 'var(--amb-dim)',
}

export default function ClauseLibrary() {
  const [templates, setTemplates] = useState<ClauseTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [category, setCategory] = useState<ClauseCategory | ''>('')
  const [riskLevel, setRiskLevel] = useState<RiskLevel | ''>('')
  const [search, setSearch] = useState("")
  const [copied, setCopied] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [category, riskLevel])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const data = await getClauseTemplates({
        category: category || undefined,
        riskLevel: riskLevel || undefined,
        search: search || undefined,
      })
      setTemplates(data)
    } catch {
      setError("Failed to load clause templates")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchTemplates()
  }

  const handleCopy = (template: ClauseTemplate) => {
    navigator.clipboard.writeText(template.text)
    setCopied(template.id)
    setTimeout(() => setCopied(null), 2000)
  }

  const grouped = CATEGORIES.slice(1).reduce((acc, cat) => {
    acc[cat.value as ClauseCategory] = templates.filter(t => t.category === cat.value)
    return acc
  }, {} as Record<ClauseCategory, ClauseTemplate[]>)

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroEyebrow}>Clause Library</div>
        <div className={styles.heroHeadline}>Pre-approved Clause Templates</div>
        <div className={styles.heroSub}>
          Browse safe, balanced standard clauses across all risk categories. Copy and use in your contracts.
        </div>
      </div>

      <div className={styles.toolbar}>
        <form className={styles.searchForm} onSubmit={handleSearch}>
          <input
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clauses..."
          />
          <button className={styles.searchBtn} type="submit">Search</button>
        </form>
        <div className={styles.filters}>
          <select className={styles.filter} value={category} onChange={(e) => setCategory(e.target.value as ClauseCategory | '')}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select className={styles.filter} value={riskLevel} onChange={(e) => setRiskLevel(e.target.value as RiskLevel | '')}>
            {RISK_LEVELS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Loading clause templates...</div>
      ) : templates.length === 0 ? (
        <div className={styles.empty}>No templates found. Try adjusting your filters.</div>
      ) : category ? (
        <div className={styles.templateList}>
          {templates.map(t => (
            <TemplateCard
              key={t.id}
              template={t}
              expanded={expanded === t.id}
              onExpand={() => setExpanded(expanded === t.id ? null : t.id)}
              onCopy={() => handleCopy(t)}
              copied={copied === t.id}
              riskColors={RISK_COLORS}
              riskBg={RISK_BG}
            />
          ))}
        </div>
      ) : (
        <div className={styles.grouped}>
          {CATEGORIES.slice(1).map(cat => {
            const items = grouped[cat.value as ClauseCategory] ?? []
            if (items.length === 0) return null
            return (
              <div key={cat.value} className={styles.group}>
                <div className={styles.groupTitle}>{cat.label}</div>
                <div className={styles.templateList}>
                  {items.map(t => (
                    <TemplateCard
                      key={t.id}
                      template={t}
                      expanded={expanded === t.id}
                      onExpand={() => setExpanded(expanded === t.id ? null : t.id)}
                      onCopy={() => handleCopy(t)}
                      copied={copied === t.id}
                      riskColors={RISK_COLORS}
                      riskBg={RISK_BG}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TemplateCard({
  template, expanded, onExpand, onCopy, copied, riskColors, riskBg
}: {
  template: ClauseTemplate
  expanded: boolean
  onExpand: () => void
  onCopy: () => void
  copied: boolean
  riskColors: Record<RiskLevel, string>
  riskBg: Record<RiskLevel, string>
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardTop} onClick={onExpand}>
        <div className={styles.cardLeft}>
          <div className={styles.cardTitle}>{template.title}</div>
          <div className={styles.cardDesc}>{template.description}</div>
          <div className={styles.cardTags}>
            {template.tags.map(tag => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        </div>
        <div className={styles.cardRight}>
          <span
            className={styles.riskBadge}
            style={{ color: riskColors[template.riskLevel], background: riskBg[template.riskLevel] }}
          >
            {template.riskLevel}
          </span>
          <span className={styles.expandIcon}>{expanded ? '-' : '+'}</span>
        </div>
      </div>
      {expanded && (
        <div className={styles.cardBody}>
          <div className={styles.clauseText}>{template.text}</div>
          <div className={styles.cardActions}>
            <button className={styles.copyBtn} onClick={onCopy}>
              {copied ? 'Copied!' : 'Copy Clause'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}