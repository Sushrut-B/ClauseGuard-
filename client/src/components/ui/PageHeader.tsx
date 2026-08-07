import type { ReactNode } from 'react'
import s from './PageHeader.module.css'

export interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: string[]
  actions?: ReactNode
  className?: string
}

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`${s.container} ${className}`}>
      <div className={s.leftCol}>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className={s.breadcrumbs}>
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span>{crumb}</span>
                {idx < breadcrumbs.length - 1 && <span className={s.breadcrumbSeparator}>/</span>}
              </span>
            ))}
          </div>
        )}
        <h1 className={s.title}>{title}</h1>
        {subtitle && <p className={s.subtitle}>{subtitle}</p>}
      </div>

      {actions && <div className={s.actions}>{actions}</div>}
    </div>
  )
}
