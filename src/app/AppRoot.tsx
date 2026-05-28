import { LoginPage } from '../features/auth/components/LoginPage'
import { useAuth } from '../features/auth/hooks/useAuth'
import { DashboardPage } from '../features/dashboard/components/DashboardPage.tsx'
import { useDashboardState } from '../features/dashboard/hooks/useDashboardState'
import { MarketingLayout } from '../features/marketing/components/MarketingLayout'
import { AboutPage } from '../features/marketing/pages/AboutPage'
import { ContactPage } from '../features/marketing/pages/ContactPage'
import { HomePage } from '../features/marketing/pages/HomePage'
import { ProductPage } from '../features/marketing/pages/ProductPage'
import { useTheme } from '../shared/hooks/useTheme'
import { Navigate, Route, Routes } from 'react-router-dom'

export default function AppRoot() {
  const { themeMode, toggleTheme } = useTheme()
  const { isAuthenticated, authError, login, logout, demoUser } = useAuth()
  const dashboard = useDashboardState()

  return (
    <Routes>
      <Route
        element={
          <MarketingLayout
            themeMode={themeMode}
            onToggleTheme={toggleTheme}
          />
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/product" element={<ProductPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
