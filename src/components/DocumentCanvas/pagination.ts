export type MeasuredBlock = {
  id: string
  height: number
  breakAfter?: boolean
}

export type BlockPlacement = {
  page: number
  offsetBefore: number
}

export type PaginationResult = {
  pageCount: number
  placements: Record<string, BlockPlacement>
}

type PaginationMetrics = {
  pageHeight: number
  marginTop: number
  marginBottom: number
  pageGap: number
}

export function paginateBlocks(
  blocks: MeasuredBlock[],
  metrics: PaginationMetrics,
): PaginationResult {
  const usableHeight = metrics.pageHeight - metrics.marginTop - metrics.marginBottom
  const placements: Record<string, BlockPlacement> = {}
  let page = 1
  let usedHeight = 0
  let pendingOffset = 0

  for (const block of blocks) {
    let offsetBefore = pendingOffset
    pendingOffset = 0

    if (!block.breakAfter && usedHeight > 0 && block.height > usableHeight - usedHeight) {
      offsetBefore +=
        usableHeight - usedHeight + metrics.marginBottom + metrics.pageGap + metrics.marginTop
      page += 1
      usedHeight = 0
    }

    placements[block.id] = { page, offsetBefore }
    usedHeight += block.height

    if (block.breakAfter) {
      pendingOffset =
        usableHeight - usedHeight + metrics.marginBottom + metrics.pageGap + metrics.marginTop
      page += 1
      usedHeight = 0
    }
  }

  return { pageCount: page, placements }
}
