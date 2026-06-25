import type { CSSProperties } from 'react'
import type { EnrichedLicense } from '../hooks/useDashboardState'
import styles from './DashboardPage.module.css'
import { getStatusColor, normalizeStatusLabel } from './statusColors'

type StatusDonutPanelProps = {
  licenses: EnrichedLicense[]
}

export function StatusDonutPanel(props: StatusDonutPanelProps) {
  const { licenses } = props

  const counts = new Map<string, number>()

  for (const license of licenses) {
    const status = normalizeStatusLabel(license.status.trim() || 'Not applicable')
    counts.set(status, (counts.get(status) ?? 0) + 1)
  }

  const knownStatusOrder = ['Active', 'Expiring Soon', 'Expired', 'One Time'] as const
  const presentStatuses = Array.from(counts.keys())
  const statusOrder = [
    ...knownStatusOrder.filter((status) => counts.has(status)),
    ...presentStatuses
      .filter((status) => !knownStatusOrder.includes(status as (typeof knownStatusOrder)[number]))
      .sort((left, right) => left.localeCompare(right)),
  ]

  const total = licenses.length
  const legendShareMap = new Map<string, number>()

  if (total > 0) {
    const shareParts = statusOrder.map((status, index) => {
      const value = counts.get(status) ?? 0
      const exactShare = (value / total) * 100
      const floorShare = Math.floor(exactShare)

      return {
        status,
        index,
        floorShare,
        remainder: exactShare - floorShare,
      }
    })

    const flooredTotal = shareParts.reduce((acc, part) => acc + part.floorShare, 0)
    let remaining = 100 - flooredTotal

    shareParts.sort((left, right) => {
      if (right.remainder !== left.remainder) {
        return right.remainder - left.remainder
      }

      return left.index - right.index
    })

    for (let index = 0; index < shareParts.length; index += 1) {
      const part = shareParts[index]
      const boost = remaining > 0 ? 1 : 0
      legendShareMap.set(part.status, part.floorShare + boost)
      if (boost === 1) {
        remaining -= 1
      }
    }
  }

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
        color: getStatusColor(status, statusOrder),
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
            const share = legendShareMap.get(status) ?? 0

            return (
              <li key={status}>
                <span
                  className={styles.statusDot}
                  style={{ '--status-color': getStatusColor(status, statusOrder) } as CSSProperties}
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