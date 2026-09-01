import { describe, expect, it } from 'vitest'
import { getImageHorizontalOffsetBounds, normalizeImageBlockData } from '../../document/document'
import { createTranslator, supportedLocales } from '../../i18n'

describe('image block model', () => {
  it('keeps only safe HTTP(S) image sources and clamps the content width', () => {
    expect(normalizeImageBlockData({
      src: 'https://images.example.test/logo.png',
      alt: 'Company logo',
      title: 'Logo',
      width: 160,
      alignment: 'right',
    })).toEqual({
      src: 'https://images.example.test/logo.png',
      alt: 'Company logo',
      title: 'Logo',
      width: 100,
      alignment: 'right',
      horizontalOffset: 0,
    })

    expect(normalizeImageBlockData({ src: 'javascript:alert(1)', width: -20 })).toMatchObject({
      src: undefined,
      width: 1,
      alignment: 'center',
    })
    for (const unsafeSource of [
      'vbscript:msgbox(1)',
      'data:image/png;base64,AAAA',
      'data:image/svg+xml,<svg />',
      'data:text/html,<script>alert(1)</script>',
      'blob:https://images.example.test/image-id',
      'file:///tmp/image.png',
      'https://images.example.test/logo.svg',
      'https://images.example.test/logo.SVG?cache=1',
      'https://images.example.test/logo.svgz',
    ]) {
      expect(normalizeImageBlockData({ src: unsafeSource }).src).toBeUndefined()
    }
    expect(normalizeImageBlockData({ src: '/assets/sample-image.png' }).src).toBe('/assets/sample-image.png')
  })

  it('clamps horizontal offsets within the available space for every alignment', () => {
    expect(getImageHorizontalOffsetBounds(75, 'left')).toEqual({ min: 0, max: 25 })
    expect(normalizeImageBlockData({ width: 75, alignment: 'left', horizontalOffset: -10 }).horizontalOffset)
      .toBe(0)
    expect(normalizeImageBlockData({ width: 75, alignment: 'left', horizontalOffset: 40 }).horizontalOffset)
      .toBe(25)

    expect(getImageHorizontalOffsetBounds(75, 'right')).toEqual({ min: -25, max: 0 })
    expect(normalizeImageBlockData({ width: 75, alignment: 'right', horizontalOffset: 10 }).horizontalOffset)
      .toBe(0)
    expect(normalizeImageBlockData({ width: 75, alignment: 'right', horizontalOffset: -40 }).horizontalOffset)
      .toBe(-25)

    expect(getImageHorizontalOffsetBounds(80, 'center')).toEqual({ min: -10, max: 10 })
    expect(normalizeImageBlockData({ width: 80, alignment: 'center', horizontalOffset: 20 }).horizontalOffset)
      .toBe(10)
    expect(normalizeImageBlockData({ width: 80, alignment: 'center', horizontalOffset: -20 }).horizontalOffset)
      .toBe(-10)
  })

  it('provides Image block labels in every supported interface language', () => {
    for (const locale of supportedLocales) {
      const t = createTranslator(locale)
      expect(t('image')).not.toBe('')
      expect(t('chooseImage')).not.toBe('')
      expect(t('imagePickerUnavailable')).not.toBe('')
      expect(t('horizontalOffset')).not.toBe('')
    }
  })
})
