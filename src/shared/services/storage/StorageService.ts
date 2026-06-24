/**
 * Abstract storage service contract for dependency inversion.
 * Allows swapping implementations (localStorage, IndexedDB, etc.) without
 * changing consumer code.
 */
export interface StorageService {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/**
 * Adapter for browser's localStorage with identical semantics.
 * Safe for SSR: returns null on window undefined.
 */
export class LocalStorageAdapter implements StorageService {
  getItem(key: string): string | null {
    if (typeof window === 'undefined') {
      return null
    }
    return window.localStorage.getItem(key)
  }

  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') {
      return
    }
    window.localStorage.setItem(key, value)
  }

  removeItem(key: string): void {
    if (typeof window === 'undefined') {
      return
    }
    window.localStorage.removeItem(key)
  }
}
