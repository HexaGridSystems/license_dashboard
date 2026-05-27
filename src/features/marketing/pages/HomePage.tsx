import { Link } from 'react-router-dom'
import styles from '../components/MarketingSite.module.css'

export function HomePage() {
  return (
    <>
      <section className={styles.hero}>
        <article className={styles.heroPanel}>
          <h1 className={styles.heroTitle}>Hospital compliance should feel like command, not chaos.</h1>
          <p className={styles.heroLead}>
            Compliverse gives healthcare operators one clear operating layer for licenses,
            renewals, and deadlines, so legal and admin teams can prevent risk before it escalates.
          </p>

          <div className={styles.buttonRow}>
            <Link to="/product" className={styles.ctaButton}>
              Explore Product
            </Link>
            <Link to="/contact" className={styles.ghostButton}>
              Speak to Team
            </Link>
          </div>
        </article>

        <aside className={styles.heroVisual}>
          <div className={styles.signalStrip}>
            <span className={styles.signalDot} />
            <span className={styles.signalDot} />
            <span className={styles.signalDot} />
          </div>
          <h3 className={styles.visualHeading}>Compliance visibility for every hospital unit</h3>

          <div className={styles.visualGrid}>
            <article className={styles.statCard}>
              <p className={styles.statLabel}>Renewal readiness</p>
              <p className={styles.statValue}>96%</p>
            </article>
            <article className={styles.statCard}>
              <p className={styles.statLabel}>Active trackers</p>
              <p className={styles.statValue}>240+</p>
            </article>
            <article className={styles.statCard}>
              <p className={styles.statLabel}>Risk alerts</p>
              <p className={styles.statValue}>Real-time</p>
            </article>
            <article className={styles.statCard}>
              <p className={styles.statLabel}>Audit response</p>
              <p className={styles.statValue}>Hours, not days</p>
            </article>
          </div>
        </aside>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Built for hospital legal and operations leaders</h2>
        <p className={styles.sectionLead}>
          From single-facility teams to multi-location groups, Compliverse standardizes how
          obligations are tracked and owned.
        </p>

        <div className={styles.grid3}>
          <article className={styles.infoCard}>
            <h3>Unified compliance register</h3>
            <p>Track licenses, permits, and statutory filings in one operational view.</p>
          </article>
          <article className={styles.infoCard}>
            <h3>Deadline intelligence</h3>
            <p>Move from reactive reminders to proactive renewal planning with urgency signals.</p>
          </article>
          <article className={styles.infoCard}>
            <h3>Execution transparency</h3>
            <p>Give leadership a clean line of sight into progress, blockers, and risk hotspots.</p>
          </article>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Operational outcomes you can trust</h2>
        <ul className={styles.list}>
          <li>Fewer last-minute renewals and escalations.</li>
          <li>Sharper accountability across legal, admin, and quality teams.</li>
          <li>Audit prep that starts from live system data, not spreadsheets in silos.</li>
        </ul>
      </section>
    </>
  )
}
