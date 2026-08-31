import {
  DOCUMENT_STORAGE_KEY,
  DOCUMENT_SCHEMA_VERSION,
  createDocument,
  defaultFluidLayout,
  isLetterDocument,
  sanitizeDocumentRichText,
  type LetterDocument,
} from './document'
import { normalizeDocumentName } from './documentMetadata'

export const DOCUMENT_NAME_STORAGE_KEY = 'commspliant.document.current.name'

function browserStorage(): Storage | undefined {
  return typeof window === 'undefined' ? undefined : window.localStorage
}

function migrateDocument(
  value: unknown,
  legacyName: string | undefined,
  migrationTime: string,
): LetterDocument | undefined {
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

  if (storedDocument.schemaVersion === 4) {
    const migratedDocument = {
      ...storedDocument,
      schemaVersion: DOCUMENT_SCHEMA_VERSION,
    }

    return isLetterDocument(migratedDocument) ? migratedDocument : undefined
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
  } else if (storedDocument.schemaVersion === 3) {
    layout = storedDocument.layout
  } else {
    return undefined
  }

  const migratedDocument = {
    id: storedDocument.id,
    schemaVersion: DOCUMENT_SCHEMA_VERSION,
    documentType: 'letter',
    name: normalizeDocumentName(legacyName),
    description: '',
    status: 'draft',
    createdAt: migrationTime,
    updatedAt: migrationTime,
    data: storedDocument.data,
    layout,
  }

  return isLetterDocument(migratedDocument) ? migratedDocument : undefined
}

export function loadDocument(
  storage = browserStorage(),
  now = new Date().toISOString(),
): LetterDocument {
  const storedDocument = storage?.getItem(DOCUMENT_STORAGE_KEY)
  if (!storedDocument) return createDocument('current-document', undefined, { now })

  try {
    const parsedDocument: unknown = JSON.parse(storedDocument)
    const canonicalDocument = isLetterDocument(parsedDocument)
      ? parsedDocument
      : (migrateDocument(
          parsedDocument,
          storage?.getItem(DOCUMENT_NAME_STORAGE_KEY) ?? undefined,
          now,
        ) ?? createDocument('current-document', undefined, { now }))
    return sanitizeDocumentRichText(canonicalDocument)
  } catch {
    return createDocument('current-document', undefined, { now })
  }
}

export function saveDocument(
  document: LetterDocument,
  storage = browserStorage(),
  now = new Date().toISOString(),
): LetterDocument {
  const currentUpdatedAt = Date.parse(document.updatedAt)
  const requestedUpdatedAt = Date.parse(now)
  const updatedAt = new Date(
    requestedUpdatedAt > currentUpdatedAt ? requestedUpdatedAt : currentUpdatedAt + 1,
  ).toISOString()
  const savedDocument = sanitizeDocumentRichText({ ...document, updatedAt })

  storage?.setItem(DOCUMENT_STORAGE_KEY, JSON.stringify(savedDocument))
  return savedDocument
}
