import { useState } from 'react'
import { AUTH_STORAGE_KEY } from '../../../shared/constants/storageKeys'
import { LocalStorageAdapter } from '../../../shared/services/storage'

const DEMO_USER = {
  email: 'admin@compliverse.in',
  password: 'SSCompli@123',
}

const storageService = new LocalStorageAdapter()

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return storageService.getItem(AUTH_STORAGE_KEY) === 'authenticated'
  })

  const [authError, setAuthError] = useState('')

  const login = (emailInput: string, passwordInput: string) => {
    const email = emailInput.trim().toLowerCase()
    const password = passwordInput.trim()

    if (email === DEMO_USER.email && password === DEMO_USER.password) {
      setIsAuthenticated(true)
      storageService.setItem(AUTH_STORAGE_KEY, 'authenticated')
      setAuthError('')
      return true
    }

    setAuthError('Invalid login credentials.')
    return false
  }

  const logout = () => {
    setIsAuthenticated(false)
    storageService.removeItem(AUTH_STORAGE_KEY)
  }

  return {
    isAuthenticated,
    authError,
    setAuthError,
    login,
    logout,
  }
}
