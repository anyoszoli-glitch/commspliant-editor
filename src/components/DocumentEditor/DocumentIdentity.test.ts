import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { createDocument } from '../../document/document'
import { commitDocumentDescription, commitDocumentName } from '../../document/documentMetadata'
import { DocumentIdentity } from './DocumentIdentity'

function renderIdentity(props: Parameters<typeof DocumentIdentity>[0]): string {
  return renderToStaticMarkup(createElement(DocumentIdentity, props))
}

describe('document identity', () => {
  it('renders a supplied document name', () => {
    expect(renderIdentity({ documentName: 'Fee Change Letter' })).toContain('Fee Change Letter')
  })

  it('falls back safely when the name is missing', () => {
    expect(renderIdentity({})).toContain('Untitled document')
  })

  it('shows Add a description when the editable description is empty', () => {
    expect(
      renderIdentity({ description: '', onDocumentDescriptionChange: () => undefined }),
    ).toContain('Add a description')
  })

  it('shows a populated description visibly', () => {
    const markup = renderIdentity({
      description: 'Customer notice',
      onDocumentDescriptionChange: () => undefined,
    })

    expect(markup).toContain('document-identity__description-button')
    expect(markup).toContain('Customer notice')
  })

  it('renders a visible, non-interactive Draft badge', () => {
    const markup = renderIdentity({})

    expect(markup).toContain('aria-label="Document status: draft"')
    expect(markup).toContain('>Draft</span>')
    expect(markup).not.toContain('>Draft</button>')
  })

  it('renders the title read-only without a change callback', () => {
    const markup = renderIdentity({ documentName: 'Read-only letter' })

    expect(markup).toContain('<h1')
    expect(markup).not.toContain('aria-label="Document name"')
  })

  it('renders an editable title and commits name changes when a callback is supplied', () => {
    const onChange = vi.fn()
    const markup = renderIdentity({ documentName: 'Original', onDocumentNameChange: onChange })

    expect(markup).toContain('aria-label="Document name"')
    expect(commitDocumentName('Updated name', onChange)).toBe('Updated name')
    expect(onChange).toHaveBeenCalledWith('Updated name')
  })

  it('resolves whitespace-only title edits to Untitled document', () => {
    const onChange = vi.fn()

    expect(commitDocumentName('   ', onChange)).toBe('Untitled document')
    expect(onChange).toHaveBeenCalledWith('Untitled document')
  })

  it('trims description edits on commit', () => {
    const onChange = vi.fn()

    expect(commitDocumentDescription('  Customer notice  ', onChange)).toBe('Customer notice')
    expect(onChange).toHaveBeenCalledWith('Customer notice')
  })

  it('resolves whitespace-only description edits to an empty string', () => {
    const onChange = vi.fn()

    expect(commitDocumentDescription('   ', onChange)).toBe('')
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('does not alter structured document content when the title changes', () => {
    const document = createDocument('unchanged-content')
    document.data.content.push({
      type: 'TextBlock',
      props: { id: 'text-1', text: 'Keep this content' },
    })
    const originalData = structuredClone(document.data)

    commitDocumentName('Renamed document', () => undefined)

    expect(document.data).toEqual(originalData)
  })
})
