import { useEffect, useState } from 'react'
import type { ThemeMode } from '../types/domain'
import { THEME_STORAGE_KEY } from '../constants/storageKeys'
import { LocalStorageAdapter } from '../services/storage'

const storageService = new LocalStorageAdapter()

export function useTheme() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const savedTheme = storageService.getItem(THEME_STORAGE_KEY)
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme
    }

    if (typeof window === 'undefined') {
      return 'light'
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode)
    storageService.setItem(THEME_STORAGE_KEY, themeMode)
  }, [themeMode])

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return {
    themeMode,
    toggleTheme,
  }
}
