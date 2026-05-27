import styles from './DashboardPage.module.css'
import { cx } from './utils'
import type { LicenceStatus } from '../../../shared/types/domain'

type ControlsBarProps = {
  selectedStatus: LicenceStatus | 'All'
  onSelectStatus: (status: LicenceStatus | 'All') => void
  onExport: () => void
  onExportPdf: () => void
}

export function ControlsBar(props: ControlsBarProps) {
  const { selectedStatus, onSelectStatus, onExport, onExportPdf } = props

  return (
    <section className={cx(styles.controls, styles.card)}>
      <p className={styles.sectionHelp}>
        Filter by status, then export exactly the set currently visible in the register.
      </p>
      <div className={styles.segmented}>
        {(['All', 'Active', 'Expired', 'Due Soon'] as const).map((type) => (
          <button
            key={type}
            type="button"
            className={selectedStatus === type ? styles.active : ''}
            onClick={() => onSelectStatus(type)}
          >
            {type}
          </button>
        ))}
      </div>

      <div className={styles.actionBar}>
        <button
          type="button"
          className={cx(styles.ghost, styles.exportPdfButton)}
          onClick={onExportPdf}
        >
          Export PDF
        </button>
        <button
          type="button"
          className={cx(styles.ghost, styles.exportReportButton)}
          onClick={onExport}
        >
          Export Report
        </button>
      </div>
    </section>
  )
}
