import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import s from './CommandPalette.module.css'

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      } else if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!isOpen) return null

  const commands = [
    { id: 'dashboard', label: 'Go to Dashboard', group: 'Navigation', path: '/dashboard' },
    { id: 'analysis', label: 'Run Risk Analysis', group: 'Navigation', path: '/analysis' },
    { id: 'contracts', label: 'View All Contracts', group: 'Navigation', path: '/contracts' },
    { id: 'comparison', label: 'Contract Comparison', group: 'Navigation', path: '/comparison' },
    { id: 'crosscheck', label: 'Consistency Cross-Check', group: 'Navigation', path: '/crosscheck' },
    { id: 'insights', label: 'Portfolio Insights', group: 'Navigation', path: '/insights' },
    { id: 'signatures', label: 'E-Signatures Tracker', group: 'Navigation', path: '/signatures' },
    { id: 'playbooks', label: 'Playbooks & Templates', group: 'Navigation', path: '/playbooks' },
    { id: 'audit', label: 'Audit Trail Logs', group: 'Navigation', path: '/audit' },
  ]

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  )

  const handleSelect = (path: string) => {
    navigate(path)
    setIsOpen(false)
    setQuery('')
  }

  return (
    <div className={s.overlay} onClick={() => setIsOpen(false)}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <div className={s.searchHeader}>
          <svg className={s.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className={s.input}
            type="text"
            placeholder="Type a command or search page..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <span className={s.shortcutBadge}>ESC</span>
        </div>

        <div className={s.commandList}>
          <div className={s.groupLabel}>Navigation & Actions</div>
          {filteredCommands.length === 0 ? (
            <div className={s.item} style={{ color: 'var(--ink-3)' }}>No results found</div>
          ) : (
            filteredCommands.map((cmd) => (
              <div
                key={cmd.id}
                className={s.item}
                onClick={() => handleSelect(cmd.path)}
              >
                <div className={s.itemLeft}>
                  <svg className={s.itemIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  <span>{cmd.label}</span>
                </div>
                <span className={s.shortcutBadge}>↵ Select</span>
              </div>
            ))
          )}
        </div>

        <div className={s.footer}>
          <span>Use <strong>⌘K</strong> or <strong>Ctrl+K</strong> to open anywhere</span>
          <span>ClauseGuard Enterprise</span>
        </div>
      </div>
    </div>
  )
}
