import {
  DOCUMENT_STORAGE_KEY,
  DOCUMENT_SCHEMA_VERSION,
  createDocument,
  defaultFluidLayout,
  isLetterDocument,
  type LetterDocument,
} from './document'
import { normalizeDocumentName } from './documentMetadata'

export const DOCUMENT_NAME_STORAGE_KEY = 'commspliant.document.current.name'

function browserStorage(): Storage | undefined {
  return typeof window === 'undefined' ? undefined : window.localStorage
}

function migrateDocument(value: unknown): LetterDocument | undefined {
  if (!value || typeof value !== 'object') return undefined

  const storedDocument = value as {
    id?: unknown
    schemaVersion?: unknown
    documentType?: unknown
    data?: unknown
    page?: {
      size?: unknown
      margins?: unknown
    }
    layout?: {
      mode?: unknown
      pageSize?: unknown
      margins?: unknown
    }
  }

  if (typeof storedDocument.id !== 'string' || storedDocument.documentType !== 'letter') {
    return undefined
  }

  let layout: unknown

  if (storedDocument.schemaVersion === 1 && storedDocument.page?.size === 'A4') {
    layout = {
      mode: 'paged',
      pageSize: 'A4',
      margins: storedDocument.page.margins,
    }
  } else if (storedDocument.schemaVersion === 2 && storedDocument.layout?.mode === 'paged') {
    layout = {
      mode: 'paged',
      pageSize: storedDocument.layout.pageSize,
      margins: storedDocument.layout.margins,
    }
  } else if (storedDocument.schemaVersion === 2 && storedDocument.layout?.mode === 'fluid') {
    layout = defaultFluidLayout
  } else {
    return undefined
  }

  const migratedDocument = {
    id: storedDocument.id,
    schemaVersion: DOCUMENT_SCHEMA_VERSION,
    documentType: 'letter',
    data: storedDocument.data,
    layout,
  }

  return isLetterDocument(migratedDocument) ? migratedDocument : undefined
}

export function loadDocument(storage = browserStorage()): LetterDocument {
  const storedDocument = storage?.getItem(DOCUMENT_STORAGE_KEY)
  if (!storedDocument) return createDocument()

  try {
    const parsedDocument: unknown = JSON.parse(storedDocument)
    return isLetterDocument(parsedDocument)
      ? parsedDocument
      : (migrateDocument(parsedDocument) ?? createDocument())
  } catch {
    return createDocument()
  }
}

export function saveDocument(document: LetterDocument, storage = browserStorage()): void {
  storage?.setItem(DOCUMENT_STORAGE_KEY, JSON.stringify(document))
}

export function loadDocumentName(storage = browserStorage()): string {
  return normalizeDocumentName(storage?.getItem(DOCUMENT_NAME_STORAGE_KEY) ?? undefined)
}

export function saveDocumentName(documentName: string, storage = browserStorage()): void {
  storage?.setItem(DOCUMENT_NAME_STORAGE_KEY, normalizeDocumentName(documentName))
}
