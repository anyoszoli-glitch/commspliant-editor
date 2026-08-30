import { describe, expect, it } from 'vitest'
import {
  DOCUMENT_SCHEMA_VERSION,
  DOCUMENT_STORAGE_KEY,
  changeDocumentLayout,
  createDocument,
} from './document'
import {
  DOCUMENT_NAME_STORAGE_KEY,
  loadDocument,
  loadDocumentName,
  saveDocument,
  saveDocumentName,
} from './documentStorage'

function createStorage(initialValue?: string): Storage {
  const values = new Map<string, string>()
  if (initialValue !== undefined) values.set(DOCUMENT_STORAGE_KEY, initialValue)

  return {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  }
}

describe('document storage', () => {
  it('creates a versioned paged A4 letter document when nothing is stored', () => {
    const document = loadDocument(createStorage())

    expect(document).toMatchObject({
      id: 'current-document',
      schemaVersion: DOCUMENT_SCHEMA_VERSION,
      documentType: 'letter',
      data: { content: [], root: {} },
      layout: { mode: 'paged', pageSize: 'A4', margins: { unit: 'mm' } },
    })
  })

  it('serializes and restores paged and fluid layouts', () => {
    const pagedStorage = createStorage()
    const fluidStorage = createStorage()
    const pagedDocument = createDocument('paged-letter')
    const fluidDocument = changeDocumentLayout(createDocument('fluid-letter'), 'fluid')

    saveDocument(pagedDocument, pagedStorage)
    saveDocument(fluidDocument, fluidStorage)

    expect(loadDocument(pagedStorage).layout).toEqual(pagedDocument.layout)
    expect(loadDocument(fluidStorage).layout).toEqual({
      mode: 'fluid',
      maxWidth: { value: 680, unit: 'px' },
      padding: { top: 32, right: 32, bottom: 32, left: 32, unit: 'px' },
    })
  })

  it('preserves Puck content when switching layouts', () => {
    const document = createDocument()
    document.data.content.push({
      type: 'TextBlock',
      props: { id: 'text-1', text: 'Keep this content' },
    })

    const fluidDocument = changeDocumentLayout(document, 'fluid')
    const pagedDocument = changeDocumentLayout(fluidDocument, 'paged')

    expect(fluidDocument.data).toBe(document.data)
    expect(pagedDocument.data).toBe(document.data)
    expect(pagedDocument.layout.mode).toBe('paged')
  })

  it('migrates a Phase 1 saved document to paged layout', () => {
    const phaseOneDocument = {
      id: 'old-letter',
      schemaVersion: 1,
      documentType: 'letter',
      data: { content: [], root: {} },
      page: {
        size: 'A4',
        margins: { top: 15, right: 16, bottom: 17, left: 18, unit: 'mm' },
      },
    }

    expect(loadDocument(createStorage(JSON.stringify(phaseOneDocument)))).toMatchObject({
      id: 'old-letter',
      schemaVersion: DOCUMENT_SCHEMA_VERSION,
      layout: {
        mode: 'paged',
        pageSize: 'A4',
        margins: { top: 15, right: 16, bottom: 17, left: 18, unit: 'mm' },
      },
    })
  })

  it('adds explicit fluid settings when migrating a Phase 2 fluid document', () => {
    const phaseTwoDocument = {
      id: 'old-fluid-letter',
      schemaVersion: 2,
      documentType: 'letter',
      data: { content: [], root: {} },
      layout: { mode: 'fluid' },
    }

    expect(loadDocument(createStorage(JSON.stringify(phaseTwoDocument))).layout).toEqual({
      mode: 'fluid',
      maxWidth: { value: 680, unit: 'px' },
      padding: { top: 32, right: 32, bottom: 32, left: 32, unit: 'px' },
    })
  })

  it('round-trips serializable Puck content', () => {
    const storage = createStorage()
    const document = createDocument('letter-1')
    document.data.content.push({
      type: 'HeadingBlock',
      props: { id: 'heading-1', text: 'Saved heading' },
    })

    saveDocument(document, storage)

    expect(loadDocument(storage)).toEqual(document)
  })

  it('persists and restores the standalone document name separately', () => {
    const storage = createStorage()

    saveDocumentName('Fee Change Letter', storage)

    expect(loadDocumentName(storage)).toBe('Fee Change Letter')
    expect(storage.getItem(DOCUMENT_NAME_STORAGE_KEY)).toBe('Fee Change Letter')
    expect(storage.getItem(DOCUMENT_STORAGE_KEY)).toBeNull()
  })

  it('uses Untitled document for old standalone content without a saved name', () => {
    const storage = createStorage()
    saveDocument(createDocument('old-standalone-document'), storage)

    expect(loadDocument(storage).id).toBe('old-standalone-document')
    expect(loadDocumentName(storage)).toBe('Untitled document')
  })

  it('continues to load existing plain TextBlock values', () => {
    const storage = createStorage()
    const document = createDocument('legacy-text-letter')
    document.data.content.push({
      type: 'TextBlock',
      props: { id: 'text-1', text: 'Existing plain text' },
    })

    saveDocument(document, storage)

    expect(loadDocument(storage).data.content).toContainEqual({
      type: 'TextBlock',
      props: { id: 'text-1', text: 'Existing plain text' },
    })
  })

  it('serializes and restores rich TextBlock formatting', () => {
    const storage = createStorage()
    const document = createDocument('rich-text-letter')
    const richText = {
      type: 'doc' as const,
      content: [
        {
          type: 'paragraph' as const,
          content: [
            { type: 'text' as const, text: 'Important', marks: [{ type: 'bold' as const }] },
            { type: 'text' as const, text: ' and considered', marks: [{ type: 'italic' as const }] },
            {
              type: 'text' as const,
              text: ' guidance',
              marks: [{ type: 'underline' as const }],
            },
            {
              type: 'text' as const,
              text: ' online',
              marks: [{ type: 'link' as const, attrs: { href: 'https://example.com' } }],
            },
          ],
        },
        {
          type: 'heading' as const,
          attrs: { level: 2 },
          content: [{ type: 'text' as const, text: 'Internal section' }],
        },
        {
          type: 'bulletList' as const,
          content: [
            {
              type: 'listItem' as const,
              content: [{ type: 'paragraph' as const, content: [{ type: 'text' as const, text: 'Item' }] }],
            },
          ],
        },
        {
          type: 'orderedList' as const,
          content: [
            {
              type: 'listItem' as const,
              content: [
                { type: 'paragraph' as const, content: [{ type: 'text' as const, text: 'Step' }] },
              ],
            },
          ],
        },
      ],
    }
    document.data.content.push({
      type: 'TextBlock',
      props: { id: 'text-1', text: richText },
    })

    saveDocument(document, storage)

    expect(loadDocument(storage).data.content[0]).toMatchObject({ props: { text: richText } })
  })

  it('preserves rich TextBlock formatting through layout switching', () => {
    const document = createDocument('switching-rich-text-letter')
    const richText = {
      type: 'doc' as const,
      content: [
        {
          type: 'paragraph' as const,
          content: [
            { type: 'text' as const, text: 'Styled', marks: [{ type: 'italic' as const }] },
          ],
        },
      ],
    }
    document.data.content.push({
      type: 'TextBlock',
      props: { id: 'text-1', text: richText },
    })

    const restored = changeDocumentLayout(changeDocumentLayout(document, 'fluid'), 'paged')

    expect(restored.data.content[0]).toMatchObject({ props: { text: richText } })
  })

  it('serializes and restores explicit page breaks', () => {
    const storage = createStorage()
    const document = createDocument('letter-with-break')
    document.data.content.push({
      type: 'PageBreakBlock',
      props: { id: 'page-break-1' },
    })

    saveDocument(document, storage)

    expect(loadDocument(storage).data.content).toContainEqual({
      type: 'PageBreakBlock',
      props: { id: 'page-break-1' },
    })
  })

  it('preserves explicit page breaks through paged, fluid, and paged switching', () => {
    const document = createDocument()
    document.data.content.push({
      type: 'PageBreakBlock',
      props: { id: 'page-break-1' },
    })

    const fluidDocument = changeDocumentLayout(document, 'fluid')
    const pagedDocument = changeDocumentLayout(fluidDocument, 'paged')

    expect(fluidDocument.data.content).toEqual(document.data.content)
    expect(pagedDocument.data.content).toEqual(document.data.content)
  })

  it('falls back to a new document for corrupt or unsupported data', () => {
    expect(loadDocument(createStorage('not JSON')).data.content).toEqual([])
    expect(
      loadDocument(createStorage(JSON.stringify({ ...createDocument(), schemaVersion: 999 }))).data
        .content,
    ).toEqual([])
  })
})
