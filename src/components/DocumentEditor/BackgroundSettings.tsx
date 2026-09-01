import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import type {
  BackgroundImageFit,
  BackgroundImagePosition,
  DocumentBackgroundColour,
  DocumentBackgroundImage,
} from '../../document/document'
import { CustomColourPicker } from '../ColourPicker/CustomColourPicker'
import type { Translate, TranslationKey } from '../../i18n'

import {
  BACKGROUND_COLOUR_PRESETS,
  BACKGROUND_OPACITY_MAX,
  BACKGROUND_OPACITY_MIN,
  parseBackgroundOpacity,
  updateBackgroundFit,
  updateBackgroundOpacity,
  updateBackgroundPosition,
} from './backgroundSettingsModel'

type BackgroundSettingsProps = {
  image?: DocumentBackgroundImage
  colour?: DocumentBackgroundColour
  onImageChange: (image: DocumentBackgroundImage | undefined) => void
  onColourChange: (colour: DocumentBackgroundColour | undefined) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  disabled?: boolean
  t: Translate
}

const PANEL_WIDTH = 240

const fitOptions: Array<{ value: BackgroundImageFit; label: string }> = [
  { value: 'cover', label: 'cover' },
  { value: 'contain', label: 'contain' },
  { value: 'none', label: 'originalSize' },
]

const positions: BackgroundImagePosition[] = [
  'top left',
  'top',
  'top right',
  'left',
  'center',
  'right',
  'bottom left',
  'bottom',
  'bottom right',
]

const positionLabelKeys: Record<BackgroundImagePosition, TranslationKey> = {
  'top left': 'backgroundPositionTopLeft',
  top: 'backgroundPositionTop',
  'top right': 'backgroundPositionTopRight',
  left: 'backgroundPositionLeft',
  center: 'backgroundPositionCenter',
  right: 'backgroundPositionRight',
  'bottom left': 'backgroundPositionBottomLeft',
  bottom: 'backgroundPositionBottom',
  'bottom right': 'backgroundPositionBottomRight',
}

export function BackgroundSettings({
  image,
  colour,
  onImageChange,
  onColourChange,
  open,
  onOpenChange,
  disabled = false,
  t,
}: BackgroundSettingsProps) {
  const isOpen = open
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const opacityPercent = Math.round((image?.opacity ?? 1) * 100)

  useLayoutEffect(() => {
    if (!isOpen) return

    const updatePosition = () => {
      const button = buttonRef.current
      if (!button) return

      const rect = button.getBoundingClientRect()
      const headerBottom = button.closest<HTMLElement>('[class*="_PuckHeader_"]')?.getBoundingClientRect().bottom
      const top = Math.max(rect.bottom, headerBottom ?? rect.bottom) + 8

      const left = Math.max(
        8,
        Math.min(
          rect.right - PANEL_WIDTH,
          window.innerWidth - PANEL_WIDTH - 8,
        ),
      )

      setPosition({
        top,
        left,
      })
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

      if (buttonRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return

      onOpenChange(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onOpenChange])

  const panel = isOpen
    ? createPortal(
        <div
          ref={panelRef}
          id="background-settings-panel"
          className="document-editor__background-settings-panel"
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
          <div className="document-editor__background-field">
            <span>{t('backgroundColour')}</span>

            <div
              className="document-editor__background-colour-palette"
              role="group"
              aria-label={t('backgroundColourPresets')}
            >
              {BACKGROUND_COLOUR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  aria-label={t(preset.label as Parameters<Translate>[0])}
                  aria-pressed={colour?.toLowerCase() === preset.value}
                  title={t(preset.label as Parameters<Translate>[0])}
                  disabled={disabled}
                  style={{ backgroundColor: preset.value }}
                  onClick={() => onColourChange(preset.value)}
                />
              ))}
            </div>

            <div className="document-editor__background-colour-custom">
              <CustomColourPicker
                ariaLabel={t('customBackgroundColour')}
                value={colour}
                fallbackColour="#ffffff"
                label={t('custom')}
                disabled={disabled}
                onChange={(value) =>
                  onColourChange(value as DocumentBackgroundColour)
                }
              />

              <button
                type="button"
                className="document-editor__background-colour-clear"
                disabled={disabled || colour === undefined}
                onClick={() => onColourChange(undefined)}
              >
                {t('clearColour')}
              </button>
            </div>
          </div>

          {!image ? (
            <p className="document-editor__background-empty">
              {t('noBackgroundImage')}
            </p>
          ) : (
            <>
              <label className="document-editor__background-field">
                <span>{t('fit')}</span>

                <select
                  value={image.fit ?? 'cover'}
                  disabled={disabled}
                  onChange={(event) =>
                    onImageChange(
                      updateBackgroundFit(
                        image,
                        event.currentTarget.value as BackgroundImageFit,
                      ),
                    )
                  }
                >
                  {fitOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.label as Parameters<Translate>[0])}
                    </option>
                  ))}
                </select>
              </label>

              <div className="document-editor__background-field">
                <span>{t('position')}</span>

                <div
                  className="document-editor__background-position-grid"
                  role="group"
                  aria-label={t('backgroundImagePosition')}
                >
                  {positions.map((backgroundPosition) => (
                    <button
                      key={backgroundPosition}
                      type="button"
                      title={t(positionLabelKeys[backgroundPosition])}
                      aria-label={t(positionLabelKeys[backgroundPosition])}
                      aria-pressed={
                        (image.position ?? 'center') === backgroundPosition
                      }
                      disabled={disabled}
                      onClick={() =>
                        onImageChange(
                          updateBackgroundPosition(
                            image,
                            backgroundPosition,
                          ),
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              <label className="document-editor__background-field">
                <span>{t('opacity')}</span>

                <div className="document-editor__background-opacity">
                  <input
                    type="range"
                    aria-label={t('backgroundImageOpacity')}
                    min={BACKGROUND_OPACITY_MIN}
                    max={BACKGROUND_OPACITY_MAX}
                    step={1}
                    value={opacityPercent}
                    disabled={disabled}
                    onInput={(event) => {
                      const value = parseBackgroundOpacity(
                        event.currentTarget.value,
                      )

                      if (value === undefined) return

                      onImageChange(updateBackgroundOpacity(image, value))
                    }}
                  />

                  <span>{opacityPercent}%</span>
                </div>
              </label>

              <button
                type="button"
                className="document-editor__background-remove"
                disabled={disabled}
                onClick={() => onImageChange(undefined)}
              >
                {t('removeBackground')}
              </button>
            </>
          )}
        </div>,
        document.body,
      )
    : null

  return (
    <div className="document-editor__background-settings">
      <button
        ref={buttonRef}
        type="button"
        className="document-editor__background-settings-toggle"
        aria-expanded={isOpen}
        aria-controls="background-settings-panel"
        disabled={disabled}
        onClick={() => onOpenChange(!isOpen)}
      >
        {t('backgroundSettings')}
      </button>

      {panel}
    </div>
  )
}
