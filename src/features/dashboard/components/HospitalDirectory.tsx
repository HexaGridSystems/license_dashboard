import styles from './DashboardPage.module.css'
import { cx } from './utils'

export function HospitalDirectory() {

  return (
    <section className={cx(styles.hospitalDirectory, styles.card)}>
      <div className={cx(styles.sectionHead, styles.compact)}>
        <h3>Apollo Hospital, Sarjapur</h3>
      </div>
      <p className={styles.sectionHelp}>
        A comprehensive regulatory intelligence dashboard that centralizes licence management, live compliance status monitoring, renewal tracking, and regulatory risk visibility.
      </p>
    </section>
  )
}
