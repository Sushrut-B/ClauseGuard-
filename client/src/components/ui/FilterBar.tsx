import s from './FilterBar.module.css'

export interface FilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  activeRisk: 'all' | 'high' | 'medium' | 'low'
  onRiskChange: (risk: 'all' | 'high' | 'medium' | 'low') => void
  counts?: { all: number; high: number; medium: number; low: number }
}

export default function FilterBar({
  searchQuery,
  onSearchChange,
  activeRisk,
  onRiskChange,
  counts,
}: FilterBarProps) {
  const chips: { label: string; value: 'all' | 'high' | 'medium' | 'low'; count?: number }[] = [
    { label: 'All Contracts', value: 'all', count: counts?.all },
    { label: 'High Risk', value: 'high', count: counts?.high },
    { label: 'Medium Risk', value: 'medium', count: counts?.medium },
    { label: 'Low Risk', value: 'low', count: counts?.low },
  ]

  return (
    <div className={s.filterBar}>
      <div className={s.searchGroup}>
        <svg className={s.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className={s.searchInput}
          type="text"
          placeholder="Filter contracts by name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className={s.chipGroup}>
        {chips.map((c) => (
          <button
            key={c.value}
            className={`${s.chip} ${activeRisk === c.value ? s.chipActive : ''}`}
            onClick={() => onRiskChange(c.value)}
          >
            {c.label} {c.count !== undefined && `(${c.count})`}
          </button>
        ))}
      </div>
    </div>
  )
}
