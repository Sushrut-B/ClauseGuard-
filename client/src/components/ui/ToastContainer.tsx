import { useState, useEffect } from 'react'
import s from './ToastContainer.module.css'

export interface ToastMessage {
  id: string
  text: string
  type?: 'info' | 'success' | 'warning'
}

let toastListener: ((toast: ToastMessage) => void) | null = null

export function showToast(text: string, type: 'info' | 'success' | 'warning' = 'success') {
  if (toastListener) {
    toastListener({ id: String(Date.now()), text, type })
  }
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    toastListener = (newToast) => {
      setToasts((prev) => [...prev, newToast])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id))
      }, 3000)
    }
    return () => {
      toastListener = null
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className={s.toastContainer}>
      {toasts.map((t) => (
        <div key={t.id} className={s.toast}>
          <svg className={s.toastIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  )
}
