import type { CSSProperties } from 'react'
import { formatDisplayDate } from '../../../shared/utils/date'
import type { EnrichedLicense } from '../hooks/useDashboardState'
import styles from './DashboardPage.module.css'
import { buildStatusColorMap, normalizeStatusLabel } from './statusColors'

type LicenseRegisterTableProps = {
  licenses: EnrichedLicense[]
}

function toDocumentLink(value: string) {
  const raw = value.trim()
  if (!raw) {
    return null
  }

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`

  try {
    const parsed = new URL(withProtocol)
    if (!/^https?:$/i.test(parsed.protocol)) {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}

export function LicenseRegisterTable(props: LicenseRegisterTableProps) {
  const { licenses } = props
  const statusColorMap = buildStatusColorMap(licenses.map((license) => license.status))

  const getActionLabel = (status: EnrichedLicense['status']) => {
    if (status === 'Expired') {
      return 'Renew now'
    }

    if (status === 'Due Soon') {
      return 'Follow up'
    }

    return 'Monitor'
  }

  return (
    <article className={`${styles.card} ${styles.register}`}>
      <div className={styles.sectionHead}>
        <h3>Licence Register</h3>
      </div>
      <p className={styles.sectionHelp}>
        Track each hospital license lifecycle in one place.
      </p>
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
                  <td data-label="Remaining days">
                    {license.remainingDays ?? '-'}
                  </td>
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
                      if (!documentsValue) {
                        return '-'
                      }

                      const href = toDocumentLink(documentsValue)
                      if (!href) {
                        return <span className={styles.docText}>{documentsValue}</span>
                      }

                      return (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.docLink}
                        >
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
