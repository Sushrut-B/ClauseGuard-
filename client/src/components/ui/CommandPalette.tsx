import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import s from './CommandPalette.module.css'

export interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()

  const commands = [
    { label: 'Go to Dashboard', path: '/dashboard', group: 'Navigation', shortcut: '⌘ + D' },
    { label: 'Upload New Contract', path: '/upload', group: 'Navigation', shortcut: '⌘ + U' },
    { label: 'Contract Comparison', path: '/comparison', group: 'Intelligence', shortcut: '⌘ + C' },
    { label: 'Consistency Cross-Check', path: '/cross-check', group: 'Intelligence', shortcut: '⌘ + X' },
    { label: 'Portfolio Insights', path: '/insights', group: 'Intelligence', shortcut: '⌘ + I' },
    { label: 'Key Dates & Reminders', path: '/reminders', group: 'Intelligence', shortcut: '⌘ + R' },
    { label: 'Legal Playbooks', path: '/playbook', group: 'Intelligence', shortcut: '⌘ + P' },
  ]

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
        else {
          setQuery('')
          setSelectedIndex(0)
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSelect = (path: string) => {
    navigate(path)
    onClose()
  }

  return (
    <div className={s.overlay} onClick={onClose}>
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
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            autoFocus
          />
          <span className={s.escBadge}>ESC</span>
        </div>

        <div className={s.body}>
          {filtered.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-3)' }}>
              No commands found for "{query}"
            </div>
          ) : (
            filtered.map((item, idx) => (
              <div
                key={item.path}
                className={`${s.item} ${idx === selectedIndex ? s.itemActive : ''}`}
                onClick={() => handleSelect(item.path)}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className={s.itemLeft}>
                  <svg className={s.itemIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  <span>{item.label}</span>
                </div>
                <span className={s.itemShortcut}>{item.shortcut}</span>
              </div>
            ))
          )}
        </div>

        <div className={s.footer}>
          <span>Use <strong>↑</strong> <strong>↓</strong> to navigate</span>
          <span>Press <strong>↵</strong> to select</span>
        </div>
      </div>
    </div>
  )
}
