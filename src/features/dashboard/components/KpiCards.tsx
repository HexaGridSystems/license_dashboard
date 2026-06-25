import styles from './DashboardPage.module.css'
import { cx } from './utils'

type KpiCardsProps = {
  totalLicenses: number
  activeLicensesCount: number
  expiredLicensesCount: number
  dueSoonLicensesCount: number
}

export function KpiCards(props: KpiCardsProps) {
  const {
    totalLicenses,
    activeLicensesCount,
    expiredLicensesCount,
    dueSoonLicensesCount,
  } = props

  return (
    <section className={styles.statsGrid}>
      <article className={cx(styles.card, styles.stat)}>
        <p>Total licences</p>
        <h2>{totalLicenses}</h2>
      </article>
      <article className={cx(styles.card, styles.stat)}>
        <p>Active licences</p>
        <h2>{activeLicensesCount}</h2>
      </article>
      <article className={cx(styles.card, styles.stat)}>
        <p>Expired licences</p>
        <h2>{expiredLicensesCount}</h2>
      </article>
      <article className={cx(styles.card, styles.stat)}>
        <p>Expiring soon</p>
        <h2>{dueSoonLicensesCount}</h2>
      </article>
    </section>
  )
}
