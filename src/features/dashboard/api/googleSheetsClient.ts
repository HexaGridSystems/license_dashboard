import type { Hospital, HospitalLicense } from '../../../shared/types/domain'

type ListResponse = {
  hospitals: Hospital[]
  licenses: HospitalLicense[]
  syncedAt: number | null
}

type ApiEnvelope = {
  ok?: boolean
  error?: string
  syncedAt?: unknown
}

type LegacyLicenseRow = {
  id?: unknown
  'Licence Name'?: unknown
  Category?: unknown
  Authority?: unknown
  'Valid From'?: unknown
  'Expiry Date'?: unknown
  Status?: unknown
  Risk?: unknown
  'Assigned Lawyer'?: unknown
  'Next Action'?: unknown
  'Document Link'?: unknown
}

function buildUrl(baseUrl: string, action: string) {
  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}action=${encodeURIComponent(action)}`
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function normalizeCategory(value: string): HospitalLicense['category'] {
  const allowed: HospitalLicense['category'][] = [
    'Licence',
    'Renewal',
    'Permit',
    'Statutory Filing',
    'Legal Certificate',
  ]

  return allowed.includes(value as HospitalLicense['category'])
    ? (value as HospitalLicense['category'])
    : 'Licence'
}

function normalizeStatus(value: string): HospitalLicense['status'] {
  const normalized = value.trim().toLowerCase()
  if (normalized.includes('review')) {
    return 'In Review'
  }
  if (normalized.includes('overdue')) {
    return 'Overdue'
  }
  if (normalized.includes('due')) {
    return 'Due Soon'
  }
  return 'Compliant'
}

function toLegacyListResponse(rows: LegacyLicenseRow[]): ListResponse {
  const defaultHospital: Hospital = {
    id: 'H-001',
    name: 'Default Hospital',
    address: '',
    contactPerson: '',
    complianceOwner: '',
  }

  const licenses = rows.map((row, index) => {
    const category = normalizeCategory(asString(row.Category))
    const status = normalizeStatus(asString(row.Status))

    return {
      id: asString(row.id) || `L-LEGACY-${index + 1}`,
      hospitalId: defaultHospital.id,
      licenceName: asString(row['Licence Name']),
      category,
      issueDate: asString(row['Valid From']),
      expiryDate: asString(row['Expiry Date']),
      owner: asString(row['Assigned Lawyer']),
      regulator: asString(row.Authority),
      status,
    } satisfies HospitalLicense
  })

  return {
    hospitals: [defaultHospital],
    licenses,
    syncedAt: null,
  }
}

function parseSyncedAt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const asNumber = Number(value)
    if (Number.isFinite(asNumber)) {
      return asNumber
    }

    const parsed = Date.parse(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function normalizeHospital(value: unknown): Hospital {
  const row = value as Record<string, unknown>
  return {
    id: asString(row.id),
    name: asString(row.name),
    address: asString(row.address),
    contactPerson: asString(row.contactPerson),
    complianceOwner: asString(row.complianceOwner),
  }
}

function normalizeLicense(value: unknown): HospitalLicense {
  const row = value as Record<string, unknown>
  return {
    id: asString(row.id),
    hospitalId: asString(row.hospitalId),
    licenceName: asString(row.licenceName),
    category: asString(row.category) as HospitalLicense['category'],
    issueDate: asString(row.issueDate),
    expiryDate: asString(row.expiryDate),
    owner: asString(row.owner),
    regulator: asString(row.regulator),
    status: asString(row.status) as HospitalLicense['status'],
  }
}

function parseListResponse(data: unknown): ListResponse {
  if (Array.isArray(data)) {
    return toLegacyListResponse(data as LegacyLicenseRow[])
  }

  const payload = data as Record<string, unknown>
  const hospitalsRaw = payload.hospitals
  const licensesRaw = payload.licenses
  const syncedAtRaw = payload.syncedAt

  if (!Array.isArray(hospitalsRaw) || !Array.isArray(licensesRaw)) {
    throw new Error('Apps Script response must be either legacy rows[] or include hospitals[] and licenses[].')
  }

  const hospitals = hospitalsRaw.map(normalizeHospital)
  const licenses = licensesRaw.map(normalizeLicense)

  return {
    hospitals,
    licenses,
    syncedAt: parseSyncedAt(syncedAtRaw),
  }
}

async function parseJsonResponse(response: Response) {
  const text = await response.text()
  if (!text) {
    return {}
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new Error('Apps Script returned invalid JSON.')
  }
}

function assertApiSuccess(data: unknown) {
  const payload = data as ApiEnvelope
  if (payload.error) {
    throw new Error(payload.error)
  }
}

export async function listDashboardData(baseUrl: string): Promise<ListResponse> {
  const response = await fetch(buildUrl(baseUrl, 'list'), {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error(`Fetch failed with status ${response.status}.`)
  }

  const data = await parseJsonResponse(response)
  assertApiSuccess(data)
  return parseListResponse(data)
}

export async function upsertLicense(baseUrl: string, license: HospitalLicense) {
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'upsertLicense',
      payload: license,
    }),
  })

  if (!response.ok) {
    throw new Error(`Save failed with status ${response.status}.`)
  }

  const data = await parseJsonResponse(response)
  assertApiSuccess(data)

  const payload = data as ApiEnvelope
  return parseSyncedAt(payload.syncedAt)
}

export async function upsertHospitalWithLicenses(
  baseUrl: string,
  payload: { hospital: Hospital; licenses: HospitalLicense[] },
) {
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'upsertHospitalWithLicenses',
      payload,
    }),
  })

  if (!response.ok) {
    throw new Error(`Save failed with status ${response.status}.`)
  }

  const data = await parseJsonResponse(response)
  assertApiSuccess(data)

  const responsePayload = data as ApiEnvelope
  return parseSyncedAt(responsePayload.syncedAt)
}
