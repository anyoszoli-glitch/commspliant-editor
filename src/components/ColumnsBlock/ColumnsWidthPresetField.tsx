import { createUsePuck, type Config } from '@puckeditor/core'
import {
  getColumnCount,
  getColumnWidthPresets,
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
  const widthPreset = normalizeColumnsWidthPreset(value?.widthPreset, count)

  return (
    <label className="commspliant-columns-field__option">
      <span>{t('columnWidths')}</span>
      <select
        aria-label={t('columnWidths')}
        value={widthPreset}
        disabled={readOnly}
        onChange={(event) => onChange({ widthPreset: event.currentTarget.value as ColumnWidthPreset })}
      >
        {presets.map((preset) => (
          <option key={preset} value={preset}>{t(presetLabels[preset])}</option>
        ))}
      </select>
    </label>
  )
}
