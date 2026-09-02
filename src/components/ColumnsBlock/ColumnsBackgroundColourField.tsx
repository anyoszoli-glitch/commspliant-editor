import { createUsePuck, type Config } from '@puckeditor/core'
import { CustomColourPicker } from '../ColourPicker/CustomColourPicker'
import {
  getColumnCount,
  normalizeColumnBackgroundColour,
  normalizeColumnBackgrounds,
  type ColumnBackgrounds,
  type ColumnId,
  type EditorComponents,
} from '../../document/document'
import type { Translate, TranslationKey } from '../../i18n'

const useColumnsPuck = createUsePuck<Config<EditorComponents>>()

const columns: Array<{ id: ColumnId; label: TranslationKey }> = [
  { id: 'left', label: 'columnOneBackground' },
  { id: 'right', label: 'columnTwoBackground' },
  { id: 'third', label: 'columnThreeBackground' },
  { id: 'fourth', label: 'columnFourBackground' },
]

type ColumnsBackgroundColourFieldProps = {
  value?: ColumnBackgrounds
  onChange: (value: ColumnBackgrounds) => void
  readOnly?: boolean
  t: Translate
}

export function ColumnsBackgroundColourField({
  value,
  onChange,
  readOnly = false,
  t,
}: ColumnsBackgroundColourFieldProps) {
  const count = useColumnsPuck((state) =>
    state.selectedItem?.type === 'ColumnsBlock' ? getColumnCount(state.selectedItem.props.columns) : 2,
  )
  const backgrounds = normalizeColumnBackgrounds(value)

  const setColour = (id: ColumnId, value: unknown) => {
    const colour = normalizeColumnBackgroundColour(value)
    const next = { ...backgrounds }
    if (colour) next[id] = colour
    else delete next[id]
    onChange(next)
  }

  return (
    <fieldset className="commspliant-columns-backgrounds" disabled={readOnly}>
      <legend>{t('columnBackgrounds')}</legend>
      {columns.slice(0, count).map((column) => {
        const colour = backgrounds[column.id]
        const label = t(column.label)

        return (
          <div className="commspliant-columns-backgrounds__row" key={column.id}>
            <span>{label}</span>
            <span className="commspliant-columns-backgrounds__value">
              <span
                className="commspliant-columns-backgrounds__swatch"
                aria-hidden="true"
                data-transparent={colour ? undefined : 'true'}
                style={colour ? { backgroundColor: colour } : undefined}
              />
              <output>{colour ?? t('transparent')}</output>
            </span>
            <CustomColourPicker
              ariaLabel={label}
              value={colour}
              fallbackColour="#ffffff"
              disabled={readOnly}
              className="commspliant-columns-backgrounds__picker"
              onChange={(value) => setColour(column.id, value)}
            />
            <button
              type="button"
              className="commspliant-columns-backgrounds__clear"
              disabled={readOnly || !colour}
              onClick={() => setColour(column.id, undefined)}
            >
              {t('clearColour')}
            </button>
          </div>
        )
      })}
    </fieldset>
  )
}
