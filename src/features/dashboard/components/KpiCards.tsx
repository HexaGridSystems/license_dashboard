import styles from './DashboardPage.module.css'
import { cx } from './utils'

type KpiCardsProps = {
  totalLicenses: number
  criticalCount: number
  dueSoonCount: number
  compliantCount: number
}

export function KpiCards(props: KpiCardsProps) {
  const { totalLicenses, criticalCount, dueSoonCount, compliantCount } = props

  return (
    <section className={styles.statsGrid}>
      <article className={cx(styles.card, styles.stat)}>
        <p>Total Licenses</p>
        <h2>{totalLicenses}</h2>
        <span className={styles.statTrend}>Hospital-focused view</span>
      </article>
      <article className={cx(styles.card, styles.stat)}>
        <p>Critical / Overdue</p>
        <h2>{criticalCount}</h2>
        <span className={cx(styles.statTrend, styles.warning)}>Escalate renewals now</span>
      </article>
      <article className={cx(styles.card, styles.stat)}>
        <p>Renewals Due in 90 Days</p>
        <h2>{dueSoonCount}</h2>
        <span className={styles.statTrend}>Start renewal preparation</span>
      </article>
      <article className={cx(styles.card, styles.stat)}>
        <p>Low Urgency</p>
        <h2>{compliantCount}</h2>
        <span className={cx(styles.statTrend, styles.success)}>Monitoring only</span>
      </article>
    </section>
  )
}
