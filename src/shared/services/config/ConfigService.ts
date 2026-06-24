/**
 * Abstract configuration service contract for dependency inversion.
 * Allows environment, test doubles, and feature flag management
 * without embedding environment variables throughout the codebase.
 */
export interface ConfigService {
  getAppsScriptUrl(): string
}

/**
 * Configuration service that reads from Vite environment variables.
 * Safe in browser/SSR contexts.
 */
export class EnvConfigService implements ConfigService {
  getAppsScriptUrl(): string {
    return import.meta.env.VITE_APPS_SCRIPT_URL?.trim() ?? ''
  }
}
