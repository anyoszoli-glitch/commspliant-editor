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
  saveDocument,
} from './documentStorage'

const createdAt = '2026-08-30T09:00:00.000Z'

function createStorage(initialValue?: string, legacyName?: string): Storage {
  const values = new Map<string, string>()
  if (initialValue !== undefined) values.set(DOCUMENT_STORAGE_KEY, initialValue)
  if (legacyName !== undefined) values.set(DOCUMENT_NAME_STORAGE_KEY, legacyName)

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
  it('creates a schema 4 draft with canonical metadata and deterministic timestamps', () => {
    const document = loadDocument(createStorage(), createdAt)

    expect(document).toMatchObject({
      id: 'current-document',
      schemaVersion: DOCUMENT_SCHEMA_VERSION,
      documentType: 'letter',
      name: 'Untitled document',
      description: '',
      status: 'draft',
      createdAt,
      updatedAt: createdAt,
      data: { content: [], root: {} },
      layout: { mode: 'paged', pageSize: 'A4', margins: { unit: 'mm' } },
    })
  })

  it('normalizes names when creating a document', () => {
    expect(createDocument('named-letter', undefined, { name: '  Fee Change Letter  ', now: createdAt }))
      .toMatchObject({ name: 'Fee Change Letter', createdAt, updatedAt: createdAt })
    expect(createDocument('untitled-letter', undefined, { name: '   ', now: createdAt }).name)
      .toBe('Untitled document')
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

  it('migrates a schema 1 document to schema 4', () => {
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

    expect(
      loadDocument(
        createStorage(JSON.stringify(phaseOneDocument), ' Legacy letter '),
        createdAt,
      ),
    ).toMatchObject({
      id: 'old-letter',
      schemaVersion: DOCUMENT_SCHEMA_VERSION,
      name: 'Legacy letter',
      description: '',
      status: 'draft',
      createdAt,
      updatedAt: createdAt,
      data: phaseOneDocument.data,
      layout: {
        mode: 'paged',
        pageSize: 'A4',
        margins: { top: 15, right: 16, bottom: 17, left: 18, unit: 'mm' },
      },
    })
  })

  it('migrates a schema 2 fluid document to schema 4', () => {
    const phaseTwoDocument = {
      id: 'old-fluid-letter',
      schemaVersion: 2,
      documentType: 'letter',
      data: { content: [], root: {} },
      layout: { mode: 'fluid' },
    }

    expect(loadDocument(createStorage(JSON.stringify(phaseTwoDocument)), createdAt)).toMatchObject({
      schemaVersion: DOCUMENT_SCHEMA_VERSION,
      name: 'Untitled document',
      description: '',
      status: 'draft',
      createdAt,
      updatedAt: createdAt,
      layout: {
        mode: 'fluid',
        maxWidth: { value: 680, unit: 'px' },
        padding: { top: 32, right: 32, bottom: 32, left: 32, unit: 'px' },
      },
    })
  })

  it('migrates a schema 3 document without changing its identity, content, or layout', () => {
    const schemaThreeDocument = {
      id: 'schema-three-letter',
      schemaVersion: 3,
      documentType: 'letter',
      data: {
        content: [{ type: 'HeadingBlock', props: { id: 'heading-1', text: 'Preserved' } }],
        root: {},
      },
      layout: {
        mode: 'paged',
        pageSize: 'A4',
        margins: { top: 15, right: 16, bottom: 17, left: 18, unit: 'mm' },
      },
    }

    expect(
      loadDocument(
        createStorage(JSON.stringify(schemaThreeDocument), 'Schema 3 letter'),
        createdAt,
      ),
    ).toMatchObject({
      id: schemaThreeDocument.id,
      schemaVersion: DOCUMENT_SCHEMA_VERSION,
      name: 'Schema 3 letter',
      description: '',
      status: 'draft',
      createdAt,
      updatedAt: createdAt,
      data: schemaThreeDocument.data,
      layout: schemaThreeDocument.layout,
    })
  })

  it('round-trips serializable Puck content', () => {
    const storage = createStorage()
    const document = createDocument('letter-1')
    document.data.content.push({
      type: 'HeadingBlock',
      props: { id: 'heading-1', text: 'Saved heading' },
    })

    const savedDocument = saveDocument(document, storage)

    expect(loadDocument(storage)).toEqual(savedDocument)
  })

  it('imports and normalizes the legacy standalone name without deleting it', () => {
    const schemaThreeDocument = {
      id: 'legacy-name-letter',
      schemaVersion: 3,
      documentType: 'letter',
      data: { content: [], root: {} },
      layout: {
        mode: 'paged',
        pageSize: 'A4',
        margins: { top: 20, right: 20, bottom: 20, left: 20, unit: 'mm' },
      },
    }
    const storage = createStorage(JSON.stringify(schemaThreeDocument), '  Fee Change Letter  ')

    expect(loadDocument(storage, createdAt).name).toBe('Fee Change Letter')
    expect(storage.getItem(DOCUMENT_NAME_STORAGE_KEY)).toBe('  Fee Change Letter  ')
  })

  it('falls back to Untitled document when a legacy name is missing', () => {
    const schemaThreeDocument = {
      id: 'unnamed-legacy-letter',
      schemaVersion: 3,
      documentType: 'letter',
      data: { content: [], root: {} },
      layout: {
        mode: 'paged',
        pageSize: 'A4',
        margins: { top: 20, right: 20, bottom: 20, left: 20, unit: 'mm' },
      },
    }

    expect(loadDocument(createStorage(JSON.stringify(schemaThreeDocument)), createdAt).name)
      .toBe('Untitled document')
  })

  it('preserves createdAt and advances updatedAt on each save', () => {
    const storage = createStorage()
    const document = createDocument('timestamped-letter', undefined, { now: createdAt })
    const firstSave = saveDocument(document, storage, '2026-08-30T09:05:00.000Z')
    const secondSave = saveDocument(firstSave, storage, '2026-08-30T09:05:00.000Z')

    expect(firstSave.createdAt).toBe(createdAt)
    expect(firstSave.updatedAt).toBe('2026-08-30T09:05:00.000Z')
    expect(secondSave.createdAt).toBe(createdAt)
    expect(secondSave.updatedAt).toBe('2026-08-30T09:05:00.001Z')
    expect(loadDocument(storage)).toEqual(secondSave)
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

  it('serializes and restores NoticeBlock content', () => {
    const storage = createStorage()
    const noticeText = {
      type: 'doc' as const,
      content: [
        {
          type: 'paragraph' as const,
          content: [{ type: 'text' as const, text: 'Please read this carefully.' }],
        },
      ],
    }
    const document = createDocument('notice-letter')
    document.data.content.push({
      type: 'NoticeBlock',
      props: { id: 'notice-1', heading: 'Important notice', text: noticeText },
    })

    saveDocument(document, storage)

    expect(loadDocument(storage).data.content).toContainEqual({
      type: 'NoticeBlock',
      props: { id: 'notice-1', heading: 'Important notice', text: noticeText },
    })
  })

  it('preserves NoticeBlock and existing content through paged and fluid switching', () => {
    const document = createDocument('switching-notice-letter')
    document.data.content.push(
      { type: 'HeadingBlock', props: { id: 'heading-1', text: 'Existing heading' } },
      {
        type: 'NoticeBlock',
        props: { id: 'notice-1', heading: 'Action required', text: 'Please take action.' },
      },
    )

    const restored = changeDocumentLayout(changeDocumentLayout(document, 'fluid'), 'paged')

    expect(restored.data.content).toEqual(document.data.content)
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
