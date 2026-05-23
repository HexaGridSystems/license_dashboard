import type { LicenceStatus, RenewalUrgency } from '../../../shared/types/domain'
import { daysUntil } from '../../../shared/utils/date'

export function getRenewalSignals(expiryDate: string) {
  const days = daysUntil(expiryDate)

  if (days === null) {
    return {
      countdownDays: null as number | null,
      countdownLabel: 'No expiry date',
      reminder3Months: false,
      reminder15Days: false,
      urgency: 'Low' as RenewalUrgency,
    }
  }

  if (days < 0) {
    return {
      countdownDays: days,
      countdownLabel: `Overdue by ${Math.abs(days)} days`,
      reminder3Months: true,
      reminder15Days: true,
      urgency: 'Overdue' as RenewalUrgency,
    }
  }

  if (days <= 15) {
    return {
      countdownDays: days,
      countdownLabel: `${days} days left`,
      reminder3Months: true,
      reminder15Days: true,
      urgency: 'Critical' as RenewalUrgency,
    }
  }

  if (days <= 90) {
    return {
      countdownDays: days,
      countdownLabel: `${days} days left`,
      reminder3Months: true,
      reminder15Days: false,
      urgency: 'Medium' as RenewalUrgency,
    }
  }

  return {
    countdownDays: days,
    countdownLabel: `${days} days left`,
    reminder3Months: false,
    reminder15Days: false,
    urgency: 'Low' as RenewalUrgency,
  }
}

export function defaultStatusFromExpiry(expiryDate: string): LicenceStatus {
  const days = daysUntil(expiryDate)
  if (days === null) {
    return 'In Review'
  }
  if (days < 0) {
    return 'Overdue'
  }
  if (days <= 90) {
    return 'Due Soon'
  }
  return 'Compliant'
}
