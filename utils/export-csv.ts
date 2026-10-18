/**
 * 纯前端 CSV 导出工具函数
 * 支持 UTF-8 BOM 编码，确保 Excel 中文打开不乱码
 */

export interface CsvExportOptions {
  filename: string
  headers: string[]
  rows: (string | number | boolean | null | undefined)[][]
}

export function exportToCsv({ filename, headers, rows }: CsvExportOptions): void {
  if (typeof window === 'undefined') return

  const escapeCell = (cell: string | number | boolean | null | undefined): string => {
    if (cell === null || cell === undefined) return ''
    const str = String(cell)
    // 如果包含逗号、双引号、换行符，需用双引号包裹，且内部双引号转义为两个双引号
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const csvRows: string[] = []

  // 表头行
  csvRows.push(headers.map(escapeCell).join(','))

  // 数据行
  for (const row of rows) {
    csvRows.push(row.map(escapeCell).join(','))
  }

  // 拼接 CSV 内容并添加 UTF-8 BOM (\uFEFF)
  const csvContent = '\uFEFF' + csvRows.join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)

  const sanitizedFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`
  link.setAttribute('download', sanitizedFilename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
