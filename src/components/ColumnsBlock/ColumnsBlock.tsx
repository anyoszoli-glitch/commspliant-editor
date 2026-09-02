import type { SlotComponent } from '@puckeditor/core'
import type { ColumnDefinition, ColumnsLayout } from '../../document/document'
import { useTranslation } from '../../i18n'

type ColumnsBlockProps = {
  columns: readonly ColumnDefinition[]
  layout: ColumnsLayout
  leftColumn: SlotComponent
  rightColumn: SlotComponent
  showEmptyGuidance?: boolean
}

export function ColumnsBlock({
  columns,
  layout,
  leftColumn: LeftColumn,
  rightColumn: RightColumn,
  showEmptyGuidance = false,
}: ColumnsBlockProps) {
  const t = useTranslation()
  const slots = { leftColumn: LeftColumn, rightColumn: RightColumn }

  return (
    <section
      className="commspliant-columns-block"
      data-columns-block
      data-columns-preset={layout.widthPreset}
      aria-label={t('columns')}
    >
      {columns.map((column) => {
        const ColumnSlot = slots[column.slot]
        const label = column.id === 'left' ? t('leftColumn') : t('rightColumn')

        return (
          <section
            className="commspliant-columns-block__column"
            data-columns-column={column.id}
            aria-label={label}
            key={column.id}
          >
            <span className="commspliant-columns-block__column-label" aria-hidden="true">
              {label}
            </span>
            <ColumnSlot
              className="commspliant-columns-block__slot"
              collisionAxis="y"
              minEmptyHeight={96}
            />
            {showEmptyGuidance && (
              <span className="commspliant-columns-block__empty-guidance" aria-hidden="true">
                {t('columnsEmptyGuidance')}
              </span>
            )}
          </section>
        )
      })}
    </section>
  )
}
