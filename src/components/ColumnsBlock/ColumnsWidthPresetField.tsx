import { createUsePuck, type Config } from '@puckeditor/core'
import {
  getColumnCount,
  getColumnWidthPresets,
  MAX_COLUMNS_GAP,
  MAX_COLUMNS_PADDING,
  MAX_COLUMNS_MIN_HEIGHT,
  normalizeColumnsLayout,
  normalizeColumnsWidthPreset,
  type ColumnWidthPreset,
  type ColumnsLayout,
  type EditorComponents,
} from '../../document/document'
import type { Translate } from '../../i18n'

const useColumnsPuck = createUsePuck<Config<EditorComponents>>()

const presetLabels: Record<ColumnWidthPreset, 'width50_50' | 'width25_75' | 'width75_25' | 'width33_67' | 'width67_33' | 'width33_33_33' | 'width25_50_25' | 'width25_25_25_25'> = {
  '50-50': 'width50_50',
  '25-75': 'width25_75',
  '75-25': 'width75_25',
  '33-67': 'width33_67',
  '67-33': 'width67_33',
  '33-33-33': 'width33_33_33',
  '25-50-25': 'width25_50_25',
  '25-25-25-25': 'width25_25_25_25',
}

type ColumnsWidthPresetFieldProps = {
  value: ColumnsLayout
  onChange: (value: ColumnsLayout) => void
  readOnly?: boolean
  t: Translate
}

export function ColumnsWidthPresetField({ value, onChange, readOnly = false, t }: ColumnsWidthPresetFieldProps) {
  const count = useColumnsPuck((state) =>
    state.selectedItem?.type === 'ColumnsBlock' ? getColumnCount(state.selectedItem.props.columns) : 2,
  )
  const presets = getColumnWidthPresets(count)
  const layout = normalizeColumnsLayout(value, count)
  const widthPreset = normalizeColumnsWidthPreset(layout.widthPreset, count)
  const updateSpacing = (key: 'gap' | 'padding', input: string) => {
    const numericValue = Number(input)
    onChange({
      ...layout,
      [key]: Number.isFinite(numericValue) ? numericValue : layout[key],
    })
  }
  const updateMinimumHeight = (input: string) => {
    const numericValue = Number(input)
    onChange({ ...layout, minHeight: Number.isFinite(numericValue) ? numericValue : layout.minHeight })
  }

  return (
    <div className="commspliant-columns-field__option">
      <label>
        <span>{t('columnWidths')}</span>
        <select
          aria-label={t('columnWidths')}
          value={widthPreset}
          disabled={readOnly}
          onChange={(event) => onChange({ ...layout, widthPreset: event.currentTarget.value as ColumnWidthPreset })}
        >
          {presets.map((preset) => (
            <option key={preset} value={preset}>{t(presetLabels[preset])}</option>
          ))}
        </select>
      </label>
      <div>
        <span className="commspliant-columns-field__option-label">{t('columnGap')}</span>
        <label className="commspliant-columns-field__number">
        <input
          aria-label={t('columnGap')}
          type="number"
          min={0}
          max={MAX_COLUMNS_GAP}
          step={1}
          value={layout.gap}
          disabled={readOnly}
          onChange={(event) => updateSpacing('gap', event.currentTarget.value)}
        />
        <span>px</span>
        </label>
      </div>
      <label>
        <span>{t('height')}</span>
        <select aria-label={t('height')} value={layout.heightMode} disabled={readOnly} onChange={(event) => onChange({ ...layout, heightMode: event.currentTarget.value as 'auto' | 'custom' })}>
          <option value="auto">{t('automatic')}</option>
          <option value="custom">{t('customMinimumHeight')}</option>
        </select>
      </label>
      {layout.heightMode === 'custom' && (
        <div>
          <span className="commspliant-columns-field__option-label">{t('minimumHeight')}</span>
          <label className="commspliant-columns-field__number">
            <input aria-label={t('minimumHeight')} type="number" min={0} max={MAX_COLUMNS_MIN_HEIGHT} step={1} value={layout.minHeight} disabled={readOnly} onChange={(event) => updateMinimumHeight(event.currentTarget.value)} />
            <span>px</span>
          </label>
        </div>
      )}
      <div>
        <span className="commspliant-columns-field__option-label">{t('internalPadding')}</span>
        <label className="commspliant-columns-field__number">
        <input
          aria-label={t('internalPadding')}
          type="number"
          min={0}
          max={MAX_COLUMNS_PADDING}
          step={1}
          value={layout.padding}
          disabled={readOnly}
          onChange={(event) => updateSpacing('padding', event.currentTarget.value)}
        />
        <span>px</span>
        </label>
      </div>
    </div>
  )
}
