import { describe, expect, it } from 'vitest'
import { pageIdAfterBreak, paginateBlocks } from './pagination'

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

  it('starts following content on a new page after an explicit break', () => {
    const result = paginateBlocks(
      [
        { id: 'heading', height: 100 },
        { id: 'break', height: 20, breakAfter: true },
        { id: 'text', height: 200 },
      ],
      metrics,
    )

    expect(result.pageCount).toBe(2)
    expect(result.placements.break.page).toBe(1)
    expect(result.placements.text.page).toBe(2)
  })

  it('creates three pages from two explicit breaks', () => {
    const result = paginateBlocks(
      [
        { id: 'break-one', height: 20, breakAfter: true },
        { id: 'middle', height: 100 },
        { id: 'break-two', height: 20, breakAfter: true },
        { id: 'last', height: 100 },
      ],
      metrics,
    )

    expect(result.pageCount).toBe(3)
    expect(result.placements.middle.page).toBe(2)
    expect(result.placements.last.page).toBe(3)
  })

  it('lets an explicit break win deterministically at an overflow boundary', () => {
    const result = paginateBlocks(
      [
        { id: 'almost-full', height: 790 },
        { id: 'break', height: 20, breakAfter: true },
        { id: 'following', height: 100 },
      ],
      metrics,
    )

    expect(result.pageCount).toBe(2)
    expect(result.placements.break.page).toBe(1)
    expect(result.placements.following.page).toBe(2)
  })

  it('uses stable page anchors and the matching margins for each generated page', () => {
    const result = paginateBlocks(
      [
        { id: 'heading', height: 100 },
        { id: 'break', height: 20, breakAfter: true },
        { id: 'text', height: 200 },
      ],
      {
        ...metrics,
        getPageMargins: (pageId) =>
          pageId === pageIdAfterBreak('break')
            ? { top: 200, bottom: 120 }
            : { top: 100, bottom: 100 },
      },
    )

    expect(result.pages).toEqual([
      { id: 'page-root', number: 1 },
      { id: pageIdAfterBreak('break'), number: 2 },
    ])
    expect(result.placements.text).toEqual({ page: 2, offsetBefore: 1010 })
  })

  it('keeps an explicit page boundary identity when another page is inserted before it', () => {
    const original = paginateBlocks(
      [
        { id: 'break-one', height: 20, breakAfter: true },
        { id: 'page-two-content', height: 100 },
      ],
      metrics,
    )
    const withInsertedPage = paginateBlocks(
      [
        { id: 'break-new', height: 20, breakAfter: true },
        { id: 'inserted-content', height: 100 },
        { id: 'break-one', height: 20, breakAfter: true },
        { id: 'page-two-content', height: 100 },
      ],
      metrics,
    )

    expect(original.pages[1].id).toBe(pageIdAfterBreak('break-one'))
    expect(withInsertedPage.pages[2].id).toBe(pageIdAfterBreak('break-one'))
  })
})
