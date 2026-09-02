import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { DocumentLayout } from '../../document/document'
import type { PageDescriptor } from '../DocumentCanvas/pagination'
import type { Translate } from '../../i18n'
import {
  FLUID_WIDTH_MAX,
  FLUID_WIDTH_MIN,
  PAGED_MARGIN_MAX,
  PAGED_MARGIN_MIN,
  PAGE_NUMBERING_OPTIONS,
  parseLayoutInteger,
  resetFluidContentWidth,
  resetPageMarginOverride,
  resetPagedSettings,
  enablePageMarginOverride,
  updateFluidContentWidth,
  updatePageMargin,
  updatePagedMargin,
  updatePageNumbering,
  type PagedMargin,
} from './layoutSettingsModel'

type LayoutSettingsProps = {
  layout: DocumentLayout
  onChange: (layout: DocumentLayout) => void
  showMarginGuides?: boolean
  onShowMarginGuidesChange?: (show: boolean) => void
  pages?: PageDescriptor[]
  selectedPageId?: string
  onPageSelect?: (pageId: string) => void
  pageSettingsChannel?: string
  disabled?: boolean
  t: Translate
}

const pagedMargins: Array<{ key: PagedMargin; label: 'topMargin' | 'rightMargin' | 'bottomMargin' | 'leftMargin'; pageLabel: 'pageTop' | 'pageRight' | 'pageBottom' | 'pageLeft' }> = [
  { key: 'top', label: 'topMargin', pageLabel: 'pageTop' },
  { key: 'right', label: 'rightMargin', pageLabel: 'pageRight' },
  { key: 'bottom', label: 'bottomMargin', pageLabel: 'pageBottom' },
  { key: 'left', label: 'leftMargin', pageLabel: 'pageLeft' },
]

const PANEL_WIDTH = 220

export function LayoutSettings({
  layout,
  onChange,
  showMarginGuides = true,
  onShowMarginGuidesChange,
  pages = [],
  selectedPageId,
  onPageSelect,
  pageSettingsChannel,
  disabled = false,
  t,
}: LayoutSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reportedPages, setReportedPages] = useState<PageDescriptor[]>(pages)
  const [reportedSelectedPageId, setReportedSelectedPageId] = useState<string | undefined>(selectedPageId)
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

  useEffect(() => {
    if (pages.length > 0) setReportedPages(pages)
  }, [pages])

  useEffect(() => {
    if (selectedPageId !== undefined) setReportedSelectedPageId(selectedPageId)
  }, [selectedPageId])

  useEffect(() => {
    if (!pageSettingsChannel) return

    const handlePageSettingsMessage = (event: MessageEvent<unknown>) => {
      const message = event.data
      if (!message || typeof message !== 'object') return

      const pageMessage = message as {
        type?: unknown
        channel?: unknown
        action?: unknown
        pageId?: unknown
        pages?: unknown
      }
      if (
        pageMessage.type !== 'tili-toli-page-settings' ||
        pageMessage.channel !== pageSettingsChannel
      ) {
        return
      }
      if (
        pageMessage.action === 'pages' &&
        Array.isArray(pageMessage.pages) &&
        pageMessage.pages.every(
          (page): page is PageDescriptor =>
            !!page &&
            typeof page === 'object' &&
            typeof page.id === 'string' &&
            typeof page.number === 'number',
        )
      ) {
        setReportedPages(pageMessage.pages)
      }
      if (pageMessage.action === 'select' && typeof pageMessage.pageId === 'string') {
        setReportedSelectedPageId(pageMessage.pageId)
      }
    }

    window.addEventListener('message', handlePageSettingsMessage)
    return () => window.removeEventListener('message', handlePageSettingsMessage)
  }, [pageSettingsChannel])

  const updateValue = (
    field: string,
    rawValue: string,
    min: number,
    max: number,
    apply: (value: number) => void,
  ) => {
    const value = parseLayoutInteger(rawValue, min, max)
    if (value === undefined) {
      setErrors((current) => ({ ...current, [field]: t('validationInteger', { min, max }) }))
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

  const availablePages = reportedPages.length > 0 ? reportedPages : pages
  const selectedPage =
    availablePages.find((page) => page.id === reportedSelectedPageId) ?? availablePages[0]
  const selectedPageSettings =
    layout.mode === 'paged' && selectedPage ? layout.pageSettings?.[selectedPage.id] : undefined

  const togglePanel = () => {
    if (isOpen) setErrors({})
    setIsOpen((open) => !open)
  }

  const selectPage = (pageId: string) => {
    setReportedSelectedPageId(pageId)
    onPageSelect?.(pageId)
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
          <button
            type="button"
            className="document-editor__layout-settings-close"
            aria-label={t('closePageSetup')}
            onClick={() => {
              setIsOpen(false)
              setErrors({})
              buttonRef.current?.focus()
            }}
          >
            ×
          </button>
          {layout.mode === 'paged' ? (
            <div className="document-editor__layout-settings-fields">
              <span className="document-editor__layout-section-label">{t('documentDefaultMargins')}</span>
              {pagedMargins.map(({ key, label }) => {
                const error = errors[key]
                const inputId = `layout-settings-${key}`
                const errorId = `${inputId}-error`
                return (
                  <label className="document-editor__layout-field" key={key} htmlFor={inputId}>
                    <span>{t(label)}</span>
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
              {!disabled && (
                <label className="document-editor__layout-margin-guide-toggle" htmlFor="layout-settings-show-margins">
                  <input
                    id="layout-settings-show-margins"
                    type="checkbox"
                    checked={showMarginGuides}
                    disabled={!onShowMarginGuidesChange}
                    onChange={(event) => onShowMarginGuidesChange?.(event.currentTarget.checked)}
                  />
                  <span>{t('showMargins')}</span>
                </label>
              )}
              {selectedPage && (
                <>
                  <span className="document-editor__layout-section-label">{t('pageMargins')}</span>
                  <label className="document-editor__layout-field" htmlFor="layout-settings-page">
                    <span>{t('selectedPage')}</span>
                    <select
                      id="layout-settings-page"
                      value={selectedPage.id}
                      disabled={disabled}
                      onChange={(event) => selectPage(event.currentTarget.value)}
                    >
                      {availablePages.map((page) => (
                        <option key={page.id} value={page.id}>{t('page', { page: page.number })}</option>
                      ))}
                    </select>
                  </label>
                  <span className="document-editor__layout-page-status">
                    {selectedPageSettings ? t('usingCustomMargins') : t('usingDefaultMargins')}
                  </span>
                  {selectedPageSettings ? (
                    <>
                      {pagedMargins.map(({ key, pageLabel }) => {
                        const errorKey = `page-${selectedPage.id}-${key}`
                        const error = errors[errorKey]
                        const inputId = `layout-settings-page-${key}`
                        const errorId = `${inputId}-error`
                        return (
                          <label className="document-editor__layout-field" key={key} htmlFor={inputId}>
                            <span>{t(pageLabel)}</span>
                            <span className="document-editor__layout-input-wrap">
                              <input
                                key={`${selectedPage.id}-${selectedPageSettings.margins[key]}-${resetVersion}`}
                                id={inputId}
                                type="number"
                                inputMode="numeric"
                                min={PAGED_MARGIN_MIN}
                                max={PAGED_MARGIN_MAX}
                                step={1}
                                defaultValue={selectedPageSettings.margins[key]}
                                aria-invalid={error ? true : undefined}
                                aria-describedby={error ? errorId : undefined}
                                onBlur={(event) =>
                                  updateValue(errorKey, event.currentTarget.value, PAGED_MARGIN_MIN, PAGED_MARGIN_MAX, (value) =>
                                    onChange(updatePageMargin(layout, selectedPage.id, key, value)),
                                  )
                                }
                              />
                              <span aria-hidden="true">mm</span>
                            </span>
                            {error && <span id={errorId} className="document-editor__layout-error">{error}</span>}
                          </label>
                        )
                      })}
                      <button
                        type="button"
                        className="document-editor__layout-reset"
                        disabled={disabled}
                        onClick={() => onChange(resetPageMarginOverride(layout, selectedPage.id))}
                      >
                        {t('resetPageMargins')}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="document-editor__layout-reset"
                      disabled={disabled}
                      onClick={() => onChange(enablePageMarginOverride(layout, selectedPage.id))}
                    >
                      {t('useCustomMargins')}
                    </button>
                  )}
                </>
              )}
              <label className="document-editor__layout-field" htmlFor="layout-settings-page-numbering">
                <span>{t('pageNumbering')}</span>
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
                    <option key={option.value} value={option.value}>{option.value === 'none' ? t('none') : option.value === 'page-number' ? t('pageNumberExample') : option.value === 'page-number-of-total' ? t('pageNumberTotalExample') : option.label}</option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <div className="document-editor__layout-settings-fields">
              <label className="document-editor__layout-field" htmlFor="layout-settings-content-width">
                <span>{t('contentWidth')}</span>
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
            {t('resetDefault')}
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
        {t('pageSetup')}
      </button>
      {panel}
    </div>
  )
}
