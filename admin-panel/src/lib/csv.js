export function downloadCsv(filename, rows) {
  if (!rows || !rows.length) return
  const separator = ','
  const keys = Object.keys(rows[0])
  const csvContent = [
    keys.join(separator),
    ...rows.map((row) =>
      keys
        .map((k) => {
          let val = row[k] ?? ''
          if (typeof val === 'object' && val !== null) {
            val = JSON.stringify(val)
          }
          val = String(val).replace(/"/g, '""')
          if (val.search(/("|,|\n|\r)/g) >= 0) {
            val = `"${val}"`
          }
          return val
        })
        .join(separator),
    ),
  ].join('\r\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
