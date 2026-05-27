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

export async function exportElementToPdf(options: {
  element: HTMLElement
  filePrefix: string
  title?: string
}) {
  const { element, filePrefix, title } = options

  const popup = window.open('', '_blank', 'width=1200,height=900')
  if (!popup) {
    throw new Error('Popup blocked')
  }

  const styles = collectStyles(document)
  const date = new Date().toISOString().slice(0, 10)
  const reportTitle = title || 'Dashboard Report'
  const fileName = nextPdfFileName(filePrefix, date)

  popup.document.open()
  popup.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${fileName}</title>
    ${styles}
    <style>
      @page {
        size: A4 landscape;
        margin: 10mm;
      }

      body {
        margin: 24px;
        color: #102a43;
      }

      .pdf-meta {
        font: 600 12px/1.3 ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
        color: #486581;
        margin-bottom: 14px;
      }

      @media print {
        body {
          margin: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .contentGrid {
          grid-template-columns: 1fr !important;
          gap: 12px !important;
        }

        .statusPanel {
          width: 100% !important;
          justify-self: stretch !important;
          order: 0 !important;
        }

        .tableWrap {
          overflow: visible !important;
          max-height: none !important;
        }

        table {
          min-width: 0 !important;
          width: 100% !important;
          table-layout: fixed;
          border-collapse: collapse !important;
          border-spacing: 0 !important;
        }

        thead {
          display: table-header-group !important;
        }

        tbody {
          display: table-row-group !important;
        }

        tr {
          display: table-row !important;
        }

        thead th {
          position: static !important;
        }

        th,
        td {
          display: table-cell !important;
          padding: 6px 5px !important;
          font-size: 11px !important;
          word-break: break-word;
          vertical-align: top;
        }

        td::before {
          content: none !important;
          display: none !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="pdf-meta">${reportTitle} | ${fileName}</div>
    ${element.outerHTML}
  </body>
</html>`)
  popup.document.close()

  await new Promise<void>((resolve) => {
    const done = () => {
      resolve()
    }

    popup.onload = done
    window.setTimeout(done, 350)
  })

  popup.focus()
  popup.onafterprint = () => {
    popup.close()
  }
  popup.print()
}