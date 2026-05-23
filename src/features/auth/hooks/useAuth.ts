import { useState } from 'react'
import { AUTH_STORAGE_KEY } from '../../../shared/constants/storageKeys'

const DEMO_USER = {
  email: 'admin@hospitallegal.com',
  password: 'admin123',
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }
    return localStorage.getItem(AUTH_STORAGE_KEY) === 'authenticated'
  })

  const [authError, setAuthError] = useState('')

  const login = (emailInput: string, passwordInput: string) => {
    const email = emailInput.trim().toLowerCase()
    const password = passwordInput.trim()

    if (email === DEMO_USER.email && password === DEMO_USER.password) {
      setIsAuthenticated(true)
      localStorage.setItem(AUTH_STORAGE_KEY, 'authenticated')
      setAuthError('')
      return true
    }

    setAuthError('Invalid login. Use the demo credentials shown below.')
    return false
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  return {
    isAuthenticated,
    authError,
    setAuthError,
    login,
    logout,
    demoUser: DEMO_USER,
  }
}
