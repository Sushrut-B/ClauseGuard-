import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getContracts } from "../api/contracts"
import { compareContracts } from "../api/comparison"
import type { ComparisonResult } from "../api/comparison"
import styles from "./Comparison.module.css"

export default function Comparison() {
  const navigate = useNavigate()
  const [contracts, setContracts] = useState<any[]>([])
  const [contractIdA, setContractIdA] = useState("")
  const [contractIdB, setContractIdB] = useState("")
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    getContracts()
      .then((data) => setContracts(data.filter((c: any) => c.status === "analyzed")))
      .catch(() => setError("Failed to load contracts"))
      .finally(() => setFetching(false))
  }, [])

  const handleCompare = async () => {
    if (!contractIdA || !contractIdB || contractIdA === contractIdB) return
    setLoading(true)
    setResult(null)
    setError("")
    try {
      const data = await compareContracts(contractIdA, contractIdB)
      setResult(data)
    } catch {
      setError("Comparison failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const analyzed = contracts.filter((c) => c.status === "analyzed")

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroEyebrow}>Contract Comparison</div>
        <div className={styles.heroHeadline}>Compare Contracts</div>
        <div className={styles.heroSub}>Select two analyzed contracts to see a side-by-side AI diff of risk changes.</div>
      </div>

      <div className={styles.selector}>
        <div className={styles.selectorCol}>
          <div className={styles.selectorLabel}>Contract A (Base)</div>
          <select
            className={styles.select}
            value={contractIdA}
            onChange={(e) => setContractIdA(e.target.value)}
          >
            <option value="">Select a contract...</option>
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>{c.originalName}</option>
            ))}
          </select>
        </div>
        <div className={styles.vsLabel}>VS</div>
        <div className={styles.selectorCol}>
          <div className={styles.selectorLabel}>Contract B (Revised)</div>
          <select
            className={styles.select}
            value={contractIdB}
            onChange={(e) => setContractIdB(e.target.value)}
          >
            <option value="">Select a contract...</option>
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>{c.originalName}</option>
            ))}
          </select>
        </div>
        <button
          className={styles.btnPrimary}
          onClick={handleCompare}
          disabled={!contractIdA || !contractIdB || contractIdA === contractIdB || loading}
        >
          {loading ? "Comparing..." : "Compare"}
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          Analyzing differences with Gemini...
        </div>
      )}

      {result && (
        <div className={styles.results}>
          {/* Score comparison */}
          <div className={styles.scoreRow}>
            <div className={styles.scoreCard}>
              <div className={styles.scoreLabel}>{result.nameA}</div>
              <div className={`${styles.scoreVal} ${result.riskScoreA >= 70 ? styles.high : result.riskScoreA >= 40 ? styles.med : styles.low}`}>
                {result.riskScoreA}<span>/100</span>
              </div>
              <div className={styles.scoreTag}>Base Risk</div>
            </div>
            <div className={`${styles.verdictBadge} ${styles[result.verdict]}`}>
              {result.verdict === "improved" ? "Risk Improved" : result.verdict === "worsened" ? "Risk Worsened" : "No Change"}
            </div>
            <div className={styles.scoreCard}>
              <div className={styles.scoreLabel}>{result.nameB}</div>
              <div className={`${styles.scoreVal} ${result.riskScoreB >= 70 ? styles.high : result.riskScoreB >= 40 ? styles.med : styles.low}`}>
                {result.riskScoreB}<span>/100</span>
              </div>
              <div className={styles.scoreTag}>Revised Risk</div>
            </div>
          </div>

          {/* Summary */}
          <div className={styles.summary}>
            <span className={styles.summaryLabel}>AI Summary - </span>
            {result.summary}
          </div>

          {/* Changes */}
          <div className={styles.changesWrap}>
            <div className={styles.changesHead}>
              <div className={styles.changesTitle}>Clause Changes</div>
              <div className={styles.changesMeta}>{result.changes.length} differences found</div>
            </div>
            <div className={styles.changesList}>
              {result.changes.map((ch, i) => (
                <div key={i} className={`${styles.changeItem} ${styles[ch.type]}`}>
                  <div className={styles.changeTop}>
                    <span className={styles.changeCat}>{ch.category}</span>
                    <span className={`${styles.changeType} ${styles[ch.type]}`}>{ch.type}</span>
                    <span className={`${styles.changeSev} ${styles[ch.severity]}`}>{ch.severity}</span>
                  </div>
                  <div className={styles.changeDesc}>{ch.description}</div>
                  {(ch.textA || ch.textB) && (
                    <div className={styles.changeDiff}>
                      {ch.textA && (
                        <div className={styles.diffBlock}>
                          <div className={styles.diffLabel}>Contract A</div>
                          <div className={`${styles.diffText} ${styles.diffA}`}>{ch.textA}</div>
                        </div>
                      )}
                      {ch.textB && (
                        <div className={styles.diffBlock}>
                          <div className={styles.diffLabel}>Contract B</div>
                          <div className={`${styles.diffText} ${styles.diffB}`}>{ch.textB}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}