import { type FormEvent, useState } from 'react'
import styles from './LoginPage.module.css'
import type { ThemeMode } from '../../../shared/types/domain'

type LoginPageProps = {
  themeMode: ThemeMode
  authError: string
  demoEmail: string
  demoPassword: string
  onToggleTheme: () => void
  onLogin: (email: string, password: string) => boolean
}

export function LoginPage(props: LoginPageProps) {
  const {
    themeMode,
    authError,
    demoEmail,
    demoPassword,
    onToggleTheme,
    onLogin,
  } = props

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const nextModeLabel = themeMode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const ok = onLogin(email, password)
    if (ok) {
      setPassword('')
    }
  }

  return (
    <div className={styles.loginShell}>
      <article className={styles.loginCard}>
        <div className={styles.loginHead}>
          <a href="/" className={styles.backToSite}>
            Back to site
            <span className={styles.linkArrow} aria-hidden="true">-&gt;</span>
          </a>
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
        </div>

        <h1 className={styles.title}>Sign In to Compliverse Licence Dashboard</h1>
        <p className={styles.helpText}>
          Access Licence Dashboard for Real-Time Compliance Monitoring and Renewal Tracking.
        </p>

        <form className={styles.loginForm} onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@hospital.com"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              required
            />
          </label>

          {authError ? <p className={styles.authError}>{authError}</p> : null}

          <button type="submit" className={styles.primaryAction}>
            Sign In
          </button>
        </form>

        <p className={styles.demoNote}>
          Demo credentials: <strong>{demoEmail}</strong> / <strong>{demoPassword}</strong>
        </p>
      </article>
    </div>
  )
}
