function collectStyles(documentRef: Document) {
  const styleNodes = Array.from(documentRef.querySelectorAll('style, link[rel="stylesheet"]'))
  return styleNodes.map((node) => node.outerHTML).join('\n')
}

const pdfNameCounters = new Map<string, number>()

function nextPdfFileName(filePrefix: string, date: string) {
  const base = `${filePrefix}-${date}`
  const next = (pdfNameCounters.get(base) ?? 0) + 1
  pdfNameCounters.set(base, next)

  return next === 1 ? `${base}.pdf` : `${base} (${next - 1}).pdf`
}

function toPathSafeName(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function exportElementToPdf(options: {
  element: HTMLElement
  filePrefix: string
  title?: string
  summary?: {
    totalLicences: number
    activeLicences: number
    expiredLicences: number
    expiringSoonLicences: number
  }
  statusBreakdown?: Array<{
    label: string
    count: number
    color: string
  }>
}) {
  const { element, filePrefix, title, summary, statusBreakdown } = options

  const popup = window.open('/compliverse-report', '_blank', 'width=1200,height=900')
  if (!popup) {
    throw new Error('Popup blocked')
  }

  const styles = collectStyles(document)
  const date = new Date().toISOString().slice(0, 10)
  const reportTitle = title || 'Dashboard Report'
  const generatedLabel = `Generated on ${date}`
  const fileName = nextPdfFileName(filePrefix, date)
  const printTitle = fileName.replace(/\.pdf$/i, '')
  const printPath = `/${toPathSafeName(printTitle)}`
  const totalStatuses = (statusBreakdown ?? []).reduce((acc, item) => acc + item.count, 0)
  let cumulativePercent = 0
  const donutGradient = totalStatuses > 0
    ? (statusBreakdown ?? [])
      .map((item) => {
        const start = cumulativePercent
        cumulativePercent += (item.count / totalStatuses) * 100
        return `${item.color} ${start.toFixed(2)}% ${cumulativePercent.toFixed(2)}%`
      })
      .join(', ')
    : '#d9dee5 0% 100%'
  const statusLegendItems = (statusBreakdown ?? [])
    .map((item) => {
      const share = totalStatuses > 0 ? Math.round((item.count / totalStatuses) * 100) : 0
      return `<li>
        <span class="pdf-status-dot" style="--status-color: ${item.color};"></span>
        <span class="pdf-status-label">${item.label}</span>
        <strong>${item.count}</strong>
        <small>${share}%</small>
      </li>`
    })
    .join('')

  popup.document.open()
  popup.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${printTitle}</title>
    ${styles}
    <style>
      @page {
        size: A4 landscape;
        margin: 10mm;
      }

      body {
        margin: 16px;
        color: #102a43;
      }

      .pdf-meta {
        font: 600 12px/1.3 ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
        color: #486581;
        margin-bottom: 10px;
      }

      .pdf-meta strong {
        display: block;
        color: #102a43;
        margin-bottom: 2px;
      }

      .pdf-summary {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
        margin: 0 0 10px;
      }

      .pdf-summary-card {
        border: 1px solid #c8d5df;
        border-radius: 10px;
        background: #f8fbfd;
        padding: 7px 10px;
      }

      .pdf-summary-label {
        display: block;
        color: #486581;
        font: 600 10px/1.2 ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
        letter-spacing: 0.02em;
      }

      .pdf-summary-value {
        display: block;
        color: #102a43;
        font: 700 18px/1.2 ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
        margin-top: 4px;
      }

      .pdf-status-section {
        border: 1px solid #c8d5df;
        border-radius: 12px;
        background: #f8fbfd;
        padding: 10px;
        margin-top: 10px;
      }

      .pdf-status-title {
        margin: 0 0 8px;
        font: 700 12px/1.3 ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
        color: #102a43;
      }

      .pdf-status-layout {
        display: grid;
        grid-template-columns: 130px 1fr;
        align-items: center;
        gap: 12px;
      }

      .pdf-status-donut {
        width: 108px;
        height: 108px;
        border-radius: 50%;
        background: conic-gradient(${donutGradient});
        position: relative;
        margin: 0 auto;
      }

      .pdf-status-donut::after {
        content: '';
        position: absolute;
        inset: 23px;
        border-radius: 50%;
        background: #fff;
        border: 1px solid #d9dee5;
      }

      .pdf-status-total {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        z-index: 1;
        text-align: center;
      }

      .pdf-status-total strong {
        display: block;
        color: #102a43;
        font: 700 16px/1.1 ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
      }

      .pdf-status-total span {
        display: block;
        color: #486581;
        font: 600 10px/1.1 ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
      }

      .pdf-status-legend {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 6px;
      }

      .pdf-status-legend li {
        display: grid;
        grid-template-columns: 10px 1fr auto auto;
        gap: 6px;
        align-items: center;
        border: 1px solid #d9dee5;
        border-radius: 8px;
        background: #fff;
        padding: 5px 7px;
      }

      .pdf-status-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--status-color);
      }

      .pdf-status-label {
        font: 600 10px/1.2 ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
        color: #102a43;
      }

      .pdf-status-legend strong {
        font: 700 10px/1.2 ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
        color: #102a43;
      }

      .pdf-status-legend small {
        font: 600 9px/1.2 ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
        color: #486581;
      }

      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }

        body {
          margin: 0;
          padding: 0;
        }

        .dashboardBody {
          display: block !important;
          grid-template-columns: unset !important;
          gap: 0 !important;
        }

        .register {
          min-width: 0 !important;
          width: 100% !important;
          page-break-inside: avoid;
          padding: 10px !important;
        }

        .tableWrap {
          overflow: visible !important;
          width: 100% !important;
        }

        table {
          width: 100% !important;
          table-layout: auto;
          border-collapse: collapse !important;
          border-spacing: 0 !important;
          font-size: 10px !important;
        }

        thead {
          display: table-header-group !important;
        }

        tbody {
          display: table-row-group !important;
        }

        tr {
          display: table-row !important;
          page-break-inside: avoid;
        }

        thead tr {
          page-break-inside: avoid;
          page-break-after: avoid;
        }

        th,
        td {
          display: table-cell !important;
          padding: 5px 4px !important;
          font-size: 9px !important;
          word-break: break-word;
          vertical-align: top;
          border: 1px solid #d9dee5 !important;
        }

        thead th {
          position: static !important;
          background: #f3f7fa !important;
          font-weight: 600 !important;
          border: 1px solid #c8d5df !important;
        }

        .badge {
          font-size: 8px !important;
          padding: 2px 6px !important;
        }

        .card {
          page-break-inside: avoid;
          margin-bottom: 8px;
        }

        [class*='exportDropdown'],
        [class*='tableFilterRow'],
        [class*='sideColumn'],
        [class*='quickActionsPanel'],
        [class*='statusPanel'],
        [class*='profileMenu'],
        [class*='quickActionsButtons'],
        [class*='rowActions'] {
          display: none !important;
        }

        .pdf-summary {
          margin-bottom: 10px;
          page-break-inside: avoid;
        }

        .pdf-status-section {
          margin-top: 8px;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .sectionHead h3 {
          font-size: 12px !important;
          margin: 0 0 8px 0 !important;
        }

        a {
          color: #0e5f8b !important;
          text-decoration: underline !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="pdf-meta"><strong>${reportTitle}</strong>${generatedLabel}</div>
    ${summary ? `<section class="pdf-summary" aria-label="Licence summary">
      <article class="pdf-summary-card">
        <span class="pdf-summary-label">Total licences</span>
        <span class="pdf-summary-value">${summary.totalLicences}</span>
      </article>
      <article class="pdf-summary-card">
        <span class="pdf-summary-label">Active licences</span>
        <span class="pdf-summary-value">${summary.activeLicences}</span>
      </article>
      <article class="pdf-summary-card">
        <span class="pdf-summary-label">Expired licences</span>
        <span class="pdf-summary-value">${summary.expiredLicences}</span>
      </article>
      <article class="pdf-summary-card">
        <span class="pdf-summary-label">Expiring soon</span>
        <span class="pdf-summary-value">${summary.expiringSoonLicences}</span>
      </article>
    </section>` : ''}
    ${element.outerHTML}
    ${totalStatuses > 0 ? `<section class="pdf-status-section" aria-label="Status breakdown">
      <h3 class="pdf-status-title">Status Breakdown</h3>
      <div class="pdf-status-layout">
        <div class="pdf-status-donut" aria-hidden="true">
          <div class="pdf-status-total">
            <div>
              <strong>${totalStatuses}</strong>
              <span>Total</span>
            </div>
          </div>
        </div>
        <ul class="pdf-status-legend">
          ${statusLegendItems}
        </ul>
      </div>
    </section>` : ''}
  </body>
</html>`)
  popup.document.close()
  popup.document.title = printTitle

  try {
    popup.history.replaceState({}, '', printPath)
  } catch {
    // Ignore history/title fallback failures and continue printing.
  }

  await new Promise<void>((resolve) => {
    const done = () => {
      resolve()
    }

    if (popup.document.readyState === 'complete') {
      window.setTimeout(done, 120)
      return
    }

    popup.onload = done
    window.setTimeout(done, 220)
  })

  popup.focus()
  popup.onafterprint = () => {
    popup.close()
  }
  popup.print()
}