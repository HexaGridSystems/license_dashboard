import styles from './DashboardPage.module.css'
import { formatDisplayDate } from '../../../shared/utils/date'
import type { EnrichedLicense } from '../hooks/useDashboardState'
import { cx } from './utils'

type QuickActionsPanelProps = {
  queueItems: EnrichedLicense[]
  totalLicenses: number
  expiredLicensesCount: number
  dueSoonLicensesCount: number
  onExportReport: () => void
  onExportPdf: () => void
}

export function QuickActionsPanel(props: QuickActionsPanelProps) {
  const {
    queueItems,
    totalLicenses,
    expiredLicensesCount,
    dueSoonLicensesCount,
    onExportReport,
    onExportPdf,
  } = props

  return (
    <aside className={cx(styles.card, styles.quickActionsPanel)} aria-label="Immediate action queue">
      <div className={styles.quickActionsHeader}>
        <h3>Immediate Action Queue</h3>
        <p>Most urgent licenses that need legal or compliance action now.</p>
      </div>

      <ul className={cx(styles.actionList, styles.quickQueueList)}>
        {queueItems.length > 0 ? (
          queueItems.map((item) => (
            <li key={item.id}>
              <span>{item.licenceName} - {item.hospitalName}</span>
              <small>
                {formatDisplayDate(item.expiryDate)} ({item.renewal.countdownLabel})
              </small>
              <strong className={item.renewal.urgency === 'Overdue' ? styles.danger : ''}>
                {item.status}
              </strong>
            </li>
          ))
        ) : (
          <li>
            <span>No immediate actions found.</span>
            <small>Try broadening filters to view more items.</small>
          </li>
        )}
      </ul>

      <p className={styles.sectionHelp}>Queue actions</p>
      <div className={styles.quickActionsButtons}>
        <button type="button" className={styles.quickGhostButton} onClick={onExportPdf}>
          Export PDF
        </button>
        <button type="button" className={styles.quickGhostButton} onClick={onExportReport}>
          Export report
        </button>
      </div>

      <dl className={styles.quickStatsList}>
        <div>
          <dt>Total</dt>
          <dd>{totalLicenses}</dd>
        </div>
        <div>
          <dt>Due soon</dt>
          <dd>{dueSoonLicensesCount}</dd>
        </div>
        <div>
          <dt>Expired</dt>
          <dd>{expiredLicensesCount}</dd>
        </div>
      </dl>
    </aside>
  )
}