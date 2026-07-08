import { useEffect, useState } from "react"
import { getBenchmark } from "../../api/benchmark"
import type { BenchmarkResult } from "../../api/benchmark"
import styles from "./BenchmarkPanel.module.css"

interface Props { contractId: string }

const CAT_COLORS: Record<string, string> = {
  liability: "var(--crimson)",
  termination: "var(--amber)",
  payment: "#7C3AED",
  ip: "#0369A1",
  dispute: "var(--green)",
}

export default function BenchmarkPanel({ contractId }: Props) {
  const [data, setData] = useState<BenchmarkResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    getBenchmark(contractId)
      .then(setData)
      .catch(() => setError("Failed to load benchmark"))
      .finally(() => setLoading(false))
  }, [contractId])

  if (loading) return <div className={styles.loading}>Computing benchmarks...</div>
  if (error) return <div className={styles.loading}>{error}</div>
  if (!data) return null

  const verdict = data.percentile >= 70
    ? { label: "High Risk", color: "var(--crimson)", desc: `Riskier than ${data.percentile}% of your contracts` }
    : data.percentile >= 40
    ? { label: "Average Risk", color: "var(--amber)", desc: `Riskier than ${data.percentile}% of your contracts` }
    : { label: "Low Risk", color: "var(--green)", desc: `Riskier than only ${data.percentile}% of your contracts` }

  return (
    <div className={styles.wrap}>
      <div className={styles.scoreRow}>
        <div className={styles.scoreCard}>
          <div className={styles.scoreLabel}>This Contract</div>
          <div className={styles.scoreVal} style={{ color: data.currentScore >= 70 ? "var(--crimson)" : data.currentScore >= 40 ? "var(--amber)" : "var(--green)" }}>
            {data.currentScore}<span>/100</span>
          </div>
        </div>
        <div className={styles.verdictCard}>
          <div className={styles.verdictLabel} style={{ color: verdict.color }}>{verdict.label}</div>
          <div className={styles.verdictDesc}>{verdict.desc}</div>
          <div className={styles.totalNote}>Based on {data.totalContracts} analyzed contracts</div>
        </div>
        <div className={styles.scoreCard}>
          <div className={styles.scoreLabel}>Portfolio Average</div>
          <div className={styles.scoreVal} style={{ color: data.avgScore >= 70 ? "var(--crimson)" : data.avgScore >= 40 ? "var(--amber)" : "var(--green)" }}>
            {data.avgScore}<span>/100</span>
          </div>
        </div>
      </div>

      <div className={styles.percentileBar}>
        <div className={styles.percentileTrack}>
          <div
            className={styles.percentileFill}
            style={{ width: `${data.percentile}%`, background: verdict.color }}
          />
          <div
            className={styles.percentileMarker}
            style={{ left: `${data.percentile}%` }}
          >
            <div className={styles.percentileLabel}>{data.percentile}th percentile</div>
          </div>
        </div>
        <div className={styles.percentileScale}>
          <span>Safer</span>
          <span>Riskier</span>
        </div>
      </div>

      <div className={styles.catList}>
        <div className={styles.catHeader}>
          <span>Category</span>
          <span>This Contract</span>
          <span>Portfolio Avg</span>
          <span>Difference</span>
        </div>
        {data.categoryBenchmark.map(cat => {
          const diff = cat.currentScore - cat.avgScore
          return (
            <div key={cat.category} className={styles.catRow}>
              <div className={styles.catName}>
                <span className={styles.catDot} style={{ background: CAT_COLORS[cat.category] ?? "var(--ink-3)" }} />
                {cat.category}
              </div>
              <div className={styles.catScore} style={{ color: cat.currentScore >= 70 ? "var(--crimson)" : cat.currentScore >= 40 ? "var(--amber)" : "var(--green)" }}>
                {cat.currentScore}
              </div>
              <div className={styles.catScore} style={{ color: "var(--ink-3)" }}>{cat.avgScore}</div>
              <div className={`${styles.catDiff} ${diff > 0 ? styles.worse : diff < 0 ? styles.better : styles.neutral}`}>
                {diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : "="}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}