import type { Hospital, LicenseDraft, LicenseFieldErrors, LicenceCategory, LicenceStatus } from '../../../shared/types/domain'
import styles from './DashboardPage.module.css'
import { cx } from './utils'

type LicenseModalProps = {
  hospitals: Hospital[]
  draft: LicenseDraft
  errors: LicenseFieldErrors
  isSyncing: boolean
  onClose: () => void
  onSave: () => void
  onDraftChange: (updater: (prev: LicenseDraft) => LicenseDraft) => void
}

export function LicenseModal(props: LicenseModalProps) {
  const { hospitals, draft, errors, isSyncing, onClose, onSave, onDraftChange } = props

  return (
    <div className={styles.modalOverlay} role="presentation" onClick={onClose}>
      <div className={styles.modalCard} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className={cx(styles.sectionHead, styles.compact)}>
          <h3>Add License</h3>
        </div>

        <div className={styles.modalGrid}>
          <label>
            Hospital
            <select
              value={draft.hospitalId}
              onChange={(event) =>
                onDraftChange((prev) => ({ ...prev, hospitalId: event.target.value }))
              }
            >
              {hospitals.map((hospital) => (
                <option key={hospital.id} value={hospital.id}>
                  {hospital.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Licence Name
            <input
              type="text"
              value={draft.licenceName}
              onChange={(event) =>
                onDraftChange((prev) => ({ ...prev, licenceName: event.target.value }))
              }
            />
            {errors.licenceName ? <small className={styles.inputError}>{errors.licenceName}</small> : null}
          </label>
          <label>
            Category
            <select
              value={draft.category}
              onChange={(event) =>
                onDraftChange((prev) => ({
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
            {errors.category ? <small className={styles.inputError}>{errors.category}</small> : null}
          </label>
          <label>
            Issue Date
            <input
              type="date"
              value={draft.issueDate}
              onChange={(event) =>
                onDraftChange((prev) => ({ ...prev, issueDate: event.target.value }))
              }
            />
          </label>
          <label>
            Expiry Date
            <input
              type="date"
              value={draft.expiryDate}
              onChange={(event) =>
                onDraftChange((prev) => ({ ...prev, expiryDate: event.target.value }))
              }
            />
            {errors.expiryDate ? <small className={styles.inputError}>{errors.expiryDate}</small> : null}
          </label>
          <label>
            Owner
            <input
              type="text"
              value={draft.owner}
              onChange={(event) =>
                onDraftChange((prev) => ({ ...prev, owner: event.target.value }))
              }
            />
          </label>
          <label>
            Regulator
            <input
              type="text"
              value={draft.regulator}
              onChange={(event) =>
                onDraftChange((prev) => ({ ...prev, regulator: event.target.value }))
              }
            />
          </label>
          <label>
            Status
            <select
              value={draft.status}
              onChange={(event) =>
                onDraftChange((prev) => ({
                  ...prev,
                  status: event.target.value as LicenceStatus,
                }))
              }
            >
              <option value="Active">Active</option>
              <option value="Due Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
            </select>
          </label>
        </div>

        <div className={cx(styles.rowActions, styles.modalActions)}>
          <button type="button" className={styles.primaryAction} onClick={onSave} disabled={isSyncing}>
            {isSyncing ? 'Saving...' : 'Save'}
          </button>
          <button type="button" className={styles.ghost} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
