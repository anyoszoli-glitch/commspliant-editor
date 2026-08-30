import { describe, expect, it } from 'vitest'
import {
  DOCUMENT_SCHEMA_VERSION,
  DOCUMENT_STORAGE_KEY,
  changeDocumentLayout,
  createDocument,
} from './document'
import { loadDocument, saveDocument } from './documentStorage'

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

  it('falls back to a new document for corrupt or unsupported data', () => {
    expect(loadDocument(createStorage('not JSON')).data.content).toEqual([])
    expect(
      loadDocument(createStorage(JSON.stringify({ ...createDocument(), schemaVersion: 999 }))).data
        .content,
    ).toEqual([])
  })
})
