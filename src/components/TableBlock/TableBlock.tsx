import type { TableData } from '../../document/document'
import { normalizeTableData } from './tableModel'

type TableBlockProps = {
  table: TableData
}

export function TableBlock({ table }: TableBlockProps) {
  const value = normalizeTableData(table)

  return (
    <div className="commspliant-table-block">
      <table>
        <tbody>
          {value.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.cells.map((cell, columnIndex) => {
                const Cell = value.headerRow && rowIndex === 0 ? 'th' : 'td'
                return (
                  <Cell key={columnIndex} style={{ textAlign: value.alignment }}>
                    {cell || '\u00a0'}
                  </Cell>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
