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
          <p className={styles.eyebrow}>Hospital Legal Operations</p>
          <button type="button" className={styles.themeToggle} onClick={onToggleTheme}>
            {themeMode === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>

        <h1 className={styles.title}>Sign In to Legal Licence Dashboard</h1>
        <p className={styles.helpText}>
          Access hospital license renewals, reminders, permits, and statutory filings.
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
