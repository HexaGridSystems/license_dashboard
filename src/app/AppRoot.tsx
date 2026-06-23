import { LoginPage } from '../features/auth/components/LoginPage'
import { useAuth } from '../features/auth/hooks/useAuth'
import { DashboardPage } from '../features/dashboard/components/DashboardPage.tsx'
import { useDashboardState } from '../features/dashboard/hooks/useDashboardState'
import { useTheme } from '../shared/hooks/useTheme'
import { Navigate, Route, Routes } from 'react-router-dom'

// Marketing pages disabled — auth enabled
export default function AppRoot() {
  const { themeMode, toggleTheme } = useTheme()
  const { isAuthenticated, authError, login, logout, demoUser } = useAuth()
  const dashboard = useDashboardState()

  return (
    <Routes>
      <Route
        path="/app"
        element={
          isAuthenticated ? (
            <DashboardPage
              themeMode={themeMode}
              onToggleTheme={toggleTheme}
              onLogout={logout}
              state={dashboard}
            />
          ) : (
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
      />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}
