export type MeasuredBlock = {
  id: string
  height: number
  breakAfter?: boolean
}

export type BlockPlacement = {
  page: number
  offsetBefore: number
}

export type PageDescriptor = {
  id: string
  number: number
  blockIds?: string[]
}

export type PaginationResult = {
  pageCount: number
  pages: PageDescriptor[]
  placements: Record<string, BlockPlacement>
}

type PaginationMetrics = {
  pageHeight: number
  marginTop: number
  marginBottom: number
  pageGap: number
  getPageMargins?: (pageId: string) => { top: number; bottom: number }
}

export const ROOT_PAGE_ID = 'page-root'

export function pageIdAfterBreak(blockId: string): string {
  return `page-after-${blockId}`
}

export function pageIdBeforeBlock(blockId: string): string {
  return `page-before-${blockId}`
}

export function paginateBlocks(
  blocks: MeasuredBlock[],
  metrics: PaginationMetrics,
): PaginationResult {
  const marginsFor = (pageId: string) =>
    metrics.getPageMargins?.(pageId) ?? {
      top: metrics.marginTop,
      bottom: metrics.marginBottom,
    }
  const pages: PageDescriptor[] = [{ id: ROOT_PAGE_ID, number: 1 }]
  const placements: Record<string, BlockPlacement> = {}
  let page = 1
  let pageId = ROOT_PAGE_ID
  let { top: marginTop, bottom: marginBottom } = marginsFor(pageId)
  let usedHeight = 0
  let pageStartOffset = marginTop

  const startPage = (nextPageId: string) => {
    page += 1
    pageId = nextPageId
    const previousMarginTop = marginTop
    const previousUsedHeight = usedHeight
    ;({ top: marginTop, bottom: marginBottom } = marginsFor(pageId))
    pages.push({ id: pageId, number: page })
    pageStartOffset =
      metrics.pageHeight + metrics.pageGap + marginTop - previousMarginTop - previousUsedHeight
    usedHeight = 0
  }

  for (const block of blocks) {
    const usableHeight = metrics.pageHeight - marginTop - marginBottom

    if (!block.breakAfter && usedHeight > 0 && block.height > usableHeight - usedHeight) {
      startPage(pageIdBeforeBlock(block.id))
    }

    placements[block.id] = { page, offsetBefore: pageStartOffset }
    pageStartOffset = 0
    usedHeight += block.height

    if (block.breakAfter) startPage(pageIdAfterBreak(block.id))
  }

  return { pageCount: pages.length, pages, placements }
}
