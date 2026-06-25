import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { formatDisplayDate } from '../../../shared/utils/date'
import type { EnrichedLicense } from '../hooks/useDashboardState'
import type { LicenceStatus } from '../../../shared/types/domain'
import styles from './DashboardPage.module.css'
import { buildStatusColorMap, normalizeStatusLabel } from './statusColors'

type LicenseRegisterTableProps = {
  licenses: EnrichedLicense[]
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  selectedStatus: LicenceStatus | 'All'
  statusOptions: (LicenceStatus | 'All')[]
  onSelectStatus: (status: LicenceStatus | 'All') => void
  onClearFilters: () => void
  onExport: () => void
  onExportPdf: () => void
}

function toDocumentLink(value: string) {
  const raw = value.trim()
  if (!raw) return null

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    const parsed = new URL(withProtocol)
    if (!/^https?:$/i.test(parsed.protocol)) return null
    return parsed.toString()
  } catch {
    return null
  }
}

function ExportDropdown(props: { onExport: () => void; onExportPdf: () => void }) {
  const { onExport, onExportPdf } = props
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className={styles.exportDropdown} ref={ref}>
      <button
        type="button"
        className={styles.ghost}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Export
        <svg className={styles.exportChevron} viewBox="0 0 10 6" aria-hidden="true">
          <path d="M1 1l4 4 4-4" />
        </svg>
      </button>
      {open && (
        <ul className={styles.exportMenu} role="menu">
          <li role="none">
            <button type="button" role="menuitem" onClick={() => { onExportPdf(); setOpen(false) }}>
              Export as PDF
            </button>
          </li>
          <li role="none">
            <button type="button" role="menuitem" onClick={() => { onExport(); setOpen(false) }}>
              Export as Excel
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}

export function LicenseRegisterTable(props: LicenseRegisterTableProps) {
  const {
    licenses,
    searchQuery,
    onSearchQueryChange,
    selectedStatus,
    statusOptions,
    onSelectStatus,
    onClearFilters,
    onExport,
    onExportPdf,
  } = props

  const statusColorMap = buildStatusColorMap(licenses.map((license) => license.status))
  const hasActiveFilter = searchQuery !== '' || selectedStatus !== 'All'

  const getActionLabel = (status: EnrichedLicense['status']) => {
    if (status === 'Expired') return 'Renew now'
    if (status === 'Due Soon') return 'Follow up'
    return 'Monitor'
  }

  return (
    <article className={`${styles.card} ${styles.register}`}>
      <div className={styles.sectionHead}>
        <h3>Licence Register</h3>
        <ExportDropdown onExport={onExport} onExportPdf={onExportPdf} />
      </div>

      <div className={styles.tableFilterRow}>
        <div className={styles.tableSearchWrap}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M16.5 16.5l4 4" />
          </svg>
          <input
            type="search"
            className={styles.tableSearchInput}
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search by name, number, category..."
          />
        </div>
        <select
          className={styles.tableStatusSelect}
          value={selectedStatus}
          onChange={(e) => onSelectStatus(e.target.value as LicenceStatus | 'All')}
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        {hasActiveFilter && (
          <button type="button" className={styles.ghost} onClick={onClearFilters}>
            Clear
          </button>
        )}
      </div>

      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Serial Number</th>
              <th>License/Vendor name</th>
              <th>Category</th>
              <th>Licence Number</th>
              <th>Valid from</th>
              <th>Valid till</th>
              <th>Remaining days</th>
              <th>Status</th>
              <th>Action</th>
              <th>Documents</th>
            </tr>
          </thead>
          <tbody>
            {licenses.map((license, index) => {
              const statusLabel = normalizeStatusLabel(license.status)
              const licenseNumber = license.licenceNumber?.trim() ?? ''

              return (
                <tr
                  key={license.id}
                  className={
                    license.renewal.urgency === 'Overdue' || license.renewal.urgency === 'Critical'
                      ? styles.urgentRow
                      : ''
                  }
                >
                  <td data-label="Serial Number">{index + 1}</td>
                  <td data-label="License/Vendor name">{license.licenceName}</td>
                  <td data-label="Category">{license.category}</td>
                  <td data-label="Licence Number">{licenseNumber}</td>
                  <td data-label="Valid from">{formatDisplayDate(license.issueDate)}</td>
                  <td data-label="Valid till">{formatDisplayDate(license.expiryDate)}</td>
                  <td data-label="Remaining days">{license.remainingDays ?? '-'}</td>
                  <td data-label="Status">
                    <span
                      className={`${styles.badge} ${styles.dynamicStatus}`}
                      data-status={statusLabel}
                      style={{ '--status-color': statusColorMap[statusLabel] } as CSSProperties}
                    >
                      {statusLabel}
                    </span>
                  </td>
                  <td data-label="Action">{license.action || getActionLabel(license.status)}</td>
                  <td data-label="Documents">
                    {(() => {
                      const documentsValue = license.documents?.trim() || ''
                      if (!documentsValue) return '-'
                      const href = toDocumentLink(documentsValue)
                      if (!href) return <span className={styles.docText}>{documentsValue}</span>
                      return (
                        <a href={href} target="_blank" rel="noopener noreferrer" className={styles.docLink}>
                          Click to open
                        </a>
                      )
                    })()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </article>
  )
}
