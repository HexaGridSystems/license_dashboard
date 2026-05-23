import { LoginPage } from '../features/auth/components/LoginPage'
import { useAuth } from '../features/auth/hooks/useAuth'
import { DashboardPage } from '../features/dashboard/components/DashboardPage'
import { useDashboardState } from '../features/dashboard/hooks/useDashboardState'
import { useTheme } from '../shared/hooks/useTheme'

export default function AppRoot() {
  const { themeMode, toggleTheme } = useTheme()
  const { isAuthenticated, authError, login, logout, demoUser } = useAuth()
  const dashboard = useDashboardState()

  if (!isAuthenticated) {
    return (
      <LoginPage
        themeMode={themeMode}
        authError={authError}
        demoEmail={demoUser.email}
        demoPassword={demoUser.password}
        onToggleTheme={toggleTheme}
        onLogin={login}
      />
    )
  }

  return (
    <DashboardPage
      themeMode={themeMode}
      onToggleTheme={toggleTheme}
      onLogout={logout}
      state={dashboard}
    />
  )
}
