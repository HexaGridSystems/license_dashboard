export function daysUntil(expiryDate: string) {
  if (!expiryDate) {
    return null
  }

  const today = new Date()
  const from = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())

  const exp = new Date(expiryDate)
  if (Number.isNaN(exp.getTime())) {
    return null
  }

  const to = Date.UTC(exp.getFullYear(), exp.getMonth(), exp.getDate())
  return Math.round((to - from) / (1000 * 60 * 60 * 24))
}

export function formatDisplayDate(dateValue: string) {
  if (!dateValue) {
    return '-'
  }

  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) {
    return dateValue
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed)
}
