import type { CSSProperties } from 'react'
import type { SlotComponent } from '@puckeditor/core'
import type { ColumnDefinition, ColumnsLayout } from '../../document/document'
import { DEFAULT_COLUMNS_GAP, DEFAULT_COLUMNS_PADDING } from '../../document/document'
import { useTranslation } from '../../i18n'

type ColumnsBlockProps = {
  columns: readonly ColumnDefinition[]
  layout: ColumnsLayout
  leftColumn: SlotComponent
  rightColumn: SlotComponent
  thirdColumn: SlotComponent
  fourthColumn: SlotComponent
  showEmptyGuidance?: boolean
}

export function ColumnsBlock({
  columns,
  layout,
  leftColumn: LeftColumn,
  rightColumn: RightColumn,
  thirdColumn: ThirdColumn,
  fourthColumn: FourthColumn,
  showEmptyGuidance = false,
}: ColumnsBlockProps) {
  const t = useTranslation()
  const slots = {
    leftColumn: LeftColumn,
    rightColumn: RightColumn,
    thirdColumn: ThirdColumn,
    fourthColumn: FourthColumn,
  }

  return (
    <section
      className="commspliant-columns-block"
      data-columns-block
      data-columns-count={columns.length}
      data-columns-preset={layout.widthPreset}
      aria-label={t('columns')}
      style={{ '--columns-gap': `${layout.gap ?? DEFAULT_COLUMNS_GAP}px`, '--columns-padding': `${layout.padding ?? DEFAULT_COLUMNS_PADDING}px` } as CSSProperties}
    >
      {columns.map((column) => {
        const ColumnSlot = slots[column.slot]
        const label =
          column.id === 'left'
            ? t('leftColumn')
            : column.id === 'right'
              ? t('rightColumn')
              : column.id === 'third'
                ? t('thirdColumn')
                : t('fourthColumn')

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
              minEmptyHeight={columns.length === 4 ? 72 : 96}
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
