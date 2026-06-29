import { Link } from 'react-router-dom'
import styles from '../components/MarketingSite.module.css'

export function ProductPage() {
  return (
    <>
      <section className={styles.section}>
        <h1 className={styles.sectionTitle}>Product</h1>
        <p className={styles.sectionLead}>Explore the dashboard experience before you sign in.</p>

        <div className={styles.productSplit}>
          <article className={styles.productFrame}>
            <h3>Welcome to Compliverse Licence Dashboard</h3>
            <p>Designed for compliance operators in hospital environments.</p>
            <p>Central register for licenses, permits, and statutory submissions.</p>
            <p>Risk-oriented views based on expiry windows and urgency status.</p>
            <p>Export-ready snapshots for internal governance and audit readiness.</p>
          </article>

          <article className={styles.loginFrame}>
            <p className={styles.loginEyebrow}>Login</p>
            <h3>Access your compliance workspace</h3>
            <p>
              Sign in to manage records, monitor due dates, and export the latest report snapshots.
            </p>
            <div className={styles.buttonRow}>
              <Link to="/" className={styles.ctaButton}>
                Go to Login
              </Link>
              <Link to="/contact" className={styles.ghostButton}>
                Need access help?
              </Link>
            </div>
          </article>
        </div>
      </section>
    </>
  )
}
