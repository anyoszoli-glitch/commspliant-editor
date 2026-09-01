import type { Data } from '@puckeditor/core'
import { normalizeDocumentName } from './documentMetadata'
import { sanitizeRichTextHtml } from './richTextSanitizer'

export const DOCUMENT_SCHEMA_VERSION = 5 as const

export type RichTextMark = {
  type:
    | 'bold'
    | 'italic'
    | 'underline'
    | 'strike'
    | 'link'
    | 'fontFamily'
    | 'textColour'
    | 'textHighlight'
  attrs?: Record<string, unknown>
}

export type RichTextNode = {
  type:
    | 'doc'
    | 'paragraph'
    | 'heading'
    | 'text'
    | 'hardBreak'
    | 'bulletList'
    | 'orderedList'
    | 'listItem'
  attrs?: Record<string, unknown>
  content?: RichTextNode[]
  marks?: RichTextMark[]
  text?: string
}

export type RichTextDocument = RichTextNode & { type: 'doc' }
export type RichTextValue = string | RichTextDocument

export type SpacerSize = 'small' | 'medium' | 'large'
export type TableAlignment = 'left' | 'center' | 'right'
export type ImageAlignment = 'left' | 'center' | 'right'
export const MAX_IMAGE_HORIZONTAL_OFFSET = 25
export type ImageBlockData = {
  src?: string
  alt?: string
  title?: string
  /** Percentage of the available document content width. */
  width?: number
  alignment?: ImageAlignment
  /** Percentage of the available document content width. */
  horizontalOffset?: number
}
export type TableRow = { cells: string[] }
export type TableData = {
  rows: TableRow[]
  headerRow: boolean
  alignment: TableAlignment
}

export type EditorComponents = {
  HeadingBlock: { text: RichTextValue }
  TextBlock: { text: RichTextValue }
  NoticeBlock: { heading: string; text: RichTextValue }
  PageBreakBlock: {}
  TableBlock: { table: TableData }
  ImageBlock: { image: ImageBlockData }
  DividerBlock: {}
  SpacerBlock: { size: SpacerSize }
}
export type BackgroundImageFit =
  | 'fill'
  | 'contain'
  | 'cover'
  | 'none'
  | 'scale-down'

export type BackgroundImagePosition =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top left'
  | 'top right'
  | 'bottom left'
  | 'bottom right'

export type DocumentBackgroundImage = {
  src: string
  fit?: BackgroundImageFit
  position?: BackgroundImagePosition
  opacity?: number
}
export type DocumentBackgroundColour = `#${string}`

export function isDocumentBackgroundColour(
  value: unknown,
): value is DocumentBackgroundColour {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
}

export type PageMargins = {
  top: number
  right: number
  bottom: number
  left: number
  unit: 'mm'
}

export type PageSettings = {
  margins: PageMargins
}

export type PageNumbering =
  | 'none'
  | 'page-number'
  | 'page-number-of-total'
  | 'number'
  | 'number-of-total'

export function isPageNumbering(value: unknown): value is PageNumbering {
  return [
    'none',
    'page-number',
    'page-number-of-total',
    'number',
    'number-of-total',
  ].includes(String(value))
}

export function formatPageNumber(
  format: PageNumbering | undefined,
  page: number,
  total: number,
): string | undefined {
  switch (format) {
    case 'page-number':
      return `Page ${page}`
    case 'page-number-of-total':
      return `Page ${page} of ${total}`
    case 'number':
      return String(page)
    case 'number-of-total':
      return `${page} / ${total}`
    default:
      return undefined
  }
}

export type PagedDocumentLayout = {
  mode: 'paged'
  pageSize: 'A4'
  margins: PageMargins
  /**
   * Optional margin overrides keyed by stable rendered-page anchors. Pages without an
   * entry inherit the document-level margins above.
   */
  pageSettings?: Record<string, PageSettings>
  pageNumbering?: PageNumbering
}

export type FluidDocumentLayout = {
  mode: 'fluid'
  maxWidth: {
    value: number
    unit: 'px'
  }
  padding: {
    top: number
    right: number
    bottom: number
    left: number
    unit: 'px'
  }
}

export type DocumentLayout = PagedDocumentLayout | FluidDocumentLayout

export type DocumentData = Data<EditorComponents>

export type LetterDocument = {
  id: string
  schemaVersion: typeof DOCUMENT_SCHEMA_VERSION
  documentType: 'letter'
  name: string
  description: string
  status: 'draft'
  createdAt: string
  updatedAt: string
  data: DocumentData
  layout: DocumentLayout
  backgroundImage?: DocumentBackgroundImage
  backgroundColour?: DocumentBackgroundColour
}

export type CreateDocumentOptions = {
  name?: string
  description?: string
  now?: string
}

export const defaultPagedLayout: PagedDocumentLayout = {
  mode: 'paged',
  pageSize: 'A4',
  margins: { top: 20, right: 20, bottom: 20, left: 20, unit: 'mm' },
  pageNumbering: 'none',
}

export const defaultFluidLayout: FluidDocumentLayout = {
  mode: 'fluid',
  maxWidth: { value: 680, unit: 'px' },
  padding: { top: 32, right: 32, bottom: 32, left: 32, unit: 'px' },
}

function clonePageSettings(
  pageSettings: PagedDocumentLayout['pageSettings'],
): PagedDocumentLayout['pageSettings'] {
  if (!pageSettings) return undefined

  return Object.fromEntries(
    Object.entries(pageSettings).map(([pageId, settings]) => [
      pageId,
      { ...settings, margins: { ...settings.margins } },
    ]),
  )
}

export function getEffectivePageMargins(
  layout: PagedDocumentLayout,
  pageId: string,
): PageMargins {
  return layout.pageSettings?.[pageId]?.margins ?? layout.margins
}

export function createDocument(
  id = 'current-document',
  layout: DocumentLayout = defaultPagedLayout,
  options: CreateDocumentOptions = {},
): LetterDocument {
  const now = options.now ?? new Date().toISOString()

  return {
    id,
    schemaVersion: DOCUMENT_SCHEMA_VERSION,
    documentType: 'letter',
    name: normalizeDocumentName(options.name),
    description: options.description ?? '',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    data: { content: [], root: {} },
    layout:
      layout.mode === 'paged'
        ? {
            ...layout,
            margins: { ...layout.margins },
            pageSettings: clonePageSettings(layout.pageSettings),
          }
        : {
            ...layout,
            maxWidth: { ...layout.maxWidth },
            padding: { ...layout.padding },
          },
  }
}

export function changeDocumentLayout(
  document: LetterDocument,
  mode: DocumentLayout['mode'],
  pagedLayout: PagedDocumentLayout = defaultPagedLayout,
  fluidLayout: FluidDocumentLayout = defaultFluidLayout,
): LetterDocument {
  return {
    ...document,
    layout:
      mode === 'paged'
        ? {
            ...pagedLayout,
            margins: { ...pagedLayout.margins },
            pageSettings: clonePageSettings(pagedLayout.pageSettings),
          }
        : {
            ...fluidLayout,
            maxWidth: { ...fluidLayout.maxWidth },
            padding: { ...fluidLayout.padding },
          },
  }
}

export function sanitizeDocumentRichText(document: LetterDocument): LetterDocument {
  return {
    ...document,
    data: {
      ...document.data,
      content: document.data.content.map((item) => {
        if (item.type === 'HeadingBlock' && typeof item.props.text === 'string') {
          const isHtml = /<\/?[a-z][\s\S]*>/i.test(item.props.text)
          const text = isHtml
            ? sanitizeRichTextHtml(item.props.text, [1, 2, 3, 4, 5, 6])
            : `<h1>${item.props.text
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#39;')}</h1>`
          return { ...item, props: { ...item.props, text } }
        }
        if (item.type === 'TextBlock' && typeof item.props.text === 'string') {
          return { ...item, props: { ...item.props, text: sanitizeRichTextHtml(item.props.text) } }
        }
        if (item.type === 'NoticeBlock' && typeof item.props.text === 'string') {
          return { ...item, props: { ...item.props, text: sanitizeRichTextHtml(item.props.text) } }
        }
        if (item.type === 'ImageBlock') {
          return { ...item, props: { ...item.props, image: normalizeImageBlockData(item.props.image) } }
        }
        return item
      }),
    },
  }
}

export function isSafeImageSource(value: unknown): value is string {
  if (typeof value !== 'string') return false

  const source = value.trim()
  if (!source) return false

  try {
    const url = new URL(source, 'https://tili-toli.local')
    return (url.protocol === 'https:' || url.protocol === 'http:') &&
      !/\.svgz?(?:$|[?#])/i.test(url.pathname)
  } catch {
    return false
  }
}

export function getImageHorizontalOffsetBounds(
  width: number,
  alignment: ImageAlignment,
) {
  const availableSpace = Math.max(0, 100 - width)
  const limit = Math.min(
    MAX_IMAGE_HORIZONTAL_OFFSET,
    alignment === 'center' ? availableSpace / 2 : availableSpace,
  )

  if (alignment === 'left') return { min: 0, max: limit }
  if (alignment === 'right') return { min: -limit, max: 0 }
  return { min: -limit, max: limit }
}

export function normalizeImageBlockData(value: unknown): ImageBlockData {
  const image = value && typeof value === 'object' ? value as Partial<ImageBlockData> : {}
  const width = typeof image.width === 'number' && Number.isFinite(image.width)
    ? Math.min(100, Math.max(1, image.width))
    : 100

  const alignment =
    image.alignment === 'left' || image.alignment === 'right' || image.alignment === 'center'
      ? image.alignment
      : 'center'
  const offsetBounds = getImageHorizontalOffsetBounds(width, alignment)
  const horizontalOffset =
    typeof image.horizontalOffset === 'number' && Number.isFinite(image.horizontalOffset)
      ? Math.min(offsetBounds.max, Math.max(offsetBounds.min, image.horizontalOffset))
      : 0

  return {
    src: isSafeImageSource(image.src) ? image.src.trim() : undefined,
    alt: typeof image.alt === 'string' ? image.alt : '',
    title: typeof image.title === 'string' ? image.title : '',
    width,
    alignment,
    horizontalOffset,
  }
}

export function isLetterDocument(value: unknown): value is LetterDocument {
  if (!value || typeof value !== 'object') return false

  const document = value as Partial<LetterDocument>
  const layout = document.layout
  const createdAt = typeof document.createdAt === 'string' ? Date.parse(document.createdAt) : NaN
  const updatedAt = typeof document.updatedAt === 'string' ? Date.parse(document.updatedAt) : NaN

  const validLayout =
    (layout?.mode === 'fluid' &&
      layout.maxWidth?.unit === 'px' &&
      typeof layout.maxWidth?.value === 'number' &&
      layout.padding?.unit === 'px' &&
      typeof layout.padding?.top === 'number' &&
      typeof layout.padding?.right === 'number' &&
      typeof layout.padding?.bottom === 'number' &&
      typeof layout.padding?.left === 'number') ||
    (layout?.mode === 'paged' &&
      layout.pageSize === 'A4' &&
      (layout.pageNumbering === undefined || isPageNumbering(layout.pageNumbering)) &&
      layout.margins?.unit === 'mm' &&
      typeof layout.margins?.top === 'number' &&
      typeof layout.margins?.right === 'number' &&
      typeof layout.margins?.bottom === 'number' &&
      typeof layout.margins?.left === 'number' &&
      (layout.pageSettings === undefined ||
        (typeof layout.pageSettings === 'object' &&
          layout.pageSettings !== null &&
          Object.values(layout.pageSettings).every(
            (settings) =>
              !!settings &&
              typeof settings === 'object' &&
              (settings as PageSettings).margins?.unit === 'mm' &&
              typeof (settings as PageSettings).margins?.top === 'number' &&
              typeof (settings as PageSettings).margins?.right === 'number' &&
              typeof (settings as PageSettings).margins?.bottom === 'number' &&
              typeof (settings as PageSettings).margins?.left === 'number',
          ))))

  const validBackgroundColour =
    document.backgroundColour === undefined ||
    isDocumentBackgroundColour(document.backgroundColour)

  return (
    typeof document.id === 'string' &&
    document.schemaVersion === DOCUMENT_SCHEMA_VERSION &&
    document.documentType === 'letter' &&
    typeof document.name === 'string' &&
    normalizeDocumentName(document.name) === document.name &&
    typeof document.description === 'string' &&
    document.status === 'draft' &&
    Number.isFinite(createdAt) &&
    Number.isFinite(updatedAt) &&
    document.createdAt === new Date(createdAt).toISOString() &&
    document.updatedAt === new Date(updatedAt).toISOString() &&
    createdAt <= updatedAt &&
    Array.isArray(document.data?.content) &&
    typeof document.data?.root === 'object' &&
    document.data.root !== null &&
    validLayout &&
    validBackgroundColour
  )
}
