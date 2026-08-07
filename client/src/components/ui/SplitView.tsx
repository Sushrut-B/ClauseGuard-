import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react'
import s from './SplitView.module.css'

export interface SplitViewProps {
  left: ReactNode
  right: ReactNode
  initialLeftWidthPercent?: number
  minLeftWidthPercent?: number
  maxLeftWidthPercent?: number
  className?: string
}

export default function SplitView({
  left,
  right,
  initialLeftWidthPercent = 50,
  minLeftWidthPercent = 25,
  maxLeftWidthPercent = 75,
  className = '',
}: SplitViewProps) {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidthPercent)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100
      setLeftWidth(Math.min(maxLeftWidthPercent, Math.max(minLeftWidthPercent, newWidth)))
    },
    [isDragging, minLeftWidthPercent, maxLeftWidthPercent]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handleDoubleClick = () => {
    setLeftWidth(50)
  }

  return (
    <div ref={containerRef} className={`${s.container} ${className}`}>
      <div className={s.leftPane} style={{ width: `${leftWidth}%` }}>
        {left}
      </div>

      <div
        className={`${s.divider} ${isDragging ? s.dividerDragging : ''}`}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        title="Drag to resize, double-click to center"
      >
        <div className={s.dividerHandle} />
      </div>

      <div className={s.rightPane}>
        {right}
      </div>
    </div>
  )
}
