import { describe, expect, it } from 'vitest'
import * as publicApi from './CommsPliantEditor'

describe('reusable package boundary', () => {
  it('exports the host-provided AI model option and request types', () => {
    const model: publicApi.AiAssistantModelOption = {
      id: 'writing-helper',
      displayName: 'Writing helper',
    }
    const request: publicApi.AiAssistantRequest = {
      action: 'rewrite',
      context: 'document',
      modelId: model.id,
    }

    expect(request.modelId).toBe('writing-helper')
  })

  it('creates and validates shared-contract documents through the public API', () => {
    const document = publicApi.createDocument('public-boundary', undefined, {
      name: 'Public boundary document',
      now: '2026-09-01T00:00:00.000Z',
    })

    expect(document.schemaVersion).toBe(publicApi.DOCUMENT_SCHEMA_VERSION)
    expect(publicApi.isLetterDocument(document)).toBe(true)
    document.backgroundColour = '#eaf0f4'
    expect(publicApi.isDocumentBackgroundColour(document.backgroundColour)).toBe(true)
    expect(publicApi.isLetterDocument(document)).toBe(true)
    expect(publicApi.isDocumentBackgroundColour('light blue')).toBe(false)
    expect(publicApi.isPageNumbering('number-of-total')).toBe(true)
    expect(publicApi.isPageNumbering('custom-footer')).toBe(false)
    expect(
      publicApi.isLetterDocument({ ...document, backgroundColour: 'light blue' }),
    ).toBe(false)
  })

  it('does not expose standalone persistence through the package root', () => {
    expect('DOCUMENT_STORAGE_KEY' in publicApi).toBe(false)
    expect('loadDocument' in publicApi).toBe(false)
    expect('saveDocument' in publicApi).toBe(false)
  })
})
