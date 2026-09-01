import type { DocumentData, PagedDocumentLayout } from '../../document/document'
import { pageIdAfterBreak, type PageDescriptor, ROOT_PAGE_ID } from '../DocumentCanvas/pagination'

type DocumentBlock = DocumentData['content'][number]

export type PageReorderResult = {
  content: DocumentData['content']
  layout: PagedDocumentLayout
  activePageId: string
}

function blockId(block: DocumentBlock): string | undefined {
  return typeof block.props.id === 'string' ? block.props.id : undefined
}

function pageIdForPosition(position: number, breaks: DocumentBlock[]): string {
  if (position === 0) return ROOT_PAGE_ID
  return pageIdAfterBreak(blockId(breaks[position - 1]) ?? `reordered-${position}`)
}

export function reorderPages(
  content: DocumentData['content'],
  pages: PageDescriptor[],
  fromIndex: number,
  toIndex: number,
  layout: PagedDocumentLayout,
  activePageId?: string,
): PageReorderResult | undefined {
  if (
    fromIndex < 0 ||
    fromIndex >= pages.length ||
    toIndex < 0 ||
    toIndex >= pages.length ||
    fromIndex === toIndex ||
    pages.length < 2
  ) {
    return undefined
  }

  const blocksById = new Map(content.map((block) => [blockId(block), block]))
  const units = pages.map((page) => {
    const pageBlocks = page.blockIds?.map((id) => blocksById.get(id))
    if (!pageBlocks || pageBlocks.some((block): block is undefined => block === undefined)) return undefined
    const resolvedBlocks = pageBlocks as DocumentBlock[]
    return {
      page,
      content: resolvedBlocks.filter(
        (block): block is DocumentBlock => Boolean(block) && block.type !== 'PageBreakBlock',
      ),
    }
  })
  if (units.some((unit): unit is undefined => unit === undefined)) return undefined

  const pageBreaks = content.filter((block) => block.type === 'PageBreakBlock')
  if (pageBreaks.length !== pages.length - 1) return undefined

  const reorderedUnits = units.filter(
    (unit): unit is NonNullable<(typeof units)[number]> => Boolean(unit),
  )
  const [moved] = reorderedUnits.splice(fromIndex, 1)
  reorderedUnits.splice(toIndex, 0, moved)

  const reorderedContent: DocumentData['content'] = []
  reorderedUnits.forEach((unit, index) => {
    reorderedContent.push(...unit.content)
    if (index < reorderedUnits.length - 1) reorderedContent.push(pageBreaks[index])
  })

  const reorderedPageIds = reorderedUnits.map((_, index) => pageIdForPosition(index, pageBreaks))
  const pageSettings = Object.fromEntries(
    reorderedUnits.flatMap((unit, index) => {
      const settings = layout.pageSettings?.[unit.page.id]
      return settings ? [[reorderedPageIds[index], settings]] : []
    }),
  )
  const activeUnitIndex = reorderedUnits.findIndex((unit) => unit.page.id === activePageId)

  return {
    content: reorderedContent,
    layout: {
      ...layout,
      pageSettings: Object.keys(pageSettings).length > 0 ? pageSettings : undefined,
    },
    activePageId: reorderedPageIds[activeUnitIndex >= 0 ? activeUnitIndex : toIndex],
  }
}
