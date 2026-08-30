import { describe, expect, it } from 'vitest'
import { paginateBlocks } from './pagination'

const metrics = {
  pageHeight: 1000,
  marginTop: 100,
  marginBottom: 100,
  pageGap: 30,
}

describe('paginateBlocks', () => {
  it('keeps fitting atomic blocks on one page', () => {
    const result = paginateBlocks(
      [
        { id: 'one', height: 300 },
        { id: 'two', height: 400 },
      ],
      metrics,
    )

    expect(result.pageCount).toBe(1)
    expect(result.placements.two).toEqual({ page: 1, offsetBefore: 0 })
  })

  it('moves an overflowing block onto a second logical page', () => {
    const result = paginateBlocks(
      [
        { id: 'one', height: 500 },
        { id: 'two', height: 400 },
        { id: 'three', height: 300 },
      ],
      metrics,
    )

    expect(result.pageCount).toBe(2)
    expect(result.placements.two.page).toBe(2)
    expect(result.placements.two.offsetBefore).toBe(530)
    expect(result.placements.three.page).toBe(2)
  })
})
