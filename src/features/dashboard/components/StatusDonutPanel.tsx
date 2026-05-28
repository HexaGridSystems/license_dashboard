import type { CSSProperties } from 'react'
import type { EnrichedLicense } from '../hooks/useDashboardState'
import styles from './DashboardPage.module.css'
import { buildStatusColorMap, buildStatusOrder, normalizeStatusLabel } from './statusColors'

type StatusDonutPanelProps = {
  licenses: EnrichedLicense[]
}

export function StatusDonutPanel(props: StatusDonutPanelProps) {
  const { licenses } = props

  const counts = new Map<string, number>()

  for (const license of licenses) {
    const status = normalizeStatusLabel(license.status)
    counts.set(status, (counts.get(status) ?? 0) + 1)
  }

  const statusOrder = buildStatusOrder(Array.from(counts.keys()))
  const statusColorMap = buildStatusColorMap(statusOrder)

  const total = licenses.length
  const radius = 46
  const circumference = 2 * Math.PI * radius
  let offset = 0
  const donutSegments = statusOrder
    .map((status) => {
      const value = counts.get(status) ?? 0
      if (!total || value === 0) {
        return null
      }

      const length = (value / total) * circumference
      const segment = {
        status,
        color: statusColorMap[status],
        dashArray: `${length} ${circumference - length}`,
        dashOffset: -offset,
      }

      offset += length
      return segment
    })
    .filter((segment): segment is NonNullable<typeof segment> => segment !== null)

  return (
    <article className={`${styles.card} ${styles.statusPanel}`}>
      <div className={styles.sectionHead}>
        <h3>Status Breakdown</h3>
      </div>

      <div className={styles.donutLayout}>
        <div className={styles.donutChart}>
          <svg viewBox="0 0 120 120" className={styles.donutSvg} aria-hidden="true" focusable="false">
            <circle className={styles.donutTrack} cx="60" cy="60" r={radius} />
            <g transform="rotate(-90 60 60)">
              {donutSegments.map((segment) => (
                <circle
                  key={segment.status}
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="28"
                  strokeLinecap="butt"
                  strokeDasharray={segment.dashArray}
                  strokeDashoffset={segment.dashOffset}
                />
              ))}
            </g>
          </svg>
          <div className={styles.donutHole}>
            <strong>{total}</strong>
            <span>Total</span>
          </div>
        </div>

        <ul className={styles.statusLegend}>
          {statusOrder.map((status) => {
            const value = counts.get(status) ?? 0
            const share = total > 0 ? Math.round((value / total) * 100) : 0

            return (
              <li key={status}>
                <span
                  className={styles.statusDot}
                  style={{ '--status-color': statusColorMap[status] } as CSSProperties}
                />
                <span className={styles.statusLabel}>{status}</span>
                <strong>{value}</strong>
                <small>{share}%</small>
              </li>
            )
          })}
        </ul>
      </div>
    </article>
  )
}