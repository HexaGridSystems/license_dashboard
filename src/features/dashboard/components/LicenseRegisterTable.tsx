import { formatDisplayDate } from '../../../shared/utils/date'
import type { EnrichedLicense } from '../hooks/useDashboardState'
import styles from './DashboardPage.module.css'
import { cx } from './utils'

type LicenseRegisterTableProps = {
  licenses: EnrichedLicense[]
}

export function LicenseRegisterTable(props: LicenseRegisterTableProps) {
  const { licenses } = props

  return (
    <article className={cx(styles.card, styles.register)}>
      <div className={styles.sectionHead}>
        <h3>Licence Register</h3>
      </div>
      <p className={styles.sectionHelp}>
        Review complete license details and monitor renewal urgency across all hospitals.
      </p>
      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Licence Name</th>
              <th>Hospital</th>
              <th>Category</th>
              <th>Issue Date</th>
              <th>Expiry Date</th>
              <th>Countdown</th>
              <th>Alerts</th>
              <th>Urgency</th>
              <th>Owner</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {licenses.map((license) => (
              <tr
                key={license.id}
                className={
                  license.renewal.urgency === 'Overdue' || license.renewal.urgency === 'Critical'
                    ? styles.urgentRow
                    : ''
                }
              >
                <td>{license.licenceName}</td>
                <td>{license.hospitalName}</td>
                <td>{license.category}</td>
                <td>{formatDisplayDate(license.issueDate)}</td>
                <td>{formatDisplayDate(license.expiryDate)}</td>
                <td>{license.renewal.countdownLabel}</td>
                <td>
                  <div className={styles.alertChips}>
                    {license.renewal.reminder3Months ? (
                      <span className={cx(styles.badge, styles.alertChip)}>90D Alert</span>
                    ) : null}
                    {license.renewal.reminder15Days ? (
                      <span className={cx(styles.badge, styles.alertChip, styles.criticalChip)}>15D Alert</span>
                    ) : null}
                    {!license.renewal.reminder3Months && !license.renewal.reminder15Days ? (
                      <span className={styles.alertMuted}>None</span>
                    ) : null}
                  </div>
                </td>
                <td>
                  <span className={styles.badge} data-urgency={license.renewal.urgency}>
                    {license.renewal.urgency}
                  </span>
                </td>
                <td>{license.owner || '-'}</td>
                <td>
                  <span className={styles.badge} data-status={license.status}>
                    {license.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  )
}
