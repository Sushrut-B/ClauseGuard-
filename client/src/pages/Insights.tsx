import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from "recharts"
import { getAllInsights } from "../api/insights"
import type { ContractInsight } from "../api/insights"
import styles from "./Insights.module.css"

const CAT_COLORS: Record<string, string> = {
  liability:   "#C41E3A",
  termination: "#B45309",
  payment:     "#7C3AED",
  ip:          "#0369A1",
  dispute:     "#166534",
}

const SEV_COLORS = {
  high:   "#C41E3A",
  medium: "#B45309",
  low:    "#166534",
}

export default function Insights() {
  const navigate = useNavigate()
  const [insights, setInsights] = useState<ContractInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    getAllInsights()
      .then(setInsights)
      .catch(() => setError("Failed to load insights"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className={styles.loading}>Crunching your contract data...</div>
  if (error)   return <div className={styles.loading}>{error}</div>
  if (insights.length === 0) return (
    <div className={styles.empty}>
      <div className={styles.emptyTitle}>No analyzed contracts yet</div>
      <div className={styles.emptySub}>Upload and analyze a contract to see predictive insights.</div>
      <button className={styles.btnPrimary} onClick={() => navigate("/upload")}>Upload Contract</button>
    </div>
  )

  // --- Derived data ---
  const trendData = insights.map((c) => ({
    name: c.originalName.replace(/\.[^.]+$/, "").slice(0, 18),
    score: c.overallScore,
    date: new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }))

  const catMap: Record<string, number> = {}
  insights.forEach((c) => c.clauses.forEach((cl) => {
    catMap[cl.category] = (catMap[cl.category] ?? 0) + 1
  }))
  const categoryData = Object.entries(catMap)
    .map(([cat, count]) => ({ cat, count }))
    .sort((a, b) => b.count - a.count)

  const sevMap = { high: 0, medium: 0, low: 0 }
  insights.forEach((c) => c.clauses.forEach((cl) => { sevMap[cl.severity]++ }))
  const severityData = [
    { name: "High", value: sevMap.high,   color: SEV_COLORS.high },
    { name: "Medium", value: sevMap.medium, color: SEV_COLORS.medium },
    { name: "Low", value: sevMap.low,    color: SEV_COLORS.low },
  ].filter((d) => d.value > 0)

  const avgScore = Math.round(insights.reduce((s, c) => s + c.overallScore, 0) / insights.length)
  const highRiskCount = insights.filter((c) => c.overallScore >= 70).length
  const totalClauses = insights.reduce((s, c) => s + c.clauses.length, 0)
  const topRisk = [...insights].sort((a, b) => b.overallScore - a.overallScore).slice(0, 5)

  const prediction = highRiskCount / insights.length >= 0.6
    ? "Most of your contracts carry high risk. Consider legal review before signing."
    : highRiskCount / insights.length >= 0.3
    ? "A significant portion of your contracts have elevated risk clauses."
    : "Your contract portfolio is relatively low risk. Keep monitoring new uploads."

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroEyebrow}>Predictive Analysis</div>
        <div className={styles.heroHeadline}>Contract Intelligence</div>
        <div className={styles.heroSub}>AI-powered insights across your entire contract portfolio.</div>
      </div>

      {/* Metrics */}
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Contracts Analyzed</div>
          <div className={styles.metricValue}>{insights.length}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Avg Risk Score</div>
          <div className={`${styles.metricValue} ${avgScore >= 70 ? styles.crimson : avgScore >= 40 ? styles.amber : styles.green}`}>
            {avgScore}
          </div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>High Risk Contracts</div>
          <div className={`${styles.metricValue} ${styles.crimson}`}>{highRiskCount}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Total Flagged Clauses</div>
          <div className={styles.metricValue}>{totalClauses}</div>
        </div>
      </div>

      {/* Prediction banner */}
      <div className={styles.predictionBanner}>
        <span className={styles.predictionIcon}>?</span>
        <span className={styles.predictionText}><strong>AI Prediction ? </strong>{prediction}</span>
      </div>

      {/* Charts row */}
      <div className={styles.chartsRow}>
        {/* Risk trend */}
        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>Risk Score Trend</div>
          <div className={styles.chartSub}>Overall risk score per contract over time</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--rule)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--ink-3)" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--ink-3)" }} />
              <Tooltip
                contentStyle={{ fontSize: 11, border: "1px solid var(--rule)", borderRadius: 4 }}
                formatter={(v: any) => [`${v}/100`, "Risk Score"]}

                labelFormatter={(l) => `${l}`}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--crimson)"
                strokeWidth={2}
                dot={{ r: 4, fill: "var(--crimson)" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category breakdown */}
        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>Risk by Category</div>
          <div className={styles.chartSub}>Total flagged clauses per risk type</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--rule)" />
              <XAxis dataKey="cat" tick={{ fontSize: 10, fill: "var(--ink-3)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--ink-3)" }} />
              <Tooltip contentStyle={{ fontSize: 11, border: "1px solid var(--rule)", borderRadius: 4 }} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {categoryData.map((entry) => (
                  <Cell key={entry.cat} fill={CAT_COLORS[entry.cat] ?? "#6B6860"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Severity donut */}
        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>Severity Distribution</div>
          <div className={styles.chartSub}>High / Medium / Low across all clauses</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {severityData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11, border: "1px solid var(--rule)", borderRadius: 4 }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top risk contracts table */}
      <div className={styles.tableWrap}>
        <div className={styles.tableHead}>
          <div className={styles.tableTitle}>Highest Risk Contracts</div>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Contract</th>
              <th>Risk Score</th>
              <th>Clauses</th>
              <th>High Risk</th>
              <th>Analyzed</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {topRisk.map((c) => {
              const hi = c.clauses.filter((cl) => cl.severity === "high").length
              return (
                <tr key={c.contractId} className={styles.row}>
                  <td className={styles.name}>{c.originalName}</td>
                  <td>
                    <span className={`${styles.score} ${c.overallScore >= 70 ? styles.high : c.overallScore >= 40 ? styles.med : styles.low}`}>
                      {c.overallScore}
                    </span>
                  </td>
                  <td className={styles.muted}>{c.clauses.length}</td>
                  <td className={styles.high}>{hi}</td>
                  <td className={styles.muted}>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={styles.link} onClick={() => navigate(`/analysis/${c.contractId}`)}>
                      View ?
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}