import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { ThemeMode } from '../../../shared/types/domain'
import styles from './MarketingSite.module.css'

type MarketingLayoutProps = {
  themeMode: ThemeMode
  onToggleTheme: () => void
}

export function MarketingLayout(props: MarketingLayoutProps) {
  const { themeMode, onToggleTheme } = props
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const nextModeLabel = themeMode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 8)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const navClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? styles.navLinkActive : styles.navLink

  return (
    <div className={styles.shell}>
      <header className={styles.siteHeader}>
        <div className={isScrolled ? `${styles.navCard} ${styles.navCardScrolled}` : styles.navCard}>
          <div className={styles.brandBlock}>
            <p className={styles.brand}>Compliverse</p>
            <p className={styles.tagline}>Healthcare compliance company for hospitals.</p>
          </div>

          <button
            type="button"
            className={styles.menuToggle}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            <span className={styles.menuBar} />
            <span className={styles.menuBar} />
            <span className={styles.menuBar} />
          </button>

          <nav
            className={mobileMenuOpen ? `${styles.navLinks} ${styles.navLinksOpen}` : styles.navLinks}
            aria-label="Primary"
          >
            <NavLink
              to="/"
              end
              className={navClass}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </NavLink>
            <NavLink to="/about" className={navClass} onClick={() => setMobileMenuOpen(false)}>
              About
            </NavLink>
            <NavLink to="/product" className={navClass} onClick={() => setMobileMenuOpen(false)}>
              Product
            </NavLink>
            <NavLink to="/contact" className={navClass} onClick={() => setMobileMenuOpen(false)}>
              Contact
            </NavLink>
            <button
              type="button"
              className={`${styles.ghostButton} ${styles.themeIconButton}`}
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
            <NavLink to="/app" className={styles.ctaButton} onClick={() => setMobileMenuOpen(false)}>
              Open App
            </NavLink>
          </nav>
        </div>
      </header>

      <main className={styles.page}>
        <Outlet />
      </main>

      <footer className={styles.footerCard}>
        <div className={styles.footerRow}>
          <span>Compliverse</span>
          <span>Regulatory confidence for healthcare operators</span>
        </div>
        <div className={styles.miniBadgeRow}>
          <span className={styles.miniBadge}>Licensing</span>
          <span className={styles.miniBadge}>Renewals</span>
          <span className={styles.miniBadge}>Audit Readiness</span>
          <span className={styles.miniBadge}>Hospital Operations</span>
        </div>
      </footer>
    </div>
  )
}
