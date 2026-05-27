import styles from '../components/MarketingSite.module.css'

export function AboutPage() {
  return (
    <>
      <section className={styles.section}>
        <h1 className={styles.sectionTitle}>About Compliverse</h1>
        <p className={styles.sectionLead}>
          Compliverse is a healthcare compliance company focused on hospitals. We help legal and
          operations teams move from fragmented follow-ups to a reliable compliance operating
          system.
        </p>

        <ul className={styles.list}>
          <li>Domain focus on hospital licensing, renewals, and statutory obligations.</li>
          <li>Built for teams that need governance discipline without workflow friction.</li>
          <li>Designed to create consistency across facilities and departments.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What we stand for</h2>
        <div className={styles.grid3}>
          <article className={styles.infoCard}>
            <h3>Mission</h3>
            <p>Turn regulatory readiness into a daily operating capability for hospitals.</p>
          </article>
          <article className={styles.infoCard}>
            <h3>Method</h3>
            <p>Blend structured product workflows with the systems teams already understand.</p>
          </article>
          <article className={styles.infoCard}>
            <h3>Impact</h3>
            <p>Reduce compliance surprises while improving leadership visibility and ownership.</p>
          </article>
        </div>
      </section>
    </>
  )
}
