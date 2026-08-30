import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import {
  defaultPagedLayout,
  type DocumentLayout,
  type FluidDocumentLayout,
  type PagedDocumentLayout,
} from '../../document/document'
import { LayoutContext } from './layoutContext'
import { paginateBlocks, type PaginationResult } from './pagination'

const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297
const PAGE_GAP_PX = 32
const MM_TO_PX = 96 / 25.4

type DocumentCanvasProps = {
  children?: ReactNode
  layout?: DocumentLayout
  style?: CSSProperties
}

const emptyPagination: PaginationResult = { pageCount: 1, placements: {} }

function PagedCanvas({
  children,
  layout,
  style,
}: {
  children?: ReactNode
  layout: PagedDocumentLayout
  style?: CSSProperties
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [pagination, setPagination] = useState(emptyPagination)
  const { margins } = layout

  const measure = useCallback(() => {
    const content = contentRef.current
    if (!content) return

    const blocks = [...content.querySelectorAll<HTMLElement>('[data-document-block]')].map(
      (block) => ({
        id: block.dataset.documentBlock ?? '',
        height: block.getBoundingClientRect().height,
        breakAfter: block.dataset.pageBreak === 'after',
      }),
    )
    const nextPagination = paginateBlocks(blocks, {
      pageHeight: A4_HEIGHT_MM * MM_TO_PX,
      marginTop: margins.top * MM_TO_PX,
      marginBottom: margins.bottom * MM_TO_PX,
      pageGap: PAGE_GAP_PX,
    })

    setPagination((current) =>
      JSON.stringify(current) === JSON.stringify(nextPagination) ? current : nextPagination,
    )
  }, [margins.bottom, margins.top])

  useLayoutEffect(() => {
    const content = contentRef.current
    if (!content) return

    const resizeObserver = new ResizeObserver(measure)
    const mutationObserver = new MutationObserver(measure)

    resizeObserver.observe(content)
    content.querySelectorAll<HTMLElement>('[data-document-block]').forEach((block) => {
      resizeObserver.observe(block)
    })
    mutationObserver.observe(content, { childList: true, subtree: true })
    measure()

    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [children, measure])

  const totalHeight = `calc(${pagination.pageCount * A4_HEIGHT_MM}mm + ${(pagination.pageCount - 1) * PAGE_GAP_PX}px)`

  return (
    <div
      data-document-layout="paged"
      data-page-count={pagination.pageCount}
      style={{
        position: 'relative',
        width: `${A4_WIDTH_MM}mm`,
        height: totalHeight,
        margin: '24px auto',
        ...style,
      }}
    >
      {Array.from({ length: pagination.pageCount }, (_, index) => (
        <section
          aria-label={`Page ${index + 1}`}
          data-document-page={index + 1}
          key={index}
          style={{
            position: 'absolute',
            top: `calc(${index * A4_HEIGHT_MM}mm + ${index * PAGE_GAP_PX}px)`,
            left: 0,
            width: `${A4_WIDTH_MM}mm`,
            height: `${A4_HEIGHT_MM}mm`,
            background: '#ffffff',
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.12)',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 8,
              right: 12,
              color: '#71717a',
              fontSize: 12,
              lineHeight: 1,
            }}
          >
            Page {index + 1}
          </span>
        </section>
      ))}
      <LayoutContext.Provider value={{ mode: 'paged', placements: pagination.placements }}>
        <div
          ref={contentRef}
          data-document-content
          aria-label="Document content"
          style={{
            position: 'absolute',
            top: `${margins.top}${margins.unit}`,
            left: `${margins.left}${margins.unit}`,
            width: `${A4_WIDTH_MM - margins.left - margins.right}${margins.unit}`,
            color: '#08060d',
          }}
        >
          {children}
        </div>
      </LayoutContext.Provider>
    </div>
  )
}

function FluidCanvas({
  children,
  layout,
  style,
}: {
  children?: ReactNode
  layout: FluidDocumentLayout
  style?: CSSProperties
}) {
  const { maxWidth, padding } = layout

  return (
    <LayoutContext.Provider value={{ mode: 'fluid', placements: {} }}>
      <div
        data-document-layout="fluid"
        data-document-content
        aria-label="Document content"
        style={{
          width: `min(${maxWidth.value}${maxWidth.unit}, calc(100% - 48px))`,
          minHeight: 400,
          margin: '24px auto',
          padding: `${padding.top}${padding.unit} ${padding.right}${padding.unit} ${padding.bottom}${padding.unit} ${padding.left}${padding.unit}`,
          boxSizing: 'border-box',
          background: '#ffffff',
          color: '#08060d',
          ...style,
        }}
      >
        {children}
      </div>
    </LayoutContext.Provider>
  )
}

export function DocumentCanvas({
  children,
  layout = defaultPagedLayout,
  style,
}: DocumentCanvasProps) {
  return layout.mode === 'paged' ? (
    <PagedCanvas layout={layout} style={style}>
      {children}
    </PagedCanvas>
  ) : (
    <FluidCanvas layout={layout} style={style}>
      {children}
    </FluidCanvas>
  )
}
