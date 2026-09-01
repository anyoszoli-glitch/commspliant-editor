import { describe, expect, it } from 'vitest'
import { formatPageNumber, isPageNumbering } from './document'

describe('page numbering', () => {
  it.each([
    ['none', undefined],
    ['page-number', 'Page 2'],
    ['page-number-of-total', 'Page 2 of 3'],
    ['number', '2'],
    ['number-of-total', '2 / 3'],
  ] as const)('formats %s from the current and total page count', (format, expected) => {
    expect(formatPageNumber(format, 2, 3)).toBe(expected)
  })

  it('accepts only the supported persisted values', () => {
    expect(isPageNumbering('page-number-of-total')).toBe(true)
    expect(isPageNumbering('footer')).toBe(false)
  })
})
