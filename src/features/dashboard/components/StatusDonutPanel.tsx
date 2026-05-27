import type { CSSProperties } from 'react'
import type { EnrichedLicense } from '../hooks/useDashboardState'
import styles from './DashboardPage.module.css'

type StatusDonutPanelProps = {
  licenses: EnrichedLicense[]
}

type StatusKey = EnrichedLicense['status']

const statusOrder: StatusKey[] = ['Active', 'Due Soon', 'Expired']

const statusColors: Record<StatusKey, string> = {
  Active: '#1d7a58',
  'Due Soon': '#c17f0f',
  Expired: '#9f3b2d',
}

export function StatusDonutPanel(props: StatusDonutPanelProps) {
  const { licenses } = props

  const counts = statusOrder.reduce<Record<StatusKey, number>>(
    (acc, status) => {
      acc[status] = 0
      return acc
    },
    {
      Active: 0,
      'Due Soon': 0,
      Expired: 0,
    },
  )

  for (const license of licenses) {
    counts[license.status] += 1
  }

  const total = licenses.length
  const radius = 46
  const circumference = 2 * Math.PI * radius
  let offset = 0
  const donutSegments = statusOrder
    .map((status) => {
      const value = counts[status]
      if (!total || value === 0) {
        return null
      }

      const length = (value / total) * circumference
      const segment = {
        status,
        color: statusColors[status],
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
            const value = counts[status]
            const share = total > 0 ? Math.round((value / total) * 100) : 0

            return (
              <li key={status}>
                <span
                  className={styles.statusDot}
                  style={{ '--status-color': statusColors[status] } as CSSProperties}
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