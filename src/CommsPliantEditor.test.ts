import { describe, expect, it } from 'vitest'
import * as publicApi from './CommsPliantEditor'

describe('reusable package boundary', () => {
  it('creates and validates shared-contract documents through the public API', () => {
    const document = publicApi.createDocument('public-boundary', undefined, {
      name: 'Public boundary document',
      now: '2026-09-01T00:00:00.000Z',
    })

    expect(document.schemaVersion).toBe(publicApi.DOCUMENT_SCHEMA_VERSION)
    expect(publicApi.isLetterDocument(document)).toBe(true)
  })

  it('does not expose standalone persistence through the package root', () => {
    expect('DOCUMENT_STORAGE_KEY' in publicApi).toBe(false)
    expect('loadDocument' in publicApi).toBe(false)
    expect('saveDocument' in publicApi).toBe(false)
  })
})
