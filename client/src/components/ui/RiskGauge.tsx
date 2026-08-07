import s from './RiskGauge.module.css'

export interface RiskGaugeProps {
  score: number // 0 - 100
  size?: number
  strokeWidth?: number
  showLabel?: boolean
  className?: string
}

export default function RiskGauge({
  score,
  size = 90,
  strokeWidth = 8,
  showLabel = true,
  className = '',
}: RiskGaugeProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const normalizedScore = Math.min(100, Math.max(0, score))
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference

  // Risk Color Mapping
  let strokeColor = 'var(--green)'
  if (normalizedScore >= 70) strokeColor = 'var(--crimson)'
  else if (normalizedScore >= 40) strokeColor = 'var(--amber)'

  return (
    <div className={`${s.container} ${className}`} style={{ width: size, height: size }}>
      <svg className={s.svg} width={size} height={size}>
        <circle
          className={s.circleBg}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className={s.circleProgress}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={strokeColor}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className={s.textOverlay}>
        <span className={s.score}>{score}</span>
        {showLabel && <span className={s.label}>Score</span>}
      </div>
    </div>
  )
}
