import { page, userEvent } from 'vitest/browser'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'
import { DOCUMENT_SCHEMA_VERSION, DOCUMENT_STORAGE_KEY, type LetterDocument } from './document/document'
import { DOCUMENT_NAME_STORAGE_KEY, loadDocument } from './document/documentStorage'

const originalHeading = 'Original customer heading'
const editedHeading = 'Updated customer heading'
const editedName = 'Updated customer letter'
const editedDescription = 'Customer notice for the September update'

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
  it('migrates and restores one canonical draft after saving and remounting', async () => {
    await page.viewport(1440, 900)
    localStorage.removeItem(DOCUMENT_STORAGE_KEY)
    localStorage.removeItem(DOCUMENT_NAME_STORAGE_KEY)

    const schemaThreeDocument = {
      id: 'browser-test-document',
      schemaVersion: 3,
      documentType: 'letter',
      data: {
        content: [
          {
            type: 'HeadingBlock',
            props: { id: 'heading-1', text: originalHeading },
          },
        ],
        root: {},
      },
      layout: {
        mode: 'paged',
        pageSize: 'A4',
        margins: { top: 20, right: 20, bottom: 20, left: 20, unit: 'mm' },
      },
    }
    localStorage.setItem(DOCUMENT_STORAGE_KEY, JSON.stringify(schemaThreeDocument))
    localStorage.setItem(DOCUMENT_NAME_STORAGE_KEY, 'Original customer letter')

    mountApp()

    const heading = await puckHeading(originalHeading)
    await heading.hover()
    await expect.element(heading).toHaveAttribute('contenteditable', 'plaintext-only')
    await heading.fill(editedHeading)
    await userEvent.tab()

    const nameInput = page.getByRole('textbox', { name: 'Document name' })
    await userEvent.fill(nameInput, editedName)
    await userEvent.tab()

    const descriptionInput = page.getByRole('textbox', { name: 'Document description' })
    await userEvent.fill(descriptionInput, `  ${editedDescription}  `)
    await userEvent.keyboard('{Enter}')
    await expect.element(page.getByText(editedDescription, { exact: true })).toBeVisible()

    await userEvent.click(page.getByText(editedDescription, { exact: true }))
    await userEvent.fill(page.getByRole('textbox', { name: 'Document description' }), 'Discarded')
    await userEvent.keyboard('{Escape}')
    await expect.element(page.getByText(editedDescription, { exact: true })).toBeVisible()

    await userEvent.click(page.getByRole('button', { name: 'Fluid' }))
    await expect.element(page.getByRole('button', { name: 'Fluid' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await puckHeading(editedHeading)
    await page.getByText('Save draft', { exact: true }).click()

    await expect.poll(() => loadDocument().layout.mode).toBe('fluid')
    const savedDocument = JSON.parse(
      localStorage.getItem(DOCUMENT_STORAGE_KEY)!,
    ) as LetterDocument
    expect(savedDocument).toMatchObject({
      id: 'browser-test-document',
      schemaVersion: DOCUMENT_SCHEMA_VERSION,
      documentType: 'letter',
      name: editedName,
      description: editedDescription,
      status: 'draft',
      layout: { mode: 'fluid' },
    })
    expect(savedDocument.data.content[0]).toMatchObject({
      type: 'HeadingBlock',
      props: { id: 'heading-1', text: editedHeading },
    })
    expect(savedDocument.createdAt).toMatch(/Z$/)
    expect(savedDocument.updatedAt).toMatch(/Z$/)
    expect(Date.parse(savedDocument.updatedAt)).toBeGreaterThan(Date.parse(savedDocument.createdAt))
    expect(localStorage.getItem(DOCUMENT_NAME_STORAGE_KEY)).toBe('Original customer letter')

    unmountApp()
    mountApp()

    await expect.element(page.getByRole('textbox', { name: 'Document name' })).toHaveValue(
      editedName,
    )
    await expect.element(page.getByText(editedDescription, { exact: true })).toBeVisible()
    await expect.element(page.getByLabelText('Document status: draft')).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Fluid' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await puckHeading(editedHeading)
    expect(loadDocument()).toEqual(savedDocument)
  })
})
