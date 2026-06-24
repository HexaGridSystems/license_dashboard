export const knownStatusOrder = ['Active', 'Due Soon', 'Expired', 'One Time'] as const

const knownStatusColors: Record<string, string> = {
  Active: '#1d7a58',
  'Due Soon': '#c17f0f',
  Expired: '#9f3b2d',
  'One Time': '#1e88e5',
}

const customStatusPalette = [
  '#1e88e5',
  '#ef6c00',
  '#00897b',
  '#d81b60',
  '#5e35b1',
  '#6d4c41',
  '#039be5',
  '#c0ca33',
  '#f4511e',
  '#3949ab',
  '#43a047',
  '#8e24aa',
  '#00acc1',
  '#e53935',
  '#7cb342',
  '#546e7a',
]

import { RenewalRules } from '../../licenses/domain/rules/RenewalRules'

const renewalRules = new RenewalRules()

export function normalizeStatusLabel(status: string) {
  return renewalRules.normalizeStatusLabel(status)
}

function hueToRgb(p: number, q: number, t: number) {
  let localT = t

  if (localT < 0) {
    localT += 1
  }
  if (localT > 1) {
    localT -= 1
  }
  if (localT < 1 / 6) {
    return p + (q - p) * 6 * localT
  }
  if (localT < 1 / 2) {
    return q
  }
  if (localT < 2 / 3) {
    return p + (q - p) * (2 / 3 - localT) * 6
  }

  return p
}

function hslToHex(hue: number, saturation: number, lightness: number) {
  const h = ((hue % 360) + 360) % 360 / 360
  const s = Math.max(0, Math.min(100, saturation)) / 100
  const l = Math.max(0, Math.min(100, lightness)) / 100

  let r: number
  let g: number
  let b: number

  if (s === 0) {
    r = l
    g = l
    b = l
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    r = hueToRgb(p, q, h + 1 / 3)
    g = hueToRgb(p, q, h)
    b = hueToRgb(p, q, h - 1 / 3)
  }

  const toHex = (value: number) => {
    const channel = Math.round(value * 255)
    return channel.toString(16).padStart(2, '0')
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function isKnown(status: string): status is (typeof knownStatusOrder)[number] {
  return knownStatusOrder.includes(status as (typeof knownStatusOrder)[number])
}

export function buildStatusOrder(statuses: readonly string[]) {
  const uniqueStatuses = new Set<string>()

  for (const rawStatus of statuses) {
    uniqueStatuses.add(normalizeStatusLabel(rawStatus))
  }

  return [
    ...knownStatusOrder.filter((status) => uniqueStatuses.has(status)),
    ...Array.from(uniqueStatuses)
      .filter((status) => !isKnown(status))
      .sort((left, right) => left.localeCompare(right)),
  ]
}

export function buildStatusColorMap(statuses: readonly string[]) {
  const orderedStatuses = buildStatusOrder(statuses)
  const colorMap: Record<string, string> = {}
  const usedColors = new Set<string>()

  for (const status of knownStatusOrder) {
    if (orderedStatuses.includes(status)) {
      const knownColor = knownStatusColors[status].toLowerCase()
      colorMap[status] = knownColor
      usedColors.add(knownColor)
    }
  }

  const customStatuses = orderedStatuses.filter((status) => !isKnown(status))
  if (customStatuses.length === 0) {
    return colorMap
  }

  const paletteSize = customStatusPalette.length
  for (let index = 0; index < customStatuses.length; index += 1) {
    const status = customStatuses[index]
    let assignedColor = ''

    if (paletteSize > 0) {
      const preferredIndex = Math.floor((index * paletteSize) / customStatuses.length)
      for (let offset = 0; offset < paletteSize; offset += 1) {
        const candidate = customStatusPalette[(preferredIndex + offset) % paletteSize].toLowerCase()
        if (!usedColors.has(candidate)) {
          assignedColor = candidate
          break
        }
      }
    }

    if (!assignedColor) {
      let overflowOffset = 0
      while (!assignedColor && overflowOffset < 2048) {
        const hue = ((index + overflowOffset) * 137.508) % 360
        const lightness = 44 + ((index + overflowOffset) % 3) * 8
        const candidate = hslToHex(hue, 68, lightness).toLowerCase()
        if (!usedColors.has(candidate)) {
          assignedColor = candidate
        }
        overflowOffset += 1
      }
    }

    if (!assignedColor) {
      assignedColor = '#546e7a'
    }

    colorMap[status] = assignedColor
    usedColors.add(assignedColor)
  }

  return colorMap
}

export function getStatusColor(status: string, statuses?: readonly string[]) {
  const normalizedStatus = normalizeStatusLabel(status)
  if (knownStatusColors[normalizedStatus]) {
    return knownStatusColors[normalizedStatus]
  }

  const colorMap = buildStatusColorMap(statuses ?? [normalizedStatus])
  return colorMap[normalizedStatus] ?? '#546e7a'
}

export function isKnownStatus(status: string) {
  return Object.prototype.hasOwnProperty.call(knownStatusColors, normalizeStatusLabel(status))
}
