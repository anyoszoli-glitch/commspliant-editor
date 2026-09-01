import type { TableData, TableRow } from '../../document/document'

export const defaultTableData: TableData = {
  headerRow: true,
  alignment: 'left',
  rows: [
    { cells: ['Column 1', 'Column 2', 'Column 3'] },
    { cells: ['', '', ''] },
    { cells: ['', '', ''] },
  ],
}

function columnCount(rows: TableRow[]): number {
  return Math.max(1, ...rows.map((row) => row.cells.length))
}

export function normalizeTableData(value: TableData | undefined): TableData {
  const rows = value?.rows?.length ? value.rows : defaultTableData.rows
  const columns = columnCount(rows)

  return {
    headerRow: value?.headerRow ?? true,
    alignment: value?.alignment ?? 'left',
    rows: rows.map((row) => ({
      cells: Array.from({ length: columns }, (_, index) => String(row.cells[index] ?? '')),
    })),
  }
}

export function updateTableCell(
  table: TableData,
  rowIndex: number,
  columnIndex: number,
  value: string,
): TableData {
  const normalized = normalizeTableData(table)
  return {
    ...normalized,
    rows: normalized.rows.map((row, currentRow) => ({
      cells: row.cells.map((cell, currentColumn) =>
        currentRow === rowIndex && currentColumn === columnIndex ? value : cell,
      ),
    })),
  }
}

export function addTableRow(table: TableData): TableData {
  const normalized = normalizeTableData(table)
  const columns = columnCount(normalized.rows)
  return { ...normalized, rows: [...normalized.rows, { cells: Array(columns).fill('') }] }
}

export function deleteTableRow(table: TableData): TableData {
  const normalized = normalizeTableData(table)
  return normalized.rows.length > 1
    ? { ...normalized, rows: normalized.rows.slice(0, -1) }
    : normalized
}

export function addTableColumn(table: TableData): TableData {
  const normalized = normalizeTableData(table)
  return {
    ...normalized,
    rows: normalized.rows.map((row, rowIndex) => ({
      cells: [...row.cells, rowIndex === 0 && normalized.headerRow ? `Column ${row.cells.length + 1}` : ''],
    })),
  }
}

export function deleteTableColumn(table: TableData): TableData {
  const normalized = normalizeTableData(table)
  return normalized.rows[0].cells.length > 1
    ? {
        ...normalized,
        rows: normalized.rows.map((row) => ({ cells: row.cells.slice(0, -1) })),
      }
    : normalized
}
