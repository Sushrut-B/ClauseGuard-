import styles from "./JurisdictionPanel.module.css"

interface JurisdictionFlag {
  clause: string
  issue: string
  severity: "high" | "medium" | "low"
}

interface Jurisdiction {
  governingLaw: string
  jurisdiction: string
  flags: JurisdictionFlag[]
}

interface Props {
  jurisdiction: Jurisdiction
}

const SEV_COLORS = {
  high: "var(--crimson)",
  medium: "var(--amber)",
  low: "var(--green)",
}

const SEV_BG = {
  high: "var(--cr-dim)",
  medium: "var(--amb-dim)",
  low: "var(--grn-dim)",
}

export default function JurisdictionPanel({ jurisdiction }: Props) {
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.govRow}>
          <div className={styles.govItem}>
            <div className={styles.govLabel}>Governing Law</div>
            <div className={styles.govVal}>{jurisdiction.governingLaw}</div>
          </div>
          <div className={styles.govDivider} />
          <div className={styles.govItem}>
            <div className={styles.govLabel}>Jurisdiction</div>
            <div className={styles.govVal}>{jurisdiction.jurisdiction}</div>
          </div>
          <div className={styles.govDivider} />
          <div className={styles.govItem}>
            <div className={styles.govLabel}>Enforceability Flags</div>
            <div className={styles.govVal}>{jurisdiction.flags.length}</div>
          </div>
        </div>
      </div>

      {jurisdiction.flags.length === 0 ? (
        <div className={styles.empty}>
          No enforceability issues detected for this jurisdiction.
        </div>
      ) : (
        <div className={styles.flagList}>
          {jurisdiction.flags.map((f, i) => (
            <div key={i} className={styles.flagItem}>
              <div className={styles.flagTop}>
                <span
                  className={styles.sevBadge}
                  style={{ color: SEV_COLORS[f.severity], background: SEV_BG[f.severity] }}
                >
                  {f.severity}
                </span>
                <span className={styles.flagClause}>{f.clause}</span>
              </div>
              <div className={styles.flagIssue}>{f.issue}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}