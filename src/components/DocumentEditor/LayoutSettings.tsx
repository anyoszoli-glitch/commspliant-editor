import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { DocumentLayout } from '../../document/document'
import {
  FLUID_WIDTH_MAX,
  FLUID_WIDTH_MIN,
  PAGED_MARGIN_MAX,
  PAGED_MARGIN_MIN,
  PAGE_NUMBERING_OPTIONS,
  layoutValidationMessage,
  parseLayoutInteger,
  resetFluidContentWidth,
  resetPagedSettings,
  updateFluidContentWidth,
  updatePagedMargin,
  updatePageNumbering,
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

const PANEL_WIDTH = 220

export function LayoutSettings({ layout, onChange, disabled = false }: LayoutSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [resetVersion, setResetVersion] = useState(0)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!isOpen) return

    const updatePosition = () => {
      const button = buttonRef.current
      if (!button) return

      const rect = button.getBoundingClientRect()
      const headerBottom = button.closest<HTMLElement>('[class*="_PuckHeader_"]')?.getBoundingClientRect().bottom
      const top = Math.max(rect.bottom, headerBottom ?? rect.bottom) + 8
      const left = Math.max(8, Math.min(rect.right - PANEL_WIDTH, window.innerWidth - PANEL_WIDTH - 8))

      setPosition({ top, left })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return

      setIsOpen(false)
      setErrors({})
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return

      setIsOpen(false)
      setErrors({})
      buttonRef.current?.focus()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

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
    onChange(layout.mode === 'paged' ? resetPagedSettings(layout) : resetFluidContentWidth(layout))
  }

  const togglePanel = () => {
    if (isOpen) setErrors({})
    setIsOpen((open) => !open)
  }

  const panel = isOpen
    ? createPortal(
        <div
          ref={panelRef}
          id="layout-settings-panel"
          className="document-editor__layout-settings-panel"
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            right: 'auto',
            zIndex: 10000,
            maxHeight: `calc(100vh - ${position.top + 8}px)`,
            overflowY: 'auto',
          }}
        >
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
              <label className="document-editor__layout-field" htmlFor="layout-settings-page-numbering">
                <span>Page numbering</span>
                <select
                  id="layout-settings-page-numbering"
                  value={layout.pageNumbering ?? 'none'}
                  disabled={disabled}
                  onChange={(event) =>
                    onChange(
                      updatePageNumbering(
                        layout,
                        event.currentTarget.value as (typeof PAGE_NUMBERING_OPTIONS)[number]['value'],
                      ),
                    )
                  }
                >
                  {PAGE_NUMBERING_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
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
        </div>,
        document.body,
      )
    : null

  return (
    <div className="document-editor__layout-settings">
      <button
        ref={buttonRef}
        type="button"
        className="document-editor__layout-settings-toggle"
        aria-expanded={isOpen}
        aria-controls="layout-settings-panel"
        onClick={togglePanel}
        disabled={disabled}
      >
        Page setup
      </button>
      {panel}
    </div>
  )
}
