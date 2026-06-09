/* load_data.js — single source of data truth.
 *
 * Fetches the workbook once at runtime and converts every sheet into
 * a CSV string. Each chart's load() function is responsible for the
 * d3.csvParse step (per the coding plan), so this module deliberately
 * stops at "string per sheet".
 */

import * as XLSX from 'xlsx'

const XLSX_PATH = `${import.meta.env.BASE_URL}datasets/transformed_datasets.xlsx`

export async function loadData(path = XLSX_PATH) {
  const buf = await fetch(path).then((r) => {
    if (!r.ok) throw new Error(`failed to fetch ${path} (HTTP ${r.status})`)
    return r.arrayBuffer()
  })
  const wb = XLSX.read(buf, { type: 'array' })

  const sheets = {}
  for (const name of wb.SheetNames) {
    sheets[name] = XLSX.utils.sheet_to_csv(wb.Sheets[name])
  }
  return sheets
}
