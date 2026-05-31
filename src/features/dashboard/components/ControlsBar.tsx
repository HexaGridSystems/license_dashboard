import styles from './DashboardPage.module.css'
import { cx } from './utils'
import type { LicenceStatus } from '../../../shared/types/domain'

type ControlsBarProps = {
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  licenceNameQuery: string
  onLicenceNameQueryChange: (value: string) => void
  licenceNumberQuery: string
  onLicenceNumberQueryChange: (value: string) => void
  selectedStatus: LicenceStatus | 'All'
  statusOptions: (LicenceStatus | 'All')[]
  onSelectStatus: (status: LicenceStatus | 'All') => void
  onClearFilters: () => void
  onExport: () => void
  onExportPdf: () => void
}

export function ControlsBar(props: ControlsBarProps) {
  const {
    searchQuery,
    onSearchQueryChange,
    licenceNameQuery,
    onLicenceNameQueryChange,
    licenceNumberQuery,
    onLicenceNumberQueryChange,
    selectedStatus,
    statusOptions,
    onSelectStatus,
    onClearFilters,
    onExport,
    onExportPdf,
  } = props

  return (
    <section className={cx(styles.controls, styles.card)}>
      <p className={styles.sectionHelp}>
        Filter the register by search text, licence name, and status before export.
      </p>
      <div className={styles.filterGrid}>
        <label className={styles.filterField}>
          <span>Search</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Search by id, owner, category..."
          />
        </label>

        <label className={styles.filterField}>
          <span>License/Vendor name</span>
          <input
            type="text"
            value={licenceNameQuery}
            onChange={(event) => onLicenceNameQueryChange(event.target.value)}
            placeholder="Filter by license/vendor name"
          />
        </label>

        <label className={styles.filterField}>
          <span>Licence Number</span>
          <input
            type="text"
            value={licenceNumberQuery}
            onChange={(event) => onLicenceNumberQueryChange(event.target.value)}
            placeholder="Filter by licence number"
          />
        </label>

        <div className={styles.filterField}>
          <span>Status</span>
          <div className={styles.statusRow}>
            <select
              value={selectedStatus}
              onChange={(event) => onSelectStatus(event.target.value as LicenceStatus | 'All')}
            >
              {statusOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={styles.ghost}
              onClick={onClearFilters}
            >
              Clear
            </button>
          </div>
        </div>
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
