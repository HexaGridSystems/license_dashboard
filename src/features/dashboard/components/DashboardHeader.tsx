import styles from './DashboardPage.module.css'
import type { ThemeMode } from '../../../shared/types/domain'
import { cx } from './utils'

type DashboardHeaderProps = {
  themeMode: ThemeMode
  totalHospitals: number
  totalLicenses: number
  criticalCount: number
  lastSyncedAt: number | null
  onToggleTheme: () => void
  onLogout: () => void
}

export function DashboardHeader(props: DashboardHeaderProps) {
  const {
    themeMode,
    totalHospitals,
    totalLicenses,
    criticalCount,
    lastSyncedAt,
    onToggleTheme,
    onLogout,
  } = props

  const nextModeLabel = themeMode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'
  const formattedLastSync = lastSyncedAt
    ? `${new Date(lastSyncedAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })} · ${new Date(lastSyncedAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })}`
    : 'Not synced yet'

  return (
    <header className={cx(styles.heroPanel, styles.card)}>
      <p className={styles.eyebrow}>Hospital Legal Operations</p>
      <div className={styles.heroRow}>
        <div>
          <h1>Legal Licence Dashboard</h1>
          <p className={styles.heroSubtitle}>
            Create hospitals first, then manage all license details, reminders,
            renewals, and urgency from one register.
          </p>
          <div className={styles.heroKpis}>
            <span>Total Hospitals: {totalHospitals}</span>
            <span>Total Licenses: {totalLicenses}</span>
            <span>Urgent Now: {criticalCount}</span>
          </div>
        </div>
        <div className={styles.heroActions}>
          <div className={styles.reportPill}>Last sync: {formattedLastSync}</div>
          <button
            type="button"
            className={styles.themeToggle}
            onClick={onToggleTheme}
            aria-label={nextModeLabel}
            title={nextModeLabel}
          >
            <span className={styles.srOnly}>{nextModeLabel}</span>
            {themeMode === 'light' ? (
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M14.7 3.7a8.5 8.5 0 1 0 5.6 15.1 9 9 0 1 1-5.6-15.1z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <circle cx="12" cy="12" r="4.3" />
                <path d="M12 2.2v2.3M12 19.5v2.3M4.2 12h2.3M17.5 12h2.3M5.8 5.8l1.6 1.6M16.6 16.6l1.6 1.6M18.2 5.8l-1.6 1.6M7.4 16.6l-1.6 1.6" />
              </svg>
            )}
          </button>
          <button type="button" className={styles.ghost} onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
