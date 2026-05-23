const HOSPITALS_SHEET_NAME = 'Hospitals'
const LICENCES_SHEET_NAME = 'Licences'

const HOSPITAL_HEADERS = ['id', 'name', 'address', 'contactPerson', 'complianceOwner']
const LICENCE_HEADERS = [
  'id',
  'hospitalId',
  'licenceName',
  'category',
  'issueDate',
  'expiryDate',
  'owner',
  'regulator',
  'status',
]

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

  const hospitalsSheet = ensureSheetWithHeaders_(ss, HOSPITALS_SHEET_NAME, HOSPITAL_HEADERS)
  const licencesSheet = ensureSheetWithHeaders_(ss, LICENCES_SHEET_NAME, LICENCE_HEADERS)

  return {
    hospitals: readObjectsFromSheet_(hospitalsSheet),
    licenses: readObjectsFromSheet_(licencesSheet),
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

  upsertHospital_(payload.hospital)

  payload.licenses.forEach((license) => {
    upsertLicense_(license)
  })
}

function upsertHospital_(hospital) {
  validateRequiredFields_(hospital, ['id', 'name'])

  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = ensureSheetWithHeaders_(ss, HOSPITALS_SHEET_NAME, HOSPITAL_HEADERS)

  const row = [
    hospital.id,
    hospital.name || '',
    hospital.address || '',
    hospital.contactPerson || '',
    hospital.complianceOwner || '',
  ]

  upsertById_(sheet, HOSPITAL_HEADERS, row, hospital.id)
}

function upsertLicense_(license) {
  validateRequiredFields_(license, ['id', 'hospitalId', 'licenceName', 'category', 'expiryDate', 'status'])

  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = ensureSheetWithHeaders_(ss, LICENCES_SHEET_NAME, LICENCE_HEADERS)

  const row = [
    license.id,
    license.hospitalId,
    license.licenceName,
    license.category,
    license.issueDate || '',
    license.expiryDate || '',
    license.owner || '',
    license.regulator || '',
    license.status,
  ]

  upsertById_(sheet, LICENCE_HEADERS, row, license.id)
}

function upsertById_(sheet, headers, rowValues, id) {
  const idColumnIndex = headers.indexOf('id') + 1
  if (idColumnIndex <= 0) {
    throw new Error('id header is required in sheet headers')
  }

  const lastRow = sheet.getLastRow()
  if (lastRow <= 1) {
    sheet.appendRow(rowValues)
    return
  }

  const idValues = sheet.getRange(2, idColumnIndex, lastRow - 1, 1).getValues().flat()
  const rowOffset = idValues.findIndex((value) => String(value) === String(id))

  if (rowOffset === -1) {
    sheet.appendRow(rowValues)
    return
  }

  const targetRow = rowOffset + 2
  sheet.getRange(targetRow, 1, 1, headers.length).setValues([rowValues])
}

function readObjectsFromSheet_(sheet) {
  const data = sheet.getDataRange().getValues()
  if (!data || data.length <= 1) {
    return []
  }

  const headers = data[0].map((h) => String(h).trim())

  return data.slice(1).map((row) => {
    const obj = {}
    headers.forEach((header, index) => {
      obj[header] = normalizeCellValue_(row[index])
    })
    return obj
  })
}

function ensureSheetWithHeaders_(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName)
  if (!sheet) {
    sheet = ss.insertSheet(sheetName)
  }

  const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0]
  const normalized = firstRow.map((h) => String(h).trim())
  const hasHeaders = headers.every((header, idx) => normalized[idx] === header)

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
  }

  return sheet
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
