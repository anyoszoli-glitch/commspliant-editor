import { describe, expect, it } from 'vitest'
import type { DocumentBackgroundImage } from '../../document/document'
import {
  BACKGROUND_COLOUR_PRESETS,
  BACKGROUND_OPACITY_MAX,
  BACKGROUND_OPACITY_MIN,
  parseBackgroundOpacity,
  updateBackgroundFit,
  updateBackgroundOpacity,
  updateBackgroundPosition,
} from './backgroundSettingsModel'

const image: DocumentBackgroundImage = {
  src: '/api/v1/assets/background-1',
  fit: 'cover',
  position: 'center',
  opacity: 1,
}

describe('background settings', () => {
  it('provides a compact palette of valid six-digit colours', () => {
    expect(BACKGROUND_COLOUR_PRESETS).toHaveLength(6)
    expect(new Set(BACKGROUND_COLOUR_PRESETS.map(({ value }) => value)).size).toBe(6)
    expect(BACKGROUND_COLOUR_PRESETS.every(({ value }) => /^#[0-9a-f]{6}$/.test(value))).toBe(true)
  })

  it.each([BACKGROUND_OPACITY_MIN, 50, BACKGROUND_OPACITY_MAX])(
    'accepts %i percent opacity',
    (value) => {
      expect(parseBackgroundOpacity(String(value))).toBe(value)
    },
  )

  it.each(['-1', '101', '20.5', 'opaque', '', 'Infinity'])(
    'rejects invalid opacity: %s',
    (value) => {
      expect(parseBackgroundOpacity(value)).toBeUndefined()
    },
  )

  it('updates fit without changing the asset source', () => {
    expect(updateBackgroundFit(image, 'contain')).toEqual({
      ...image,
      fit: 'contain',
    })
  })

  it('updates position without changing other settings', () => {
    expect(updateBackgroundPosition(image, 'top left')).toEqual({
      ...image,
      position: 'top left',
    })
  })

  it('converts user-facing opacity percent to CSS opacity', () => {
    expect(updateBackgroundOpacity(image, 35)).toEqual({
      ...image,
      opacity: 0.35,
    })
  })
})
