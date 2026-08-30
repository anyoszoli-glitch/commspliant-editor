import type { Data } from '@puckeditor/core'

export const DOCUMENT_SCHEMA_VERSION = 3 as const
export const DOCUMENT_STORAGE_KEY = 'commspliant.document.current'

export type RichTextMark = {
  type: 'bold' | 'italic' | 'underline' | 'link'
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

export type EditorComponents = {
  HeadingBlock: { text: string }
  TextBlock: { text: RichTextValue }
  PageBreakBlock: {}
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
  data: DocumentData
  layout: DocumentLayout
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
): LetterDocument {
  return {
    id,
    schemaVersion: DOCUMENT_SCHEMA_VERSION,
    documentType: 'letter',
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

export function isLetterDocument(value: unknown): value is LetterDocument {
  if (!value || typeof value !== 'object') return false

  const document = value as Partial<LetterDocument>
  const layout = document.layout

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
    Array.isArray(document.data?.content) &&
    typeof document.data?.root === 'object' &&
    document.data.root !== null &&
    validLayout
  )
}
