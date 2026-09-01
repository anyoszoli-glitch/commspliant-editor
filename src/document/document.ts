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
export type TableRow = { cells: string[] }
export type TableData = {
  rows: TableRow[]
  headerRow: boolean
  alignment: TableAlignment
}

export type EditorComponents = {
  HeadingBlock: { text: string }
  TextBlock: { text: RichTextValue }
  NoticeBlock: { heading: string; text: RichTextValue }
  PageBreakBlock: {}
  TableBlock: { table: TableData }
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
export type PageMargins = {
  top: number
  right: number
  bottom: number
  left: number
  unit: 'mm'
}

export type PagedDocumentLayout = {
  mode: 'paged'
  pageSize: 'A4'
  margins: PageMargins
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
}

export const defaultFluidLayout: FluidDocumentLayout = {
  mode: 'fluid',
  maxWidth: { value: 680, unit: 'px' },
  padding: { top: 32, right: 32, bottom: 32, left: 32, unit: 'px' },
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
        ? { ...layout, margins: { ...layout.margins } }
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
        ? { ...pagedLayout, margins: { ...pagedLayout.margins } }
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
        if (item.type === 'TextBlock' && typeof item.props.text === 'string') {
          return { ...item, props: { ...item.props, text: sanitizeRichTextHtml(item.props.text) } }
        }
        if (item.type === 'NoticeBlock' && typeof item.props.text === 'string') {
          return { ...item, props: { ...item.props, text: sanitizeRichTextHtml(item.props.text) } }
        }
        return item
      }),
    },
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
      layout.margins?.unit === 'mm' &&
      typeof layout.margins?.top === 'number' &&
      typeof layout.margins?.right === 'number' &&
      typeof layout.margins?.bottom === 'number' &&
      typeof layout.margins?.left === 'number')

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
    validLayout
  )
}
