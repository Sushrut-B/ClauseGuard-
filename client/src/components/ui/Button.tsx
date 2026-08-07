import type { ButtonHTMLAttributes, ReactNode } from 'react'

import s from './Button.module.css'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children: ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const classNames = [
    s.button,
    s[variant],
    s[size],
    className,
  ].filter(Boolean).join(' ')

  return (
    <button className={classNames} disabled={disabled || isLoading} {...props}>
      {isLoading ? (
        <span className={s.spinner} />
      ) : (
        <>
          {leftIcon && <span className={s.icon}>{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className={s.icon}>{rightIcon}</span>}
        </>
      )}
    </button>
  )
}
