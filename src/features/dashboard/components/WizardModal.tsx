import type { LicenseFieldErrors, WizardLicenseDraft } from '../../../shared/types/domain'
import styles from './DashboardPage.module.css'
import { cx } from './utils'

type WizardModalProps = {
  wizardStep: 1 | 2
  hospitalDraft: {
    name: string
    address: string
    contactPerson: string
    complianceOwner: string
  }
  hospitalErrors: { name: string }
  wizardLicenses: WizardLicenseDraft[]
  wizardLicenseErrors: Record<string, LicenseFieldErrors>
  isSyncing: boolean
  onClose: () => void
  onHospitalDraftChange: (
    updater: (prev: {
      name: string
      address: string
      contactPerson: string
      complianceOwner: string
    }) => {
      name: string
      address: string
      contactPerson: string
      complianceOwner: string
    },
  ) => void
  onSetWizardStep: (step: 1 | 2) => void
  onNext: () => void
  onSave: () => void
  onAddLicense: () => void
  onUpdateWizardLicense: (
    tempId: string,
    field: keyof Omit<WizardLicenseDraft, 'tempId'>,
    value: string,
  ) => void
  onRemoveWizardLicense: (tempId: string) => void
}

export function WizardModal(props: WizardModalProps) {
  const {
    wizardStep,
    hospitalDraft,
    hospitalErrors,
    wizardLicenses,
    wizardLicenseErrors,
    isSyncing,
    onClose,
    onHospitalDraftChange,
    onSetWizardStep,
    onNext,
    onSave,
    onAddLicense,
    onUpdateWizardLicense,
    onRemoveWizardLicense,
  } = props

  return (
    <div className={styles.modalOverlay} role="presentation" onClick={onClose}>
      <div className={cx(styles.modalCard, styles.wizardCard)} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className={cx(styles.sectionHead, styles.compact)}>
          <h3>Create Hospital Setup</h3>
          <span className={styles.wizardStep}>Step {wizardStep} of 2</span>
        </div>

        {wizardStep === 1 ? (
          <div className={styles.modalGrid}>
            <label>
              Hospital Name
              <input
                type="text"
                value={hospitalDraft.name}
                onChange={(event) =>
                  onHospitalDraftChange((prev) => ({ ...prev, name: event.target.value }))
                }
              />
              {hospitalErrors.name ? <small className={styles.inputError}>{hospitalErrors.name}</small> : null}
            </label>
            <label>
              Address
              <input
                type="text"
                value={hospitalDraft.address}
                onChange={(event) =>
                  onHospitalDraftChange((prev) => ({ ...prev, address: event.target.value }))
                }
              />
            </label>
            <label>
              Contact Person
              <input
                type="text"
                value={hospitalDraft.contactPerson}
                onChange={(event) =>
                  onHospitalDraftChange((prev) => ({ ...prev, contactPerson: event.target.value }))
                }
              />
            </label>
            <label>
              Compliance Owner
              <input
                type="text"
                value={hospitalDraft.complianceOwner}
                onChange={(event) =>
                  onHospitalDraftChange((prev) => ({ ...prev, complianceOwner: event.target.value }))
                }
              />
            </label>
          </div>
        ) : (
          <div className={styles.wizardLicenses}>
            {wizardLicenses.map((draft) => {
              const errors = wizardLicenseErrors[draft.tempId] ?? {
                licenceName: '',
                category: '',
                expiryDate: '',
              }
              return (
                <article key={draft.tempId} className={styles.wizardLicenseCard}>
                  <div className={cx(styles.sectionHead, styles.compact)}>
                    <h3>License Details</h3>
                    <button type="button" className={styles.ghost} onClick={() => onRemoveWizardLicense(draft.tempId)}>
                      Remove
                    </button>
                  </div>

                  <div className={styles.modalGrid}>
                    <label>
                      Licence Name
                      <input
                        type="text"
                        value={draft.licenceName}
                        onChange={(event) => onUpdateWizardLicense(draft.tempId, 'licenceName', event.target.value)}
                      />
                      {errors.licenceName ? <small className={styles.inputError}>{errors.licenceName}</small> : null}
                    </label>
                    <label>
                      Category
                      <select
                        value={draft.category}
                        onChange={(event) => onUpdateWizardLicense(draft.tempId, 'category', event.target.value)}
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
                        onChange={(event) => onUpdateWizardLicense(draft.tempId, 'issueDate', event.target.value)}
                      />
                    </label>
                    <label>
                      Expiry Date
                      <input
                        type="date"
                        value={draft.expiryDate}
                        onChange={(event) => onUpdateWizardLicense(draft.tempId, 'expiryDate', event.target.value)}
                      />
                      {errors.expiryDate ? <small className={styles.inputError}>{errors.expiryDate}</small> : null}
                    </label>
                    <label>
                      Owner
                      <input
                        type="text"
                        value={draft.owner}
                        onChange={(event) => onUpdateWizardLicense(draft.tempId, 'owner', event.target.value)}
                      />
                    </label>
                    <label>
                      Regulator
                      <input
                        type="text"
                        value={draft.regulator}
                        onChange={(event) => onUpdateWizardLicense(draft.tempId, 'regulator', event.target.value)}
                      />
                    </label>
                  </div>
                </article>
              )
            })}

            <button type="button" className={styles.addLicenseRow} onClick={onAddLicense} disabled={isSyncing}>
              + Add another license
            </button>
          </div>
        )}

        <div className={cx(styles.rowActions, styles.modalActions)}>
          {wizardStep === 2 ? (
            <button type="button" className={styles.ghost} onClick={() => onSetWizardStep(1)}>
              Back
            </button>
          ) : null}
          {wizardStep === 1 ? (
            <button type="button" className={styles.primaryAction} onClick={onNext} disabled={isSyncing}>
              Continue
            </button>
          ) : (
            <button type="button" className={styles.primaryAction} onClick={onSave} disabled={isSyncing}>
              {isSyncing ? 'Saving...' : 'Create Hospital and Licenses'}
            </button>
          )}
          <button type="button" className={styles.ghost} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
