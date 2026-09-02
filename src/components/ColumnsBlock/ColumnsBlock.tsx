import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createUsePuck, registerOverlayPortal, type Config, type SlotComponent } from '@puckeditor/core'
import type { ColumnDefinition, ColumnSlotId, ColumnsLayout, EditorComponents } from '../../document/document'
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
  onAddText?: (slot: ColumnSlotId) => void
}

const useColumnsPuck = createUsePuck<Config<EditorComponents>>()

// 170mm is the default usable A4 width after the editor's 20mm side margins.
// Keep its existing 24px viewport gutter visible before changing the editing view.
const RESPONSIVE_COLUMNS_MIN_EDITING_WIDTH = Math.round((170 / 25.4) * 96) + 24

function useNarrowColumnsEditingView(enabled: boolean) {
  const [isNarrow, setIsNarrow] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setIsNarrow(false)
      return
    }

    const frameElement = window.frameElement
    const measure = () => {
      const width = frameElement?.getBoundingClientRect().width ?? window.innerWidth
      setIsNarrow(width < RESPONSIVE_COLUMNS_MIN_EDITING_WIDTH)
    }
    const observer = typeof ResizeObserver === 'undefined' || !frameElement
      ? undefined
      : new ResizeObserver(measure)

    if (observer && frameElement) observer.observe(frameElement)
    window.addEventListener('resize', measure)
    measure()

    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [enabled])

  return enabled && isNarrow
}

function EmptyColumnGuidance({
  slot,
  label,
  onAddText,
}: {
  slot: ColumnSlotId
  label: string
  onAddText: (slot: ColumnSlotId) => void
}) {
  const t = useTranslation()
  const addTextButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => registerOverlayPortal(addTextButtonRef.current, { disableDrag: true }), [])

  return (
    <div className="commspliant-columns-block__empty-guidance">
      <button
        ref={addTextButtonRef}
        className="commspliant-columns-block__add-text"
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onAddText(slot)
        }}
        aria-label={t('addTextToColumn', { column: label })}
      >
        {t('addText')}
      </button>
      <span>{t('columnsEmptyGuidance')}</span>
    </div>
  )
}

export function ColumnsBlock({
  columns,
  layout,
  leftColumn: LeftColumn,
  rightColumn: RightColumn,
  thirdColumn: ThirdColumn,
  fourthColumn: FourthColumn,
  showEmptyGuidance = false,
  onAddText,
}: ColumnsBlockProps) {
  const t = useTranslation()
  const isNarrowEditingView = useNarrowColumnsEditingView(showEmptyGuidance)
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
      data-columns-height-mode={layout.heightMode ?? 'auto'}
      data-columns-vertical-align={layout.verticalAlign ?? 'top'}
      data-columns-stacked={isNarrowEditingView ? 'true' : undefined}
      aria-label={t('columns')}
      style={{ '--columns-gap': `${layout.gap ?? DEFAULT_COLUMNS_GAP}px`, '--columns-padding': `${layout.padding ?? DEFAULT_COLUMNS_PADDING}px`, '--columns-min-height': `${layout.heightMode === 'custom' ? layout.minHeight ?? 0 : 0}px` } as CSSProperties}
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
            {showEmptyGuidance && (
              <span className="commspliant-columns-block__column-label" aria-hidden="true">
                {label}
              </span>
            )}
            <div className="commspliant-columns-block__content">
              <ColumnSlot
                className="commspliant-columns-block__slot"
                collisionAxis="y"
                minEmptyHeight={columns.length === 4 ? 72 : 96}
              />
            </div>
            {showEmptyGuidance && onAddText && (
              <EmptyColumnGuidance slot={column.slot} label={label} onAddText={onAddText} />
            )}
          </section>
        )
      })}
    </section>
  )
}

type ColumnsBlockAuthoringProps = Omit<ColumnsBlockProps, 'onAddText'> & {
  id: string
}

/** Connects empty-column guidance to Puck's public insert action in author mode only. */
export function ColumnsBlockAuthoring({ id, ...props }: ColumnsBlockAuthoringProps) {
  const dispatch = useColumnsPuck((state) => state.dispatch)

  return (
    <ColumnsBlock
      {...props}
      onAddText={(slot) => {
        dispatch({
          type: 'insert',
          componentType: 'TextBlock',
          destinationIndex: 0,
          destinationZone: `${id}:${slot}`,
          recordHistory: true,
        })
      }}
    />
  )
}
