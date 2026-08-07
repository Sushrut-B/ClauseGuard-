import type { ReactNode } from 'react'
import s from './Badge.module.css'

export type BadgeVariant = 'high' | 'medium' | 'low' | 'approved' | 'pending' | 'draft' | 'active' | 'expired'

export interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  showDot?: boolean
  className?: string
}

export default function Badge({
  variant = 'pending',
  children,
  showDot = true,
  className = '',
}: BadgeProps) {
  const classNames = [s.badge, s[variant], className].filter(Boolean).join(' ')

  return (
    <span className={classNames}>
      {showDot && <span className={s.dot} />}
      <span>{children}</span>
    </span>
  )
}
