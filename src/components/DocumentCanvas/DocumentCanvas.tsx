import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import {
  defaultPagedLayout,
  formatPageNumber,
  getEffectivePageMargins,
  type DocumentBackgroundColour,
  type DocumentBackgroundImage,
  type DocumentLayout,
  type FluidDocumentLayout,
  type PagedDocumentLayout,
} from '../../document/document'
import { useTranslation } from '../../i18n'
import { LayoutContext } from './layoutContext'
import { paginateBlocks, type PageDescriptor, type PaginationResult } from './pagination'

const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297
const PAGE_GAP_PX = 32
const MM_TO_PX = 96 / 25.4

type DocumentCanvasProps = {
  children?: ReactNode
  layout?: DocumentLayout
  backgroundImage?: DocumentBackgroundImage
  backgroundColour?: DocumentBackgroundColour
  isEditorCanvas?: boolean
  showEditorPageIndicators?: boolean
  showMarginGuides?: boolean
  selectedPageId?: string
  onPageSelect?: (pageId: string) => void
  onPagesChange?: (pages: PageDescriptor[]) => void
  pageSettingsChannel?: string
  style?: CSSProperties
}

const emptyPagination: PaginationResult = {
  pageCount: 1,
  pages: [{ id: 'page-root', number: 1 }],
  placements: {},
}

function BackgroundLayer({ image }: { image?: DocumentBackgroundImage }) {
  if (!image?.src) return null

  return (
    <div
      aria-hidden="true"
      data-document-background
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        userSelect: 'none',
        backgroundImage: `url("${image.src}")`,
        backgroundSize: image.fit ?? 'cover',
        backgroundPosition: image.position ?? 'center',
        backgroundRepeat: 'no-repeat',
        opacity: image.opacity ?? 1,
        printColorAdjust: 'exact',
        WebkitPrintColorAdjust: 'exact',
      }}
    />
  )
}

function postPageSettingsMessage(
  source: Element | null,
  channel: string | undefined,
  payload: Record<string, unknown>,
) {
  const sourceWindow = source?.ownerDocument.defaultView
  if (!channel || !sourceWindow || sourceWindow.parent === sourceWindow) return

  sourceWindow.parent.postMessage({ type: 'tili-toli-page-settings', channel, ...payload }, '*')
}

function PagedCanvas({
  children,
  layout,
  backgroundImage,
  backgroundColour,
  isEditorCanvas,
  showEditorPageIndicators,
  showMarginGuides,
  selectedPageId,
  onPageSelect,
  onPagesChange,
  pageSettingsChannel,
  style,
}: {
  children?: ReactNode
  layout: PagedDocumentLayout
  backgroundImage?: DocumentBackgroundImage
  backgroundColour?: DocumentBackgroundColour
  isEditorCanvas: boolean
  showEditorPageIndicators: boolean
  showMarginGuides: boolean
  selectedPageId?: string
  onPageSelect?: (pageId: string) => void
  onPagesChange?: (pages: PageDescriptor[]) => void
  pageSettingsChannel?: string
  style?: CSSProperties
}) {
  const t = useTranslation()
  const contentRef = useRef<HTMLDivElement>(null)
  const [pagination, setPagination] = useState(emptyPagination)
  const [activeGuidePageId, setActiveGuidePageId] = useState(selectedPageId)
  const requestedGuidePageId = useRef<string | undefined>(undefined)
  const pageMargins = Object.fromEntries(
    pagination.pages.map((page) => [page.number, getEffectivePageMargins(layout, page.id)]),
  )

  useEffect(() => {
    setActiveGuidePageId(selectedPageId)
  }, [selectedPageId])

  useEffect(() => {
    if (!pageSettingsChannel) return

    const handlePageSettingsMessage = (event: MessageEvent<unknown>) => {
      const message = event.data
      if (!message || typeof message !== 'object') return

      const pageMessage = message as {
        type?: unknown
        channel?: unknown
        action?: unknown
        pageId?: unknown
      }
      if (
        pageMessage.type === 'tili-toli-page-settings' &&
        pageMessage.channel === pageSettingsChannel &&
        pageMessage.action === 'select' &&
        typeof pageMessage.pageId === 'string'
      ) {
        requestedGuidePageId.current = pageMessage.pageId
        setActiveGuidePageId(pageMessage.pageId)
      }
    }

    window.addEventListener('message', handlePageSettingsMessage)
    return () => window.removeEventListener('message', handlePageSettingsMessage)
  }, [pageSettingsChannel])

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
      marginTop: layout.margins.top * MM_TO_PX,
      marginBottom: layout.margins.bottom * MM_TO_PX,
      pageGap: PAGE_GAP_PX,
      getPageMargins: (pageId) => {
        const margins = getEffectivePageMargins(layout, pageId)
        return {
          top: margins.top * MM_TO_PX,
          bottom: margins.bottom * MM_TO_PX,
        }
      },
    })

    setPagination((current) =>
      JSON.stringify(current) === JSON.stringify(nextPagination) ? current : nextPagination,
    )
  }, [layout])

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

  useLayoutEffect(() => {
    const blocks = [...(contentRef.current?.querySelectorAll<HTMLElement>('[data-document-block]') ?? [])]
    const pages = pagination.pages.map((page) => ({
      ...page,
      blockIds: blocks
        .filter((block) => pagination.placements[block.dataset.documentBlock ?? '']?.page === page.number)
        .map((block) => block.dataset.documentBlock ?? '')
        .filter(Boolean),
    }))
    onPagesChange?.(pages)
    postPageSettingsMessage(contentRef.current, pageSettingsChannel, { action: 'pages', pages })
  }, [onPagesChange, pageSettingsChannel, pagination.pages, pagination.placements])

  useLayoutEffect(() => {
    if (!onPageSelect) return

    const pageElements = pagination.pages
      .map((page) =>
        contentRef.current?.parentElement?.querySelector<HTMLElement>(
          `[data-document-page-id="${page.id}"]`,
        ),
      )
      .filter((page): page is HTMLElement => Boolean(page))
    if (pageElements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visiblePage = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]?.target as
          | HTMLElement
          | undefined
        const pageId = visiblePage?.dataset.documentPageId
        if (!pageId) return

        if (requestedGuidePageId.current && requestedGuidePageId.current !== pageId) return
        requestedGuidePageId.current = undefined
        setActiveGuidePageId(pageId)
        if (pageId !== selectedPageId) onPageSelect(pageId)
      },
      { threshold: [0.25, 0.5, 0.75] },
    )
    pageElements.forEach((page) => observer.observe(page))
    return () => observer.disconnect()
  }, [onPageSelect, pagination.pages, selectedPageId])

  const totalHeight = `calc(${pagination.pageCount * A4_HEIGHT_MM}mm + ${(pagination.pageCount - 1) * PAGE_GAP_PX}px)`

  return (
    <div
      data-document-layout="paged"
      data-page-count={pagination.pageCount}
      style={{
        position: 'relative',
        width: `${A4_WIDTH_MM}mm`,
        height: totalHeight,
        margin: '12px auto',
        ...style,
      }}
    >
      {isEditorCanvas && (
        <style media="print">{'[data-editor-page-indicator], [data-editor-margin-guide] { display: none !important; }'}</style>
      )}
      {pagination.pages.map((page, index) => (
        <section
          aria-label={t('page', { page: page.number })}
          data-document-page={page.number}
          data-document-page-id={page.id}
          key={page.id}
          style={{
            position: 'absolute',
            top: `calc(${index * A4_HEIGHT_MM}mm + ${index * PAGE_GAP_PX}px)`,
            left: 0,
            width: `${A4_WIDTH_MM}mm`,
            height: `${A4_HEIGHT_MM}mm`,
            background: backgroundColour ?? '#ffffff',
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.12)',
            isolation: 'isolate',
            overflow: 'hidden',
          }}
        >
          <BackgroundLayer image={backgroundImage} />
          {isEditorCanvas && showMarginGuides && activeGuidePageId === page.id && (
            <div
              aria-hidden="true"
              data-editor-margin-guide
              style={{
                position: 'absolute',
                zIndex: 1,
                top: `${pageMargins[page.number]?.top ?? 0}mm`,
                right: `${pageMargins[page.number]?.right ?? 0}mm`,
                bottom: `${pageMargins[page.number]?.bottom ?? 0}mm`,
                left: `${pageMargins[page.number]?.left ?? 0}mm`,
                boxSizing: 'border-box',
                border: '0.5px dashed rgba(91, 69, 224, 0.24)',
                pointerEvents: 'none',
              }}
            />
          )}
          {formatPageNumber(layout.pageNumbering, page.number, pagination.pageCount) && (
            <span
              data-document-page-number
              aria-label={t('pageNumberLabel', { page: page.number })}
              style={{
                position: 'absolute',
                zIndex: 1,
                bottom: '6mm',
                left: '50%',
                transform: 'translateX(-50%)',
                color: '#526473',
                fontSize: 11,
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}
            >
              {formatPageNumber(layout.pageNumbering, page.number, pagination.pageCount)}
            </span>
          )}
          {showEditorPageIndicators && (
            <button
              type="button"
              aria-label={t('selectPage', { page: page.number })}
              aria-pressed={selectedPageId === page.id}
              data-editor-page-indicator
              style={{
                position: 'absolute',
                top: 8,
                right: 12,
                color: '#71717a',
                fontSize: 12,
                lineHeight: 1,
                border: 0,
                background: 'transparent',
                padding: 0,
                cursor: 'pointer',
              }}
              onClick={() => {
                requestedGuidePageId.current = page.id
                setActiveGuidePageId(page.id)
                onPageSelect?.(page.id)
                postPageSettingsMessage(contentRef.current, pageSettingsChannel, { action: 'select', pageId: page.id })
              }}
            >
              {t('page', { page: page.number })}
            </button>
          )}
        </section>
      ))}
      <LayoutContext.Provider value={{ mode: 'paged', placements: pagination.placements, pageMargins }}>
        <div
          ref={contentRef}
          data-document-content
          aria-label={t('documentContent')}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${A4_WIDTH_MM}mm`,
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
  backgroundImage,
  backgroundColour,
  style,
}: {
  children?: ReactNode
  layout: FluidDocumentLayout
  backgroundImage?: DocumentBackgroundImage
  backgroundColour?: DocumentBackgroundColour
  style?: CSSProperties
}) {
  const t = useTranslation()
  const { maxWidth, padding } = layout

  return (
    <LayoutContext.Provider value={{ mode: 'fluid', placements: {}, pageMargins: {} }}>
      <div
        data-document-layout="fluid"
        data-document-content
        aria-label={t('documentContent')}
        style={{
          width: `min(${maxWidth.value}${maxWidth.unit}, calc(100% - 24px))`,
          minHeight: 'calc(100vh - 24px)',
          margin: '12px auto',
          padding: `${padding.top}${padding.unit} ${padding.right}${padding.unit} ${padding.bottom}${padding.unit} ${padding.left}${padding.unit}`,
          boxSizing: 'border-box',
          background: backgroundColour ?? '#ffffff',
          color: '#08060d',
          position: 'relative',
          isolation: 'isolate',
          ...style,
        }}
      >
        <BackgroundLayer image={backgroundImage} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </div>
    </LayoutContext.Provider>
  )
}

export function DocumentCanvas({
  children,
  layout = defaultPagedLayout,
  backgroundImage,
  backgroundColour,
  isEditorCanvas = false,
  showEditorPageIndicators = false,
  showMarginGuides = true,
  selectedPageId,
  onPageSelect,
  onPagesChange,
  pageSettingsChannel,
  style,
}: DocumentCanvasProps) {
  return layout.mode === 'paged' ? (
    <PagedCanvas
      layout={layout}
      backgroundImage={backgroundImage}
      backgroundColour={backgroundColour}
      isEditorCanvas={isEditorCanvas}
      showEditorPageIndicators={showEditorPageIndicators}
      showMarginGuides={showMarginGuides}
      selectedPageId={selectedPageId}
      onPageSelect={onPageSelect}
      onPagesChange={onPagesChange}
      pageSettingsChannel={pageSettingsChannel}
      style={style}
    >
      {children}
    </PagedCanvas>
  ) : (
    <FluidCanvas
      layout={layout}
      backgroundImage={backgroundImage}
      backgroundColour={backgroundColour}
      style={style}
    >
      {children}
    </FluidCanvas>
  )
}
