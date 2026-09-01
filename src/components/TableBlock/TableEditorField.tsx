import type { ChangeEvent } from 'react'
import type { TableAlignment, TableData } from '../../document/document'
import type { Translate } from '../../i18n'
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
  t: Translate
}

export function TableEditorField({ value, onChange, readOnly = false, t }: TableEditorFieldProps) {
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
        {t('headerRow')}
      </label>
      <label className="commspliant-table-field__option">
        <span>{t('textAlignment')}</span>
        <select
          aria-label={t('tableTextAlignment')}
          value={table.alignment}
          disabled={readOnly}
          onChange={(event) => onChange({ ...table, alignment: event.target.value as TableAlignment })}
        >
          <option value="left">{t('left')}</option>
          <option value="center">{t('centre')}</option>
          <option value="right">{t('right')}</option>
        </select>
      </label>
      <div className="commspliant-table-field__actions">
        <button type="button" disabled={readOnly} onClick={() => onChange(addTableRow(table))}>{t('addRow')}</button>
        <button type="button" disabled={readOnly || table.rows.length <= 1} onClick={() => onChange(deleteTableRow(table))}>{t('deleteRow')}</button>
        <button type="button" disabled={readOnly} onClick={() => onChange(addTableColumn(table))}>{t('addColumn')}</button>
        <button type="button" disabled={readOnly || columns <= 1} onClick={() => onChange(deleteTableColumn(table))}>{t('deleteColumn')}</button>
      </div>
      <div className="commspliant-table-field__rows">
        {table.rows.map((row, rowIndex) => (
          <fieldset key={rowIndex}>
            <legend>{table.headerRow && rowIndex === 0 ? t('headerRow') : t('row', { row: rowIndex + 1 })}</legend>
            {row.cells.map((cell, columnIndex) => (
              <input
                key={columnIndex}
                type="text"
                aria-label={t('tableCell', { row: rowIndex + 1, column: columnIndex + 1 })}
                value={cell}
                disabled={readOnly}
                placeholder={t('column', { column: columnIndex + 1 })}
                onChange={changeCell(rowIndex, columnIndex)}
              />
            ))}
          </fieldset>
        ))}
      </div>
    </div>
  )
}
