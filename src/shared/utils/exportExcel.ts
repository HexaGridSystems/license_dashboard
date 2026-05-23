import * as XLSX from 'xlsx'

export type ExportColumn<T> = {
  header: string
  value: (row: T) => string
}

function toExportRows<T>(rows: T[], columns: ExportColumn<T>[]) {
  return rows.map((row) => {
    return columns.reduce<Record<string, string>>((acc, col) => {
      acc[col.header] = col.value(row)
      return acc
    }, {})
  })
}

export function exportRowsToExcel<T>(options: {
  rows: T[]
  columns: ExportColumn<T>[]
  filePrefix: string
}) {
  const { rows, columns, filePrefix } = options

  const exportRows = toExportRows(rows, columns)
  const worksheet = XLSX.utils.json_to_sheet(exportRows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Licence Register')

  const date = new Date().toISOString().slice(0, 10)
  const fileName = `${filePrefix}-${date}.xlsx`
  XLSX.writeFile(workbook, fileName)
}
