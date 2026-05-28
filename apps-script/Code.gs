const HOSPITALS_SHEET_NAME = 'Hospitals'
const LICENCES_SHEET_NAME = 'Licences'
const HOSPITALS_SHEET_ALIASES = ['Hospitals', 'Hospital']
const LICENCES_SHEET_ALIASES = ['Licences', 'Licenses']

const HOSPITAL_HEADERS = ['id', 'name', 'address', 'contactPerson', 'complianceOwner']
const LICENCE_HEADERS = [
  'Serial Number',
  'License/Vendor name',
  'Category',
  'Licence Number',
  'Valid from',
  'Valid till',
  'Remaining days',
  'Status',
  'Action',
  'Documents',
]

const HOSPITAL_HEADER_ALIASES = {
  id: ['id', 'hospital id', 'hospitalid'],
  name: ['name', 'hospital name'],
  address: ['address', 'hospital address'],
  contactPerson: ['contactperson', 'contact person'],
  complianceOwner: ['complianceowner', 'compliance owner'],
}

const LICENCE_HEADER_ALIASES = {
  'Serial Number': ['serial number', 'serial no', 'sr no', 'id'],
  'License/Vendor name': [
    'license/vendor name',
    'license/vendorname',
    'licence name',
    'license name',
  ],
  Category: ['category'],
  'Licence Number': ['licence number', 'license number', 'licence no'],
  'Valid from': ['valid from', 'validfrom', 'issue date', 'validity start'],
  'Valid till': ['valid till', 'validtill', 'valid to', 'expiry date', 'expiration date'],
  'Remaining days': ['remaining days', 'remaining day', 'days remaining'],
  Status: ['status'],
  Action: ['action', 'next action'],
  Documents: ['documents', 'document', 'docs'],
}

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'list'

    if (action === 'list') {
      return jsonResponse({
        ok: true,
        ...listData_(),
      })
    }

    return jsonResponse({ ok: false, error: `Unsupported action: ${action}` })
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error && error.message || error) })
  }
}

function doPost(e) {
  try {
    const payload = parsePostPayload_(e)
    const action = payload.action
    const ss = SpreadsheetApp.getActiveSpreadsheet()

    if (action === 'upsertLicense') {
      upsertLicense_(payload.payload)
      return jsonResponse({ ok: true, syncedAt: getSpreadsheetLastUpdatedIso_(ss) })
    }

    if (action === 'upsertHospitalWithLicenses') {
      upsertHospitalWithLicenses_(payload.payload)
      return jsonResponse({ ok: true, syncedAt: getSpreadsheetLastUpdatedIso_(ss) })
    }

    return jsonResponse({ ok: false, error: `Unsupported action: ${action}` })
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error && error.message || error) })
  }
}

function listData_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()

  const licencesSheet = ensureSheetWithHeaders_(
    ss,
    LICENCES_SHEET_NAME,
    LICENCE_HEADERS,
    LICENCES_SHEET_ALIASES,
    false,
  )
  ensureColumns_(licencesSheet, LICENCE_HEADERS, LICENCE_HEADER_ALIASES)

  return {
    hospitals: [
      {
        id: 'H-001',
        name: 'Primary Hospital',
        address: '',
        contactPerson: '',
        complianceOwner: '',
      },
    ],
    licenses: readObjectsFromSheet_(licencesSheet, LICENCE_HEADERS, LICENCE_HEADER_ALIASES),
    syncedAt: getSpreadsheetLastUpdatedIso_(ss),
  }
}

function getSpreadsheetLastUpdatedIso_(ss) {
  try {
    const file = DriveApp.getFileById(ss.getId())
    return file.getLastUpdated().toISOString()
  } catch (_error) {
    return new Date().toISOString()
  }
}

function upsertHospitalWithLicenses_(payload) {
  if (!payload || !payload.hospital || !Array.isArray(payload.licenses)) {
    throw new Error('Invalid payload for upsertHospitalWithLicenses')
  }

  payload.licenses.forEach((license) => {
    upsertLicense_(license)
  })
}

function upsertHospital_(hospital) {
  // Single-hospital mode: hospital metadata is no longer persisted in a separate sheet.
  validateRequiredFields_(hospital, ['name'])
}

function upsertLicense_(license) {
  validateRequiredFields_(license, ['id', 'licenceName', 'category', 'expiryDate', 'status'])

  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = ensureSheetWithHeaders_(
    ss,
    LICENCES_SHEET_NAME,
    LICENCE_HEADERS,
    LICENCES_SHEET_ALIASES,
    true,
  )

  const canonicalValues = {
    'Serial Number': license.id,
    'License/Vendor name': license.licenceName,
    Category: license.category,
    'Licence Number': license.id,
    'Valid from': license.issueDate || '',
    'Valid till': license.expiryDate || '',
    Status: license.status,
    Action: '',
  }

  if (
    Object.prototype.hasOwnProperty.call(license, 'documents') &&
    license.documents !== undefined
  ) {
    canonicalValues.Documents = license.documents || ''
  }

  upsertById_(
    sheet,
    LICENCE_HEADERS,
    LICENCE_HEADER_ALIASES,
    canonicalValues,
    license.id,
    'Licence Number',
  )
}

function upsertById_(sheet, canonicalHeaders, headerAliases, canonicalValues, id, idHeader) {
  const headerState = ensureColumns_(sheet, canonicalHeaders, headerAliases)
  const lookupHeader = idHeader || 'id'
  const idColumnIndex = headerState.indexByCanonical[lookupHeader]
  if (!idColumnIndex) {
    throw new Error(`'${lookupHeader}' header is required in sheet headers`)
  }

  const rowValues = new Array(headerState.headers.length).fill('')
  canonicalHeaders.forEach((header) => {
    const columnIndex = headerState.indexByCanonical[header]
    if (!columnIndex) {
      return
    }
    rowValues[columnIndex - 1] = normalizeCellValue_(canonicalValues[header])
  })

  const lastRow = sheet.getLastRow()
  if (lastRow <= 1) {
    sheet.getRange(2, 1, 1, rowValues.length).setValues([rowValues])
    return
  }

  const idValues = sheet.getRange(2, idColumnIndex, lastRow - 1, 1).getValues().flat()
  const rowOffset = idValues.findIndex((value) => String(value) === String(id))

  if (rowOffset === -1) {
    sheet.getRange(lastRow + 1, 1, 1, rowValues.length).setValues([rowValues])
    return
  }

  const targetRow = rowOffset + 2
  const existingRowValues = sheet.getRange(targetRow, 1, 1, rowValues.length).getValues()[0]
  canonicalHeaders.forEach((header) => {
    if (Object.prototype.hasOwnProperty.call(canonicalValues, header)) {
      return
    }
    const columnIndex = headerState.indexByCanonical[header]
    if (!columnIndex) {
      return
    }
    rowValues[columnIndex - 1] = existingRowValues[columnIndex - 1]
  })
  sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues])
}

function readObjectsFromSheet_(sheet, canonicalHeaders, headerAliases) {
  const data = sheet.getDataRange().getValues()
  if (!data || data.length <= 1) {
    return []
  }

  const headers = data[0].map((h) => String(h).trim())
  const indexByCanonical = resolveHeaderIndexes_(headers, canonicalHeaders, headerAliases)

  return data.slice(1).reduce((acc, row) => {
    const obj = {}
    canonicalHeaders.forEach((header) => {
      const idx = indexByCanonical[header]
      obj[header] = idx ? normalizeCellValue_(row[idx - 1]) : ''
    })

    if (hasAnyFilledValue_(obj, canonicalHeaders)) {
      acc.push(obj)
    }

    return acc
  }, [])
}

function hasAnyFilledValue_(obj, keys) {
  for (let i = 0; i < keys.length; i += 1) {
    const value = obj[keys[i]]
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return true
    }
  }

  return false
}

function ensureSheetWithHeaders_(ss, sheetName, headers, sheetAliases, allowCreate) {
  const sheet = resolveSheetByAliases_(ss, sheetName, sheetAliases, allowCreate)

  const maxColumns = Math.max(headers.length, sheet.getLastColumn())
  const firstRow = sheet.getRange(1, 1, 1, Math.max(maxColumns, 1)).getValues()[0]
  const hasAnyHeader = firstRow.some((value) => String(value).trim() !== '')

  if (!hasAnyHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
  }

  return sheet
}

function resolveSheetByAliases_(ss, canonicalName, aliases, allowCreate) {
  const candidateNames = []
  ;[canonicalName].concat(aliases || []).forEach((name) => {
    const normalized = String(name || '').trim()
    if (normalized && candidateNames.indexOf(normalized) === -1) {
      candidateNames.push(normalized)
    }
  })

  for (let i = 0; i < candidateNames.length; i += 1) {
    const sheet = ss.getSheetByName(candidateNames[i])
    if (sheet) {
      return sheet
    }
  }

  if (!allowCreate) {
    throw new Error(
      `Missing sheet '${canonicalName}'. Tried: ${candidateNames.join(', ')}`,
    )
  }

  return ss.insertSheet(canonicalName)
}

function ensureColumns_(sheet, canonicalHeaders, headerAliases) {
  const maxColumns = Math.max(canonicalHeaders.length, sheet.getLastColumn(), 1)
  const headerValues = sheet.getRange(1, 1, 1, maxColumns).getValues()[0]
  const headers = headerValues.map((value) => String(value).trim())

  if (!headers.some((value) => value !== '')) {
    sheet.getRange(1, 1, 1, canonicalHeaders.length).setValues([canonicalHeaders])
    return {
      headers: canonicalHeaders.slice(),
      indexByCanonical: resolveHeaderIndexes_(canonicalHeaders, canonicalHeaders, headerAliases),
    }
  }

  const updatedHeaders = headers.slice()
  const indexByCanonical = resolveHeaderIndexes_(updatedHeaders, canonicalHeaders, headerAliases)

  canonicalHeaders.forEach((header) => {
    if (indexByCanonical[header]) {
      return
    }
    updatedHeaders.push(header)
    indexByCanonical[header] = updatedHeaders.length
  })

  if (updatedHeaders.length !== headers.length) {
    sheet.getRange(1, 1, 1, updatedHeaders.length).setValues([updatedHeaders])
  }

  return {
    headers: updatedHeaders,
    indexByCanonical,
  }
}

function resolveHeaderIndexes_(headers, canonicalHeaders, headerAliases) {
  const normalizedIndex = {}

  headers.forEach((header, index) => {
    const key = normalizeHeaderKey_(header)
    if (!key || normalizedIndex[key]) {
      return
    }
    normalizedIndex[key] = index + 1
  })

  const indexByCanonical = {}
  canonicalHeaders.forEach((canonicalHeader) => {
    const aliases = headerAliases[canonicalHeader] || []
    const lookupKeys = [canonicalHeader]
      .concat(aliases)
      .map((value) => normalizeHeaderKey_(value))
      .filter(Boolean)

    const matched = lookupKeys.find((key) => normalizedIndex[key])
    if (matched) {
      indexByCanonical[canonicalHeader] = normalizedIndex[matched]
    }
  })

  return indexByCanonical
}

function normalizeHeaderKey_(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function validateRequiredFields_(obj, keys) {
  keys.forEach((key) => {
    const value = obj[key]
    if (value === null || value === undefined || String(value).trim() === '') {
      throw new Error(`Field '${key}' is required`)
    }
  })
}

function normalizeCellValue_(value) {
  if (value === null || value === undefined) {
    return ''
  }

  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd')
  }

  return String(value)
}

function parsePostPayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('Missing POST payload')
  }

  let parsed
  try {
    parsed = JSON.parse(e.postData.contents)
  } catch (_error) {
    throw new Error('POST payload must be valid JSON')
  }

  if (!parsed.action) {
    throw new Error('POST payload must include action')
  }

  return parsed
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  )
}
