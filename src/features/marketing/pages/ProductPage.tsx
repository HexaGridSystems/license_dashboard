import { Link } from 'react-router-dom'
import styles from '../components/MarketingSite.module.css'

export function ProductPage() {
  return (
    <>
      <section className={styles.section}>
        <h1 className={styles.sectionTitle}>Product</h1>
        <p className={styles.sectionLead}>
          Compliverse Licence Dashboard is the operating layer for hospital compliance execution.
          It helps teams track obligations, prioritize deadlines, and close actions with clarity.
        </p>

        <div className={styles.productFrame}>
          <h3>Designed for compliance operators</h3>
          <p>Central register for licenses, permits, and statutory submissions.</p>
          <p>Risk-oriented views based on expiry windows and urgency status.</p>
          <p>Export-ready snapshots for internal governance and audit readiness.</p>
        </div>

        <div className={styles.buttonRow}>
          <Link to="/app" className={styles.ctaButton}>
            Open Dashboard App
          </Link>
          <Link to="/contact" className={styles.ghostButton}>
            Request walkthrough
          </Link>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Why teams adopt Compliverse</h2>
        <div className={styles.grid3}>
          <article className={styles.infoCard}>
            <h3>One source of truth</h3>
            <p>Consolidate fragmented trackers into one governed process.</p>
          </article>
          <article className={styles.infoCard}>
            <h3>Faster execution</h3>
            <p>Focus attention on what is due next instead of manually triaging records.</p>
          </article>
          <article className={styles.infoCard}>
            <h3>Leadership confidence</h3>
            <p>Make compliance posture visible through clean, operational reporting.</p>
          </article>
        </div>
      </section>
    </>
  )
}
