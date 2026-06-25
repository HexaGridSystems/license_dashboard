const DAY_MS = 24 * 60 * 60 * 1000

function jsonResponse(status, payload) {
  return {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
    body: payload,
  }
}

function getHeader(req, name) {
  const direct = req.headers?.[name]
  if (typeof direct === 'string' && direct.length > 0) {
    return direct
  }

  const lowerName = name.toLowerCase()
  const lower = req.headers?.[lowerName]
  if (typeof lower === 'string' && lower.length > 0) {
    return lower
  }

  return ''
}

function parseMaybeJson(text) {
  if (!text) {
    return {}
  }

  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

function buildListUrl(baseUrl) {
  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}action=list&t=${Date.now()}`
}

function asString(value) {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).trim()
}

function pickField(row, keys) {
  for (const key of keys) {
    const value = asString(row?.[key])
    if (value) {
      return value
    }
  }

  return ''
}

function normalizeLicense(row, fallbackIndex) {
  const normalized = {
    id:
      pickField(row, ['id', 'Serial Number', 'serialNumber']) ||
      `license-row-${fallbackIndex + 1}`,
    licenceName: pickField(row, [
      'licenceName',
      'License/Vendor name',
      'License/Vendor Name',
      'License Name',
      'Licence Name',
    ]),
    hospitalId: pickField(row, ['hospitalId', 'Hospital ID', 'Hospital Id']),
    expiryDate: pickField(row, [
      'expiryDate',
      'Valid till',
      'Valid Till',
      'Valid To',
      'Expiry Date',
      'Expiration Date',
    ]),
    category: pickField(row, ['category', 'Category']),
    status: pickField(row, ['status', 'Status']),
    action: pickField(row, ['action', 'Action']),
  }

  return normalized
}

function parseDashboardPayload(data) {
  if (Array.isArray(data)) {
    return {
      hospitals: [
        {
          id: 'H-001',
          name: 'Primary Hospital',
        },
      ],
      licenses: data.map((row, index) => normalizeLicense(row, index)),
    }
  }

  const hospitals = Array.isArray(data?.hospitals) ? data.hospitals : []
  const licensesRaw = Array.isArray(data?.licenses) ? data.licenses : []

  return {
    hospitals,
    licenses: licensesRaw.map((row, index) => normalizeLicense(row, index)),
  }
}

function parseDate(value) {
  const input = asString(value)
  if (!input) {
    return null
  }

  const parsed = new Date(input)
  if (!Number.isFinite(parsed.getTime())) {
    return null
  }

  return parsed
}

function daysUntil(date, now) {
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const end = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  return Math.floor((end - start) / DAY_MS)
}

function summarizeLicenses(licenses) {
  const now = new Date()
  const withExpiry = []

  for (const license of licenses) {
    const expiry = parseDate(license.expiryDate)
    if (!expiry) {
      continue
    }

    withExpiry.push({
      ...license,
      daysLeft: daysUntil(expiry, now),
      expiryDateISO: expiry.toISOString().slice(0, 10),
    })
  }

  withExpiry.sort((a, b) => a.daysLeft - b.daysLeft)

  const overdue = withExpiry.filter((item) => item.daysLeft < 0)
  const dueIn15Days = withExpiry.filter((item) => item.daysLeft >= 0 && item.daysLeft <= 15)
  const dueIn90Days = withExpiry.filter((item) => item.daysLeft >= 0 && item.daysLeft <= 90)

  return {
    totalLicenses: licenses.length,
    withExpiryCount: withExpiry.length,
    overdueCount: overdue.length,
    dueIn15DaysCount: dueIn15Days.length,
    dueIn90DaysCount: dueIn90Days.length,
    topUrgent: withExpiry.slice(0, 20),
    generatedAtIso: now.toISOString(),
  }
}

function escapeHtml(value) {
  return asString(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderEmailHtml(summary) {
  const rows = summary.topUrgent
    .map(
      (item) => `
        <tr>
          <td style="padding:8px;border:1px solid #ddd;">${escapeHtml(item.licenceName || item.id)}</td>
          <td style="padding:8px;border:1px solid #ddd;">${escapeHtml(item.category)}</td>
          <td style="padding:8px;border:1px solid #ddd;">${escapeHtml(item.expiryDateISO)}</td>
          <td style="padding:8px;border:1px solid #ddd;">${escapeHtml(String(item.daysLeft))}</td>
          <td style="padding:8px;border:1px solid #ddd;">${escapeHtml(item.status)}</td>
        </tr>
      `,
    )
    .join('')

  return `
    <div style="font-family:Arial, sans-serif; color:#1f2937;">
      <h2 style="margin-bottom:8px;">Daily License Dashboard Summary</h2>
      <p style="margin-top:0; color:#4b5563;">Generated at ${escapeHtml(summary.generatedAtIso)} (UTC)</p>

      <ul>
        <li>Total licenses: <strong>${summary.totalLicenses}</strong></li>
        <li>Licenses with expiry date: <strong>${summary.withExpiryCount}</strong></li>
        <li>Overdue licenses: <strong>${summary.overdueCount}</strong></li>
        <li>Due in 15 days: <strong>${summary.dueIn15DaysCount}</strong></li>
        <li>Due in 90 days: <strong>${summary.dueIn90DaysCount}</strong></li>
      </ul>

      <h3 style="margin-top:20px;">Top urgent licenses</h3>
      <table style="border-collapse:collapse; width:100%; max-width:900px;">
        <thead>
          <tr>
            <th style="padding:8px;border:1px solid #ddd;text-align:left;background:#f3f4f6;">License</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left;background:#f3f4f6;">Category</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left;background:#f3f4f6;">Expiry Date</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left;background:#f3f4f6;">Days Left</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left;background:#f3f4f6;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="5" style="padding:8px;border:1px solid #ddd;">No expiry data found.</td></tr>'}
        </tbody>
      </table>
    </div>
  `
}

async function sendEmailWithResend({ apiKey, from, to, subject, html }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
    }),
  })

  const text = await response.text()
  const data = parseMaybeJson(text)

  if (!response.ok) {
    throw new Error(`Resend send failed: ${response.status} ${JSON.stringify(data)}`)
  }

  return data
}

module.exports = async function (context, req) {
  try {
    const cronSecret = process.env.CRON_SECRET
    const requestSecret = getHeader(req, 'x-cron-secret')

    if (!cronSecret) {
      context.res = jsonResponse(500, {
        ok: false,
        error: 'Missing required app setting: CRON_SECRET',
      })
      return
    }

    if (!requestSecret || requestSecret !== cronSecret) {
      context.res = jsonResponse(401, {
        ok: false,
        error: 'Unauthorized trigger.',
      })
      return
    }

    const appsScriptUrl = process.env.APPS_SCRIPT_URL
    const resendApiKey = process.env.RESEND_API_KEY
    const emailFrom = process.env.EMAIL_FROM
    const emailToRaw = process.env.EMAIL_TO

    if (!appsScriptUrl || !resendApiKey || !emailFrom || !emailToRaw) {
      context.res = jsonResponse(500, {
        ok: false,
        error:
          'Missing app settings. Required: APPS_SCRIPT_URL, RESEND_API_KEY, EMAIL_FROM, EMAIL_TO.',
      })
      return
    }

    const recipients = emailToRaw
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)

    if (recipients.length === 0) {
      context.res = jsonResponse(500, {
        ok: false,
        error: 'EMAIL_TO is empty after parsing recipients.',
      })
      return
    }

    const listUrl = buildListUrl(appsScriptUrl)
    const dashboardResponse = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-store',
      },
    })

    if (!dashboardResponse.ok) {
      throw new Error(`Dashboard fetch failed: ${dashboardResponse.status}`)
    }

    const dashboardData = await dashboardResponse.json()
    const parsed = parseDashboardPayload(dashboardData)
    const summary = summarizeLicenses(parsed.licenses)

    const subject = `Daily License Summary: ${summary.dueIn15DaysCount} due in 15 days`
    const html = renderEmailHtml(summary)
    const resendResult = await sendEmailWithResend({
      apiKey: resendApiKey,
      from: emailFrom,
      to: recipients,
      subject,
      html,
    })

    context.res = jsonResponse(200, {
      ok: true,
      sent: true,
      resend: resendResult,
      summary: {
        totalLicenses: summary.totalLicenses,
        withExpiryCount: summary.withExpiryCount,
        overdueCount: summary.overdueCount,
        dueIn15DaysCount: summary.dueIn15DaysCount,
        dueIn90DaysCount: summary.dueIn90DaysCount,
      },
    })
  } catch (error) {
    context.log.error('daily-email-trigger-failed', error)
    context.res = jsonResponse(500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error.',
    })
  }
}