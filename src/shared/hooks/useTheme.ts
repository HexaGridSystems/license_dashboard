import { useEffect, useState } from 'react'
import type { ThemeMode } from '../types/domain'
import { THEME_STORAGE_KEY } from '../constants/storageKeys'

export function useTheme() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return 'light'
    }

    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode)
    localStorage.setItem(THEME_STORAGE_KEY, themeMode)
  }, [themeMode])

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return {
    themeMode,
    toggleTheme,
  }
}
