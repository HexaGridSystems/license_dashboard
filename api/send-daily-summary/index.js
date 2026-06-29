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

function asNumberOrNull(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  const parsed = Number(String(value).trim())
  return Number.isFinite(parsed) ? parsed : null
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
    licenceNumber: pickField(row, ['licenceNumber', 'Licence Number', 'License Number']),
    issueDate: pickField(row, ['issueDate', 'Valid from', 'Valid From', 'Issue Date']),
    status: pickField(row, ['status', 'Status']),
    action: pickField(row, ['action', 'Action']),
    documents: pickField(row, ['documents', 'Documents', 'Document Link', 'Document URL']),
    remainingDays: asNumberOrNull(row?.['Remaining days']),
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

const STATUS_ORDER = ['Active', 'Expiring Soon', 'Expired', 'One Time']

const STATUS_THEME = {
  Active: {
    color: '#1d7a58',
    background: '#dbf6ea',
    border: '#93d9ba',
  },
  'Expiring Soon': {
    color: '#925e00',
    background: '#fff2d8',
    border: '#f0d79d',
  },
  Expired: {
    color: '#9f3b2d',
    background: '#fde7e2',
    border: '#f0bcb1',
  },
  'One Time': {
    color: '#1e88e5',
    background: '#dff0ff',
    border: '#a8d0f5',
  },
  Unknown: {
    color: '#35536b',
    background: '#edf3f8',
    border: '#c9d8e4',
  },
}

function isoDateOrDash(dateValue) {
  const parsed = parseDate(dateValue)
  return parsed ? parsed.toISOString().slice(0, 10) : '-'
}

function normalizeStatusLabel(rawStatus, daysLeft) {
  const value = asString(rawStatus).toLowerCase()

  if (value.includes('one time') || value.includes('one-time')) {
    return 'One Time'
  }

  if (
    value.includes('expired') ||
    value.includes('overdue') ||
    value.includes('lapsed') ||
    value.includes('past due')
  ) {
    return 'Expired'
  }

  if (
    value.includes('due soon') ||
    value.includes('expiring soon') ||
    value.includes('expiring') ||
    value.includes('renew')
  ) {
    return 'Expiring Soon'
  }

  if (value.includes('active') || value.includes('valid')) {
    return 'Active'
  }

  if (daysLeft === null) {
    return 'Active'
  }

  if (daysLeft < 0) {
    return 'Expired'
  }

  if (daysLeft <= 30) {
    return 'Expiring Soon'
  }

  return 'Active'
}

function getStatusTheme(statusLabel) {
  return STATUS_THEME[statusLabel] || STATUS_THEME.Unknown
}

function buildStatusBreakdown(registerRows) {
  const counts = new Map()

  for (const row of registerRows) {
    counts.set(row.statusLabel, (counts.get(row.statusLabel) || 0) + 1)
  }

  const known = STATUS_ORDER.filter((status) => counts.has(status)).map((status) => ({
    label: status,
    count: counts.get(status) || 0,
    color: getStatusTheme(status).color,
  }))

  const custom = Array.from(counts.entries())
    .filter(([label]) => !STATUS_ORDER.includes(label))
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
    .map(([label, count]) => ({
      label,
      count,
      color: STATUS_THEME.Unknown.color,
    }))

  return [...known, ...custom]
}

function buildDonutChartImageUrl(statusBreakdown, total) {
  const labels = statusBreakdown.map((item) => item.label)
  const values = statusBreakdown.map((item) => item.count)
  const colors = statusBreakdown.map((item) => item.color)

  const chartConfig = {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: false,
      cutout: '66%',
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
        },
      },
    },
  }

  const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig))
  const label = encodeURIComponent(`Total ${total}`)
  return `https://quickchart.io/chart?width=220&height=220&format=png&backgroundColor=white&c=${encodedConfig}&text=${label}`
}

function renderStatusDonutImage(statusBreakdown, total) {
  if (!total || statusBreakdown.length === 0) {
    return '<div style="width:128px;height:128px;border-radius:50%;background:#eef3f8;border:1px solid #d9dee5;display:inline-grid;place-items:center;color:#627d98;font:600 12px Arial, sans-serif;">No data</div>'
  }

  const donutImageUrl = buildDonutChartImageUrl(statusBreakdown, total)

  return `
    <img
      src="${escapeHtml(donutImageUrl)}"
      width="128"
      height="128"
      alt="Status breakdown donut chart"
      style="display:block;width:128px;height:128px;border:0;outline:none;text-decoration:none;"
    />
  `
}

function summarizeLicenses(licenses) {
  const now = new Date()
  const registerRows = licenses
    .map((license, index) => {
      const expiry = parseDate(license.expiryDate)
      const issue = parseDate(license.issueDate)
      const computedDaysLeft = expiry ? daysUntil(expiry, now) : null
      const daysLeft = license.remainingDays ?? computedDaysLeft
      const statusLabel = normalizeStatusLabel(license.status, computedDaysLeft)
      const remainingDaysDisplay =
        daysLeft === null
          ? null
          : Math.max(0, daysLeft)

      return {
        ...license,
        serialNumber: index + 1,
        daysLeft,
        remainingDaysDisplay,
        issueDateISO: issue ? issue.toISOString().slice(0, 10) : '-',
        expiryDateISO: expiry ? expiry.toISOString().slice(0, 10) : '-',
        statusLabel,
      }
    })

  const withExpiry = registerRows.filter((item) => item.daysLeft !== null)
  const overdue = withExpiry.filter((item) => item.daysLeft < 0)
  const dueIn15Days = withExpiry.filter((item) => item.daysLeft >= 0 && item.daysLeft <= 15)
  const dueIn90Days = withExpiry.filter((item) => item.daysLeft >= 0 && item.daysLeft <= 90)
  const statusBreakdown = buildStatusBreakdown(registerRows)

  const activeCount = registerRows.filter((item) => item.statusLabel === 'Active').length
  const expiredCount = registerRows.filter((item) => item.statusLabel === 'Expired').length
  const expiringSoonCount = registerRows.filter((item) => item.statusLabel === 'Expiring Soon').length

  return {
    totalLicenses: licenses.length,
    withExpiryCount: withExpiry.length,
    overdueCount: overdue.length,
    dueIn15DaysCount: dueIn15Days.length,
    dueIn90DaysCount: dueIn90Days.length,
    activeCount,
    expiredCount,
    expiringSoonCount,
    statusBreakdown,
    registerRows,
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
  const donutHtml = renderStatusDonutImage(summary.statusBreakdown, summary.totalLicenses)
  const responsiveStyles = `
    <style>
      .email-shell {
        width: 100% !important;
      }

      .email-container {
        width: 100%;
        max-width: 1120px;
        margin: 0 auto;
      }

      .kpi-col {
        width: 25%;
      }

      .donut-col {
        width: 160px;
      }

      .register-table {
        width: 100%;
        border-collapse: collapse;
      }

      @media only screen and (max-width: 760px) {
        .email-shell {
          padding: 10px !important;
        }

        .card {
          padding: 12px !important;
        }

        .kpi-col,
        .status-col,
        .donut-col {
          display: block !important;
          width: 100% !important;
        }

        .kpi-col > div {
          margin-bottom: 8px !important;
        }

        .donut-col {
          text-align: left !important;
          padding: 0 0 10px !important;
        }

        .register-wrap {
          overflow-x: auto;
        }

        .register-table {
          min-width: 940px;
        }

        .register-table th,
        .register-table td {
          font-size: 11px !important;
          padding: 6px !important;
        }
      }
    </style>
  `

  const statusLegend = summary.statusBreakdown
    .map(
      (item) => `
        <tr>
          <td style="padding:6px 8px;border-bottom:1px solid #e7edf3;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${escapeHtml(item.color)};margin-right:6px;vertical-align:middle;"></span>
            <span style="vertical-align:middle;">${escapeHtml(item.label)}</span>
          </td>
          <td style="padding:6px 8px;border-bottom:1px solid #e7edf3;text-align:right;font-weight:700;">${item.count}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e7edf3;text-align:right;color:#486581;">${summary.totalLicenses > 0 ? Math.round((item.count / summary.totalLicenses) * 100) : 0}%</td>
        </tr>
      `,
    )
    .join('')

  const rows = summary.registerRows
    .map((item) => {
      const statusTheme = getStatusTheme(item.statusLabel)
      const daysLeftLabel = item.remainingDaysDisplay === null ? '-' : String(item.remainingDaysDisplay)
      const documentsValue = asString(item.documents)
      const documentsCell = documentsValue
        ? `<a href="${escapeHtml(documentsValue)}" style="color:#0e5f8b;text-decoration:underline;">Open document</a>`
        : '-'

      return `
        <tr>
          <td style="padding:8px;border:1px solid #d9dee5;">${item.serialNumber}</td>
          <td style="padding:8px;border:1px solid #d9dee5;">${escapeHtml(item.licenceName || item.id)}</td>
          <td style="padding:8px;border:1px solid #d9dee5;">${escapeHtml(item.category || '-')}</td>
          <td style="padding:8px;border:1px solid #d9dee5;">${escapeHtml(item.licenceNumber || '-')}</td>
          <td style="padding:8px;border:1px solid #d9dee5;">${escapeHtml(item.issueDateISO || '-')}</td>
          <td style="padding:8px;border:1px solid #d9dee5;">${escapeHtml(item.expiryDateISO || '-')}</td>
          <td style="padding:8px;border:1px solid #d9dee5;">${escapeHtml(daysLeftLabel)}</td>
          <td style="padding:8px;border:1px solid #d9dee5;">
            <span style="display:inline-block;padding:3px 8px;border-radius:999px;font-size:12px;font-weight:700;color:${statusTheme.color};background:${statusTheme.background};border:1px solid ${statusTheme.border};">${escapeHtml(item.statusLabel)}</span>
          </td>
          <td style="padding:8px;border:1px solid #d9dee5;">${escapeHtml(item.action || '-')}</td>
          <td style="padding:8px;border:1px solid #d9dee5;">${documentsCell}</td>
        </tr>
      `
    })
    .join('')

  return `
    ${responsiveStyles}
    <div class="email-shell" style="font-family:Arial, sans-serif; color:#102a43; background:#f4f8fb; padding:16px;">
      <div class="email-container" style="max-width:1120px;margin:0 auto;">
        <section class="card" style="background:#ffffff;border:1px solid #d6e2ec;border-radius:18px;padding:18px 20px;margin-bottom:14px;">
          <p style="margin:0;color:#486581;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;">Compliverse</p>
          <h2 style="margin:7px 0 5px;font-size:24px;line-height:1.2;color:#102a43;">Licence Dashboard Daily Snapshot</h2>
          <p style="margin:0;color:#627d98;font-size:13px;">Generated at ${escapeHtml(summary.generatedAtIso)} (UTC)</p>
        </section>

        <section style="margin-bottom:12px;">
          <table role="presentation" width="100%" style="border-collapse:collapse;">
            <tr>
              <td class="kpi-col" style="padding:0 5px 0 0;vertical-align:top;">
                <div class="card" style="background:#ffffff;border:1px solid #d6e2ec;border-radius:14px;padding:12px;">
                  <p style="margin:0;color:#627d98;font-size:12px;">Total licences</p>
                  <h3 style="margin:6px 0 0;font-size:24px;color:#102a43;">${summary.totalLicenses}</h3>
                </div>
              </td>
              <td class="kpi-col" style="padding:0 5px;vertical-align:top;">
                <div class="card" style="background:#ffffff;border:1px solid #d6e2ec;border-radius:14px;padding:12px;">
                  <p style="margin:0;color:#627d98;font-size:12px;">Active licences</p>
                  <h3 style="margin:6px 0 0;font-size:24px;color:#1d7a58;">${summary.activeCount}</h3>
                </div>
              </td>
              <td class="kpi-col" style="padding:0 5px;vertical-align:top;">
                <div class="card" style="background:#ffffff;border:1px solid #d6e2ec;border-radius:14px;padding:12px;">
                  <p style="margin:0;color:#627d98;font-size:12px;">Expired licences</p>
                  <h3 style="margin:6px 0 0;font-size:24px;color:#9f3b2d;">${summary.expiredCount}</h3>
                </div>
              </td>
              <td class="kpi-col" style="padding:0 0 0 5px;vertical-align:top;">
                <div class="card" style="background:#ffffff;border:1px solid #d6e2ec;border-radius:14px;padding:12px;">
                  <p style="margin:0;color:#627d98;font-size:12px;">Expiring soon</p>
                  <h3 style="margin:6px 0 0;font-size:24px;color:#925e00;">${summary.expiringSoonCount}</h3>
                </div>
              </td>
            </tr>
          </table>
        </section>

        <section class="card" style="background:#ffffff;border:1px solid #d6e2ec;border-radius:14px;padding:12px 14px;margin-bottom:12px;">
          <h3 style="margin:0 0 10px;font-size:16px;color:#102a43;">Status Breakdown</h3>
          <table role="presentation" width="100%" style="border-collapse:collapse;">
            <tr>
              <td class="donut-col" style="width:160px;vertical-align:top;text-align:center;padding:6px 8px 4px;">
                ${donutHtml}
              </td>
              <td class="status-col" style="vertical-align:top;padding:4px 2px 2px 12px;">
                <table width="100%" style="border-collapse:collapse;">
                  <thead>
                    <tr>
                      <th style="text-align:left;padding:6px 8px;border-bottom:1px solid #d9dee5;color:#486581;font-size:12px;">Status</th>
                      <th style="text-align:right;padding:6px 8px;border-bottom:1px solid #d9dee5;color:#486581;font-size:12px;">Count</th>
                      <th style="text-align:right;padding:6px 8px;border-bottom:1px solid #d9dee5;color:#486581;font-size:12px;">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${statusLegend}
                  </tbody>
                </table>
              </td>
            </tr>
          </table>
        </section>

        <section class="card" style="background:#ffffff;border:1px solid #d6e2ec;border-radius:14px;padding:12px;">
          <h3 style="margin:0 0 10px;font-size:16px;color:#102a43;">Licence Register</h3>
          <div class="register-wrap" style="width:100%;">
          <table class="register-table" style="border-collapse:collapse; width:100%;">
            <thead>
              <tr>
                <th style="padding:8px;border:1px solid #c8d5df;text-align:left;background:#f3f7fa;">#</th>
                <th style="padding:8px;border:1px solid #c8d5df;text-align:left;background:#f3f7fa;">License/Vendor name</th>
                <th style="padding:8px;border:1px solid #c8d5df;text-align:left;background:#f3f7fa;">Category</th>
                <th style="padding:8px;border:1px solid #c8d5df;text-align:left;background:#f3f7fa;">Licence Number</th>
                <th style="padding:8px;border:1px solid #c8d5df;text-align:left;background:#f3f7fa;">Valid from</th>
                <th style="padding:8px;border:1px solid #c8d5df;text-align:left;background:#f3f7fa;">Valid till</th>
                <th style="padding:8px;border:1px solid #c8d5df;text-align:left;background:#f3f7fa;">Remaining days</th>
                <th style="padding:8px;border:1px solid #c8d5df;text-align:left;background:#f3f7fa;">Status</th>
                <th style="padding:8px;border:1px solid #c8d5df;text-align:left;background:#f3f7fa;">Action</th>
                <th style="padding:8px;border:1px solid #c8d5df;text-align:left;background:#f3f7fa;">Documents</th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="10" style="padding:10px;border:1px solid #d9dee5;">No license records found.</td></tr>'}
            </tbody>
          </table>
          </div>
        </section>
      </div>
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

    const subject = `Compliverse Dashboard: ${summary.expiringSoonCount} expiring soon, ${summary.expiredCount} expired`
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
        activeCount: summary.activeCount,
        expiredCount: summary.expiredCount,
        expiringSoonCount: summary.expiringSoonCount,
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