import { page, userEvent } from 'vitest/browser'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'
import { DOCUMENT_STORAGE_KEY, createDocument } from './document/document'
import {
  DOCUMENT_NAME_STORAGE_KEY,
  loadDocument,
  loadDocumentName,
  saveDocument,
  saveDocumentName,
} from './document/documentStorage'

const originalHeading = 'Original customer heading'
const editedHeading = 'Updated customer heading'
const editedName = 'Updated customer letter'

let root: Root | undefined
let container: HTMLDivElement | undefined

function mountApp() {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  root.render(<App />)
}

function unmountApp() {
  root?.unmount()
  container?.remove()
  root = undefined
  container = undefined
}

async function puckHeading(text: string) {
  let frame: HTMLIFrameElement | undefined

  await expect.poll(() => {
    frame = document.querySelector<HTMLIFrameElement>('#preview-frame') ?? undefined
    return frame?.contentDocument?.readyState
  }).toBe('complete')

  const heading = page
    .frameLocator(page.elementLocator(frame!))
    .getByText(text, { exact: true })
  await expect.element(heading).toBeVisible()

  return heading
}

afterEach(() => {
  unmountApp()
  localStorage.removeItem(DOCUMENT_STORAGE_KEY)
  localStorage.removeItem(DOCUMENT_NAME_STORAGE_KEY)
})

describe('App persistence', () => {
  it('restores edited content, document name, and layout after publishing and remounting', async () => {
    await page.viewport(1440, 900)
    localStorage.removeItem(DOCUMENT_STORAGE_KEY)
    localStorage.removeItem(DOCUMENT_NAME_STORAGE_KEY)

    const seededDocument = createDocument('browser-test-document')
    seededDocument.data.content.push({
      type: 'HeadingBlock',
      props: { id: 'heading-1', text: originalHeading },
    })
    saveDocument(seededDocument)
    saveDocumentName('Original customer letter')

    mountApp()

    const heading = await puckHeading(originalHeading)
    await heading.hover()
    await expect.element(heading).toHaveAttribute('contenteditable', 'plaintext-only')
    await heading.fill(editedHeading)
    await userEvent.tab()

    const nameInput = page.getByRole('textbox', { name: 'Document name' })
    await userEvent.fill(nameInput, editedName)
    await userEvent.tab()

    await userEvent.click(page.getByRole('button', { name: 'Fluid' }))
    await expect.element(page.getByRole('button', { name: 'Fluid' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await puckHeading(editedHeading)
    await page.getByText('Publish', { exact: true }).click()

    await expect.poll(() => loadDocument().layout.mode).toBe('fluid')
    expect(loadDocument().data.content[0]).toMatchObject({
      type: 'HeadingBlock',
      props: { id: 'heading-1', text: editedHeading },
    })
    expect(loadDocumentName()).toBe(editedName)

    unmountApp()
    mountApp()

    await expect.element(page.getByRole('textbox', { name: 'Document name' })).toHaveValue(
      editedName,
    )
    await expect.element(page.getByRole('button', { name: 'Fluid' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await puckHeading(editedHeading)
  })
})
