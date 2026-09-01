import type { ChangeEvent } from 'react'
import type { TableAlignment, TableData } from '../../document/document'
import {
  addTableColumn,
  addTableRow,
  deleteTableColumn,
  deleteTableRow,
  normalizeTableData,
  updateTableCell,
} from './tableModel'

type TableEditorFieldProps = {
  value: TableData
  onChange: (value: TableData) => void
  readOnly?: boolean
}

export function TableEditorField({ value, onChange, readOnly = false }: TableEditorFieldProps) {
  const table = normalizeTableData(value)
  const columns = table.rows[0].cells.length

  const changeCell = (rowIndex: number, columnIndex: number) => (
    event: ChangeEvent<HTMLInputElement>,
  ) => onChange(updateTableCell(table, rowIndex, columnIndex, event.target.value))

  return (
    <div className="commspliant-table-field">
      <label className="commspliant-table-field__option">
        <input
          type="checkbox"
          checked={table.headerRow}
          disabled={readOnly}
          onChange={(event) => onChange({ ...table, headerRow: event.target.checked })}
        />
        Header row
      </label>
      <label className="commspliant-table-field__option">
        <span>Text alignment</span>
        <select
          aria-label="Table text alignment"
          value={table.alignment}
          disabled={readOnly}
          onChange={(event) => onChange({ ...table, alignment: event.target.value as TableAlignment })}
        >
          <option value="left">Left</option>
          <option value="center">Centre</option>
          <option value="right">Right</option>
        </select>
      </label>
      <div className="commspliant-table-field__actions">
        <button type="button" disabled={readOnly} onClick={() => onChange(addTableRow(table))}>Add row</button>
        <button type="button" disabled={readOnly || table.rows.length <= 1} onClick={() => onChange(deleteTableRow(table))}>Delete row</button>
        <button type="button" disabled={readOnly} onClick={() => onChange(addTableColumn(table))}>Add column</button>
        <button type="button" disabled={readOnly || columns <= 1} onClick={() => onChange(deleteTableColumn(table))}>Delete column</button>
      </div>
      <div className="commspliant-table-field__rows">
        {table.rows.map((row, rowIndex) => (
          <fieldset key={rowIndex}>
            <legend>{table.headerRow && rowIndex === 0 ? 'Header row' : `Row ${rowIndex + 1}`}</legend>
            {row.cells.map((cell, columnIndex) => (
              <input
                key={columnIndex}
                type="text"
                aria-label={`Row ${rowIndex + 1}, column ${columnIndex + 1}`}
                value={cell}
                disabled={readOnly}
                placeholder={`Column ${columnIndex + 1}`}
                onChange={changeCell(rowIndex, columnIndex)}
              />
            ))}
          </fieldset>
        ))}
      </div>
    </div>
  )
}
