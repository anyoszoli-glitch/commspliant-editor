import { describe, expect, it } from 'vitest'
import type { ImagePicker } from '../components/ImageBlock/imageTypes'
import { supportedLocales } from '../i18n'
import { standaloneSampleImageActionLabel, standaloneSampleImagePicker } from './sampleImagePicker'

describe('standalone sample image picker', () => {
  it('uses the same public host picker callback shape with a local static image', async () => {
    const picker: ImagePicker = standaloneSampleImagePicker
    const selection = await picker({})

    expect(selection).toEqual({
      src: expect.stringContaining('sample-image.png'),
      alt: 'Tili-Toli sample image',
      title: 'Standalone demo image',
    })
    expect(selection?.src).not.toMatch(/^(https?:|data:)/)
  })

  it('keeps every localized demo action label inside the standalone integration', () => {
    for (const locale of supportedLocales) {
      expect(standaloneSampleImageActionLabel(locale)).toMatch(/\S/)
    }
  })
})
