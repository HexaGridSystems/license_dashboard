import type { LicenceStatus, RenewalUrgency } from '../../../../shared/types/domain'
import { daysUntil } from '../../../../shared/utils/date'

/**
 * Domain logic for license status and renewal urgency computation.
 * Single source of truth for all status decision rules.
 * Used by Google Sheets API parsing, renewal enrichment, and validation.
 * Pure functions with no side effects.
 */
export class RenewalRules {
  /**
   * Parses any external status string (from Sheets, user input, etc.)
   * into canonical LicenceStatus: 'Active' | 'Due Soon' | 'Expired' | string.
   * Used in Google Sheets API to normalize status column.
   */
  parseStatus(value: string): LicenceStatus {
    const raw = value.trim()
    const normalized = raw.toLowerCase()

    if (
      normalized.includes('expired') ||
      normalized.includes('overdue') ||
      normalized === 'inactive'
    ) {
      return 'Expired'
    }

    if (normalized.includes('due') || normalized.includes('review')) {
      return 'Due Soon'
    }

    if (
      normalized.includes('active') ||
      normalized.includes('valid') ||
      normalized.includes('compliant')
    ) {
      return 'Active'
    }

    return raw || 'Unknown'
  }

  /**
   * Derives license status from expiry date.
   * Used when creating new licenses or computing default status.
   */
  getStatusFromExpiry(expiryDate: string): LicenceStatus {
    const days = daysUntil(expiryDate)
    if (days === null) {
      return 'Due Soon'
    }
    if (days < 0) {
      return 'Expired'
    }
    if (days <= 90) {
      return 'Due Soon'
    }
    return 'Active'
  }

  /**
   * Computes renewal urgency level based on days until expiry.
   * Used for card highlighting and renewal reminders.
   */
  getUrgency(expiryDate: string): RenewalUrgency {
    const days = daysUntil(expiryDate)

    if (days === null) {
      return 'Low'
    }

    if (days < 0) {
      return 'Overdue'
    }

    if (days <= 15) {
      return 'Critical'
    }

    if (days <= 90) {
      return 'Medium'
    }

    return 'Low'
  }

  /**
   * Normalizes any status string to a display-friendly label for UI.
   * Used by dashboard status filters, badges, and export headers.
   */
  normalizeStatusLabel(status: string): string {
    const raw = String(status || '').trim()
    if (!raw) {
      return 'Not applicable'
    }

    const simplified = raw.toLowerCase().replace(/[^a-z]/g, '')
    if (simplified === 'unknown' || simplified === 'notapplicable' || simplified === 'na') {
      return 'Not applicable'
    }
    if (simplified === 'active') {
      return 'Active'
    }
    if (simplified === 'duesoon' || simplified === 'expiringsoon') {
      return 'Expiring Soon'
    }
    if (simplified === 'expired') {
      return 'Expired'
    }
    if (simplified === 'onetime') {
      return 'One Time'
    }

    return raw
  }
}
