import { useState } from 'react'
import type { DocumentLayout } from '../../document/document'
import {
  FLUID_WIDTH_MAX,
  FLUID_WIDTH_MIN,
  PAGED_MARGIN_MAX,
  PAGED_MARGIN_MIN,
  layoutValidationMessage,
  parseLayoutInteger,
  resetFluidContentWidth,
  resetPagedMargins,
  updateFluidContentWidth,
  updatePagedMargin,
  type PagedMargin,
} from './layoutSettingsModel'

type LayoutSettingsProps = {
  layout: DocumentLayout
  onChange: (layout: DocumentLayout) => void
  disabled?: boolean
}

const pagedMargins: Array<{ key: PagedMargin; label: string }> = [
  { key: 'top', label: 'Top margin' },
  { key: 'right', label: 'Right margin' },
  { key: 'bottom', label: 'Bottom margin' },
  { key: 'left', label: 'Left margin' },
]

export function LayoutSettings({ layout, onChange, disabled = false }: LayoutSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [resetVersion, setResetVersion] = useState(0)

  const updateValue = (
    field: string,
    rawValue: string,
    min: number,
    max: number,
    apply: (value: number) => void,
  ) => {
    const value = parseLayoutInteger(rawValue, min, max)
    if (value === undefined) {
      setErrors((current) => ({ ...current, [field]: layoutValidationMessage(min, max) }))
      return
    }
    setErrors((current) => {
      const { [field]: _error, ...remaining } = current
      return remaining
    })
    apply(value)
  }

  const reset = () => {
    setErrors({})
    setResetVersion((version) => version + 1)
    onChange(layout.mode === 'paged' ? resetPagedMargins(layout) : resetFluidContentWidth(layout))
  }

  const togglePanel = () => {
    if (isOpen) setErrors({})
    setIsOpen((open) => !open)
  }

  return (
    <div className="document-editor__layout-settings">
      <button
        type="button"
        className="document-editor__layout-settings-toggle"
        aria-expanded={isOpen}
        aria-controls="layout-settings-panel"
        onClick={togglePanel}
        disabled={disabled}
      >
        Layout settings
      </button>
      {isOpen && (
        <div id="layout-settings-panel" className="document-editor__layout-settings-panel">
          {layout.mode === 'paged' ? (
            <div className="document-editor__layout-settings-fields">
              {pagedMargins.map(({ key, label }) => {
                const error = errors[key]
                const inputId = `layout-settings-${key}`
                const errorId = `${inputId}-error`
                return (
                  <label className="document-editor__layout-field" key={key} htmlFor={inputId}>
                    <span>{label}</span>
                    <span className="document-editor__layout-input-wrap">
                      <input
                        key={`${layout.margins[key]}-${resetVersion}`}
                        id={inputId}
                        type="number"
                        inputMode="numeric"
                        min={PAGED_MARGIN_MIN}
                        max={PAGED_MARGIN_MAX}
                        step={1}
                        defaultValue={layout.margins[key]}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? errorId : undefined}
                        onBlur={(event) =>
                          updateValue(key, event.currentTarget.value, PAGED_MARGIN_MIN, PAGED_MARGIN_MAX, (value) =>
                            onChange(updatePagedMargin(layout, key, value)),
                          )
                        }
                      />
                      <span aria-hidden="true">mm</span>
                    </span>
                    {error && <span id={errorId} className="document-editor__layout-error">{error}</span>}
                  </label>
                )
              })}
            </div>
          ) : (
            <div className="document-editor__layout-settings-fields">
              <label className="document-editor__layout-field" htmlFor="layout-settings-content-width">
                <span>Content width</span>
                <span className="document-editor__layout-input-wrap">
                  <input
                    key={`${layout.maxWidth.value}-${resetVersion}`}
                    id="layout-settings-content-width"
                    type="number"
                    inputMode="numeric"
                    min={FLUID_WIDTH_MIN}
                    max={FLUID_WIDTH_MAX}
                    step={1}
                    defaultValue={layout.maxWidth.value}
                    aria-invalid={errors.width ? true : undefined}
                    aria-describedby={errors.width ? 'layout-settings-content-width-error' : undefined}
                    onBlur={(event) =>
                      updateValue(
                        'width',
                        event.currentTarget.value,
                        FLUID_WIDTH_MIN,
                        FLUID_WIDTH_MAX,
                        (value) => onChange(updateFluidContentWidth(layout, value)),
                      )
                    }
                  />
                  <span aria-hidden="true">px</span>
                </span>
                {errors.width && (
                  <span id="layout-settings-content-width-error" className="document-editor__layout-error">
                    {errors.width}
                  </span>
                )}
              </label>
            </div>
          )}
          <button type="button" className="document-editor__layout-reset" onClick={reset}>
            Reset to default
          </button>
        </div>
      )}
    </div>
  )
}
