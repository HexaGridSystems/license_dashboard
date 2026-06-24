import type { Hospital, HospitalLicense } from '../../../shared/types/domain'
import { RenewalRules } from '../../licenses/domain/rules/RenewalRules'

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

const renewalRules = new RenewalRules()

function buildUrl(baseUrl: string, action: string) {
  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}action=${encodeURIComponent(action)}`
}

function withTimestamp(url: string) {
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}t=${Date.now()}`
}

function asString(value: unknown) {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).trim()
}

function asNumberOrNull(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  const parsed = Number(String(value).trim())
  return Number.isFinite(parsed) ? parsed : null
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

  const pickString = (...keys: string[]) => {
    for (const key of keys) {
      const candidate = asString(row[key])
      if (candidate) {
        return candidate
      }
    }

    return ''
  }

  return {
    id: pickString('id', 'ID', 'Hospital ID'),
    name: pickString('name', 'Name', 'Hospital Name'),
    address: pickString('address', 'Address'),
    contactPerson: pickString('contactPerson', 'Contact Person'),
    complianceOwner: pickString('complianceOwner', 'Compliance Owner'),
  }
}

function normalizeLicense(value: unknown): HospitalLicense {
  const row = value as Record<string, unknown>

  const pickString = (...keys: string[]) => {
    for (const key of keys) {
      const candidate = asString(row[key])
      if (candidate) {
        return candidate
      }
    }

    return ''
  }

  return {
    id: pickString('id', 'Serial Number'),
    hospitalId: pickString('hospitalId', 'Hospital ID', 'Hospital Id'),
    licenceName: pickString(
      'licenceName',
      'License/Vendor name',
      'License/Vendor Name',
      'License/Vendor Name ',
      'Licence Name',
      'License Name',
    ),
    category: pickString('category', 'Category') as HospitalLicense['category'],
    licenceNumber: pickString('licenceNumber', 'Licence Number', 'License Number'),
    issueDate: pickString('issueDate', 'Valid from', 'Valid From', 'Issue Date'),
    expiryDate: pickString(
      'expiryDate',
      'Valid till',
      'Valid Till',
      'Valid To',
      'Expiry Date',
      'Expiration Date',
    ),
    owner: '',
    regulator: '',
    status: renewalRules.parseStatus(pickString('status', 'Status')),
    remainingDays: asNumberOrNull(row['Remaining days']),
    action: pickString('action', 'Action'),
    documents: pickString('documents', 'Documents', 'Document', 'Docs'),
  }
}

function hasMeaningfulLicenseData(value: unknown, normalized: HospitalLicense) {
  const row = value as Record<string, unknown>
  const statusRaw = asString(row.status) || asString(row.Status)
  const actionRaw = asString(row.action) || asString(row.Action)
  const remainingDays = asNumberOrNull(row['Remaining days'])

  return [
    normalized.id,
    normalized.licenceName,
    normalized.category,
    normalized.issueDate,
    normalized.expiryDate,
    normalized.documents,
    statusRaw,
    actionRaw,
  ].some((field) => field !== '') || remainingDays !== null
}

function mapRowsToLicenses(rows: unknown[], fallbackHospitalId: string) {
  return rows.flatMap((value, index) => {
    const row = value as Record<string, unknown>
    const normalized = normalizeLicense(value)

    if (!hasMeaningfulLicenseData(value, normalized)) {
      return []
    }

    const stableId =
      normalized.id ||
      asString(row['Licence Number']) ||
      asString(row['License Number']) ||
      asString(row['Serial Number']) ||
      `L-ROW-${index + 1}`

    return [
      {
        ...normalized,
        id: stableId,
        // Licences sheet can omit Hospital ID; keep records visible under one default hospital.
        hospitalId: normalized.hospitalId || fallbackHospitalId,
      },
    ]
  })
}

function parseListResponse(data: unknown): ListResponse {
  if (Array.isArray(data)) {
    const fallbackHospitalId = 'H-001'
    return {
      hospitals: [
        {
          id: fallbackHospitalId,
          name: 'Primary Hospital',
          address: '',
          contactPerson: '',
          complianceOwner: '',
        },
      ],
      licenses: mapRowsToLicenses(data, fallbackHospitalId),
      syncedAt: null,
    }
  }

  const payload = data as Record<string, unknown>
  const hospitalsRaw = payload.hospitals
  const licensesRaw = payload.licenses
  const syncedAtRaw = payload.syncedAt

  if (!Array.isArray(licensesRaw)) {
    throw new Error('Apps Script response must be either legacy rows[] or include licenses[].')
  }

  const hospitals = Array.isArray(hospitalsRaw) ? hospitalsRaw.map(normalizeHospital) : []
  const fallbackHospitalId = hospitals[0]?.id ?? 'H-001'
  const licenses = mapRowsToLicenses(licensesRaw, fallbackHospitalId)

  const resolvedHospitals = hospitals.length > 0
    ? hospitals
    : [
        {
          id: fallbackHospitalId,
          name: 'Primary Hospital',
          address: '',
          contactPerson: '',
          complianceOwner: '',
        },
      ]

  return {
    hospitals: resolvedHospitals,
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
  const requestUrl = withTimestamp(buildUrl(baseUrl, 'list'))
  const startedAt = new Date().toISOString()

  console.log('[Dashboard Sync] list fetch started', {
    url: requestUrl,
    startedAt,
  })

  try {
    const response = await fetch(requestUrl, {
      method: 'GET',
      cache: 'no-store',
    })

    console.log('[Dashboard Sync] list fetch response received', {
      status: response.status,
      ok: response.ok,
    })

    if (!response.ok) {
      throw new Error(`Fetch failed with status ${response.status}.`)
    }

    const data = await parseJsonResponse(response)
    assertApiSuccess(data)
    const parsed = parseListResponse(data)

    console.log('[Dashboard Sync] list fetch parsed successfully', {
      hospitals: parsed.hospitals.length,
      licenses: parsed.licenses.length,
      syncedAt: parsed.syncedAt,
    })

    return parsed
  } catch (error) {
    console.error('[Dashboard Sync] list fetch failed', error)
    throw error
  }
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
