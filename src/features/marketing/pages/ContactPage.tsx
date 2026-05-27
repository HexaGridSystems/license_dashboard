import styles from '../components/MarketingSite.module.css'

export function ContactPage() {
  return (
    <>
      <section className={styles.section}>
        <h1 className={styles.sectionTitle}>Contact Compliverse</h1>
        <p className={styles.sectionLead}>
          Share your current compliance process and where your teams face the most friction. We
          will help you design a practical rollout path.
        </p>

        <div className={styles.contactCard}>
          <strong>Start a conversation</strong>
          <p>
            Include your name, organization, and whether you are evaluating for a single hospital
            or multiple facilities.
          </p>
          <a
            href="mailto:hello@compliverse.com?subject=Compliverse%20Hospital%20Compliance%20Inquiry"
            className={styles.contactButton}
          >
            hello@compliverse.com
          </a>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What to include in your message</h2>
        <ul className={styles.list}>
          <li>Approximate number of active licenses and permits your team manages.</li>
          <li>Current tooling setup and reporting cadence.</li>
          <li>Priority outcomes expected in the next 3 to 6 months.</li>
        </ul>
      </section>
    </>
  )
}
