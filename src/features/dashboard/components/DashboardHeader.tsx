import styles from './DashboardPage.module.css'
import type { ThemeMode } from '../../../shared/types/domain'
import { cx } from './utils'

type DashboardHeaderProps = {
  themeMode: ThemeMode
  totalHospitals: number
  totalLicenses: number
  criticalCount: number
  onToggleTheme: () => void
  onLogout: () => void
  onOpenWizard: () => void
}

export function DashboardHeader(props: DashboardHeaderProps) {
  const {
    themeMode,
    totalHospitals,
    totalLicenses,
    criticalCount,
    onToggleTheme,
    onLogout,
    onOpenWizard,
  } = props

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
          <div className={styles.reportPill}>Last sync: 23 May 2026 · 09:30 AM</div>
          <button type="button" className={styles.themeToggle} onClick={onToggleTheme}>
            {themeMode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          </button>
          <button type="button" className={styles.ghost} onClick={onLogout}>
            Logout
          </button>
          <button type="button" className={styles.primaryAction} onClick={onOpenWizard}>
            + Create Hospital Setup
          </button>
        </div>
      </div>
    </header>
  )
}
