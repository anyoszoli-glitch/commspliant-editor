import { describe, expect, it } from 'vitest'
import { sanitizeRichTextStyle } from './richTextSanitizer'

describe('rich text style sanitizer', () => {
  it('keeps only editor-supported typography declarations', () => {
    expect(sanitizeRichTextStyle(
      'font-family: Georgia; color: #1d4ed8; background-color: #fff3bf; line-height: 1.5; text-align: center',
    )).toBe(
      'font-family: Georgia; color: #1d4ed8; background-color: #fff3bf; line-height: 1.5; text-align: center',
    )
  })

  it('removes unsupported values and unrelated CSS', () => {
    expect(sanitizeRichTextStyle(
      'font-family: Comic Sans MS; color: expression(alert(1)); position: fixed; line-height: 99',
    )).toBe('')
  })
})
