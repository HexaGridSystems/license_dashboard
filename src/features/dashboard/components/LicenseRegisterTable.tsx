import { formatDisplayDate } from '../../../shared/utils/date'
import type { InlineDraft, LicenceCategory, LicenceStatus } from '../../../shared/types/domain'
import type { EnrichedLicense } from '../hooks/useDashboardState'
import styles from './DashboardPage.module.css'
import { cx } from './utils'

type LicenseRegisterTableProps = {
  licenses: EnrichedLicense[]
  inlineEditId: string | null
  inlineDraft: InlineDraft
  inlineErrors: { owner: string; expiryDate: string }
  onInlineDraftChange: (updater: (prev: InlineDraft) => InlineDraft) => void
  onStartInlineEdit: (license: EnrichedLicense) => void
  onSaveInlineEdit: () => void
  onCancelInlineEdit: () => void
  onOpenEditModal: (license: EnrichedLicense) => void
}

export function LicenseRegisterTable(props: LicenseRegisterTableProps) {
  const {
    licenses,
    inlineEditId,
    inlineDraft,
    inlineErrors,
    onInlineDraftChange,
    onStartInlineEdit,
    onSaveInlineEdit,
    onCancelInlineEdit,
    onOpenEditModal,
  } = props

  return (
    <article className={cx(styles.card, styles.register)}>
      <div className={styles.sectionHead}>
        <h3>Licence Register</h3>
      </div>
      <p className={styles.sectionHelp}>
        Review complete license details and update quickly inline when dates or ownership change.
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
              <th>Actions</th>
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
                <td>
                  {inlineEditId === license.id ? (
                    <select
                      value={inlineDraft.category}
                      onChange={(event) =>
                        onInlineDraftChange((prev) => ({
                          ...prev,
                          category: event.target.value as LicenceCategory,
                        }))
                      }
                    >
                      <option value="Licence">Licence</option>
                      <option value="Renewal">Renewal</option>
                      <option value="Permit">Permit</option>
                      <option value="Statutory Filing">Statutory Filing</option>
                      <option value="Legal Certificate">Legal Certificate</option>
                    </select>
                  ) : (
                    license.category
                  )}
                </td>
                <td>{formatDisplayDate(license.issueDate)}</td>
                <td>
                  {inlineEditId === license.id ? (
                    <div>
                      <input
                        type="date"
                        value={inlineDraft.expiryDate}
                        onChange={(event) =>
                          onInlineDraftChange((prev) => ({
                            ...prev,
                            expiryDate: event.target.value,
                          }))
                        }
                      />
                      {inlineErrors.expiryDate ? (
                        <small className={styles.inputError}>{inlineErrors.expiryDate}</small>
                      ) : null}
                    </div>
                  ) : (
                    formatDisplayDate(license.expiryDate)
                  )}
                </td>
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
                <td>
                  {inlineEditId === license.id ? (
                    <div>
                      <input
                        type="text"
                        value={inlineDraft.owner}
                        onChange={(event) =>
                          onInlineDraftChange((prev) => ({
                            ...prev,
                            owner: event.target.value,
                          }))
                        }
                      />
                      {inlineErrors.owner ? (
                        <small className={styles.inputError}>{inlineErrors.owner}</small>
                      ) : null}
                    </div>
                  ) : (
                    license.owner || '-'
                  )}
                </td>
                <td>
                  {inlineEditId === license.id ? (
                    <select
                      value={inlineDraft.status}
                      onChange={(event) =>
                        onInlineDraftChange((prev) => ({
                          ...prev,
                          status: event.target.value as LicenceStatus,
                        }))
                      }
                    >
                      <option value="Due Soon">Due Soon</option>
                      <option value="In Review">In Review</option>
                      <option value="Compliant">Compliant</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  ) : (
                    <span className={styles.badge} data-status={license.status}>
                      {license.status}
                    </span>
                  )}
                </td>
                <td>
                  <div className={styles.rowActions}>
                    {inlineEditId === license.id ? (
                      <>
                        <button type="button" className={styles.primaryAction} onClick={onSaveInlineEdit}>
                          Save
                        </button>
                        <button type="button" className={styles.ghost} onClick={onCancelInlineEdit}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={styles.secondaryAction}
                          onClick={() => onStartInlineEdit(license)}
                        >
                          Edit Inline
                        </button>
                        <button
                          type="button"
                          className={styles.ghost}
                          onClick={() => onOpenEditModal(license)}
                        >
                          Edit Details
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  )
}
