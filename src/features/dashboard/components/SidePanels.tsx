import { formatDisplayDate } from '../../../shared/utils/date'
import type { EnrichedLicense } from '../hooks/useDashboardState'
import styles from './DashboardPage.module.css'
import { cx } from './utils'

type SidePanelsProps = {
  actionQueue: EnrichedLicense[]
  upcomingMilestones: EnrichedLicense[]
}

export function SidePanels(props: SidePanelsProps) {
  const { actionQueue, upcomingMilestones } = props

  return (
    <div className={styles.stackedPanels}>
      <article className={styles.card}>
        <div className={cx(styles.sectionHead, styles.compact)}>
          <h3>Immediate Action Queue</h3>
        </div>
        <p className={styles.sectionHelp}>Top licenses requiring immediate legal or compliance action.</p>
        <ul className={styles.actionList}>
          {actionQueue.map((item) => (
            <li key={item.id}>
              <span>{item.licenceName} - {item.hospitalName}</span>
              <small>{formatDisplayDate(item.expiryDate)}</small>
              <strong className={item.renewal.urgency === 'Overdue' ? styles.danger : ''}>
                {item.renewal.countdownLabel}
              </strong>
            </li>
          ))}
        </ul>
      </article>

      <article className={styles.card}>
        <div className={cx(styles.sectionHead, styles.compact)}>
          <h3>Renewal Milestones</h3>
        </div>
        <p className={styles.sectionHelp}>Upcoming expiries sorted by nearest due date.</p>
        <ul className={styles.timeline}>
          {upcomingMilestones.map((item) => (
            <li key={item.id}>
              <span>{item.licenceName}</span>
              <small>{formatDisplayDate(item.expiryDate)} ({item.renewal.countdownLabel})</small>
            </li>
          ))}
        </ul>
      </article>
    </div>
  )
}
