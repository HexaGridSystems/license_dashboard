import { useEffect, useRef, useState } from 'react'
import styles from './DashboardPage.module.css'
import type { ThemeMode } from '../../../shared/types/domain'
import { cx } from './utils'

type DashboardHeaderProps = {
  themeMode: ThemeMode
  lastSyncedAt: number | null
  onToggleTheme: () => void
  onLogout: () => void
}

export function DashboardHeader(props: DashboardHeaderProps) {
  const { themeMode, lastSyncedAt, onToggleTheme, onLogout } = props
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleOutsideClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [menuOpen])

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

  const nextModeLabel = themeMode === 'light' ? 'Dark mode' : 'Light mode'

  return (
    <header className={cx(styles.heroPanel, styles.card)}>
      <div className={styles.heroRow}>
        <div>
          <p className={styles.eyebrow}>Compliverse</p>
          <h1 className={styles.heroHospital}>Apollo Hospital, Sarjapur</h1>
          <p className={styles.heroSubtitle}>
            Regulatory intelligence dashboard — licence management, compliance monitoring, renewal tracking, and risk visibility.
          </p>
        </div>

        <div className={styles.profileMenu} ref={menuRef}>
          <button
            type="button"
            className={styles.profileTrigger}
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Account menu"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </button>

          {menuOpen && (
            <div className={styles.profileDropdown} role="menu">
              <p className={styles.profileSyncLine}>Last sync: {formattedLastSync}</p>
              <hr className={styles.profileDivider} />
              <button
                type="button"
                role="menuitem"
                className={styles.profileItem}
                onClick={() => { onToggleTheme(); setMenuOpen(false) }}
              >
                {themeMode === 'light' ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M14.7 3.7a8.5 8.5 0 1 0 5.6 15.1 9 9 0 1 1-5.6-15.1z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="4.3" />
                    <path d="M12 2.2v2.3M12 19.5v2.3M4.2 12h2.3M17.5 12h2.3M5.8 5.8l1.6 1.6M16.6 16.6l1.6 1.6M18.2 5.8l-1.6 1.6M7.4 16.6l-1.6 1.6" />
                  </svg>
                )}
                {nextModeLabel}
              </button>
              <hr className={styles.profileDivider} />
              <button
                type="button"
                role="menuitem"
                className={cx(styles.profileItem, styles.profileItemDanger)}
                onClick={() => { onLogout(); setMenuOpen(false) }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
