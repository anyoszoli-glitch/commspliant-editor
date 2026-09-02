import { useEffect, useState } from 'react'
import { createUsePuck, type Config } from '@puckeditor/core'
import {
  getColumnCount,
  getColumnsForCount,
  type ColumnCount,
  type ColumnDefinition,
  type EditorComponents,
} from '../../document/document'
import type { Translate } from '../../i18n'

const useColumnsPuck = createUsePuck<Config<EditorComponents>>()

type ColumnsEditorFieldProps = {
  value: ColumnDefinition[]
  onChange: (value: ColumnDefinition[]) => void
  readOnly?: boolean
  t: Translate
}

function hasContent(value: unknown) {
  return Array.isArray(value) && value.length > 0
}

export function ColumnsEditorField({
  value,
  onChange,
  readOnly = false,
  t,
}: ColumnsEditorFieldProps) {
  const activeCount = getColumnCount(value)
  const hiddenSlotMask = useColumnsPuck((state) => {
    const block = state.selectedItem
    if (!block || block.type !== 'ColumnsBlock') return '00'

    return `${hasContent(block.props.thirdColumn) ? '1' : '0'}${hasContent(block.props.fourthColumn) ? '1' : '0'}`
  })
  const slots = { third: hiddenSlotMask[0] === '1', fourth: hiddenSlotMask[1] === '1' }
  const [pendingCount, setPendingCount] = useState<ColumnCount>()

  useEffect(() => {
    setPendingCount(undefined)
  }, [activeCount])

  const hiddenContent = (count: ColumnCount) =>
    (count < 3 && slots.third) || (count < 4 && slots.fourth)

  const selectCount = (count: ColumnCount) => {
    if (count === activeCount || readOnly) return
    if (count < activeCount && hiddenContent(count)) {
      setPendingCount(count)
      return
    }
    onChange(getColumnsForCount(count))
  }

  return (
    <div className="commspliant-columns-field">
      <label className="commspliant-columns-field__option">
        <span>{t('columnCount')}</span>
        <select
          aria-label={t('columnCount')}
          value={activeCount}
          disabled={readOnly}
          onChange={(event) => selectCount(Number(event.currentTarget.value) as ColumnCount)}
        >
          <option value={2}>{t('twoColumns')}</option>
          <option value={3}>{t('threeColumns')}</option>
          <option value={4}>{t('fourColumns')}</option>
        </select>
      </label>
      {pendingCount !== undefined && (
        <div className="commspliant-columns-field__warning" role="alert">
          <p>{t('hiddenColumnsWarning')}</p>
          <div>
            <button type="button" onClick={() => setPendingCount(undefined)}>
              {t('cancel')}
            </button>
            <button type="button" onClick={() => onChange(getColumnsForCount(pendingCount))}>
              {t('hideAndPreserve')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
