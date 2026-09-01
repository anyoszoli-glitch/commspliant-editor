import { describe, expect, it } from 'vitest'
import {
  addTableColumn,
  addTableRow,
  defaultTableData,
  deleteTableColumn,
  deleteTableRow,
  normalizeTableData,
  updateTableCell,
} from './tableModel'

describe('table model', () => {
  it('edits cells immutably without changing the table shape', () => {
    const updated = updateTableCell(defaultTableData, 1, 2, 'Updated')

    expect(updated.rows[1].cells).toEqual(['', '', 'Updated'])
    expect(defaultTableData.rows[1].cells).toEqual(['', '', ''])
  })

  it('adds and deletes rows and columns while keeping at least one cell', () => {
    const expanded = addTableColumn(addTableRow(defaultTableData))

    expect(expanded.rows).toHaveLength(4)
    expect(expanded.rows.every((row) => row.cells.length === 4)).toBe(true)
    expect(expanded.rows[0].cells[3]).toBe('Column 4')

    const contracted = deleteTableColumn(deleteTableRow(expanded))
    expect(contracted).toEqual(defaultTableData)

    const singleCell = { headerRow: false, alignment: 'left' as const, rows: [{ cells: ['Only'] }] }
    expect(deleteTableRow(singleCell)).toEqual(singleCell)
    expect(deleteTableColumn(singleCell)).toEqual(singleCell)
  })

  it('normalizes uneven or empty table data safely', () => {
    expect(normalizeTableData({
      headerRow: false,
      alignment: 'center',
      rows: [{ cells: ['A'] }, { cells: ['B', 'C'] }],
    })).toEqual({
      headerRow: false,
      alignment: 'center',
      rows: [{ cells: ['A', ''] }, { cells: ['B', 'C'] }],
    })
  })
})
