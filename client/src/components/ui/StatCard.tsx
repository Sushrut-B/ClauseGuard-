import type { ReactNode } from 'react'
import s from './StatCard.module.css'

export interface StatCardProps {
  title: string
  value: string | number
  change?: string
  isPositive?: boolean
  description?: string
  icon?: ReactNode
  progressPercent?: number
  className?: string
}

export default function StatCard({
  title,
  value,
  change,
  isPositive = true,
  description,
  icon,
  progressPercent,
  className = '',
}: StatCardProps) {
  return (
    <div className={`${s.card} ${className}`}>
      <div className={s.topRow}>
        <span className={s.title}>{title}</span>
        {icon && <div className={s.iconWrapper}>{icon}</div>}
      </div>

      <div className={s.mainValue}>{value}</div>

      {(change || description) && (
        <div className={s.bottomRow}>
          {change && (
            <span className={`${s.changeBadge} ${isPositive ? s.positive : s.negative}`}>
              {isPositive ? '↑' : '↓'} {change}
            </span>
          )}
          {description && <span className={s.description}>{description}</span>}
        </div>
      )}

      {typeof progressPercent === 'number' && (
        <div className={s.progressBarTrack}>
          <div className={s.progressBarFill} style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }} />
        </div>
      )}
    </div>
  )
}
