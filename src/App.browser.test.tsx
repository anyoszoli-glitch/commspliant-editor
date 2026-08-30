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
const originalNoticeHeading = 'Original important notice'
const editedNoticeHeading = 'Updated important notice'
const originalNoticeBody = 'Read this important information.'
const editedNoticeBody = 'Please review this updated important information.'
const noticeText = {
  type: 'doc' as const,
  content: [
    {
      type: 'paragraph' as const,
      content: [{ type: 'text' as const, text: originalNoticeBody }],
    },
  ],
}

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

async function puckContent() {
  let frame: HTMLIFrameElement | undefined

  await expect.poll(() => {
    frame = document.querySelector<HTMLIFrameElement>('#preview-frame') ?? undefined
    return frame?.contentDocument?.readyState
  }).toBe('complete')

  return page.frameLocator(page.elementLocator(frame!)).getByLabelText('Document content')
}

async function puckText(text: string) {
  let frame: HTMLIFrameElement | undefined

  await expect.poll(() => {
    frame = document.querySelector<HTMLIFrameElement>('#preview-frame') ?? undefined
    return frame?.contentDocument?.readyState
  }).toBe('complete')

  return page.frameLocator(page.elementLocator(frame!)).getByText(text, { exact: true })
}

afterEach(() => {
  unmountApp()
  localStorage.removeItem(DOCUMENT_STORAGE_KEY)
  localStorage.removeItem(DOCUMENT_NAME_STORAGE_KEY)
})

describe('App persistence', () => {
  it('saves and restores one canonical draft after editing content, metadata, and layout', async () => {
    await page.viewport(1440, 900)
    localStorage.removeItem(DOCUMENT_STORAGE_KEY)
    localStorage.removeItem(DOCUMENT_NAME_STORAGE_KEY)

    const schemaFourDocument = {
      id: 'browser-test-document',
      schemaVersion: DOCUMENT_SCHEMA_VERSION,
      documentType: 'letter',
      name: 'Original customer letter',
      description: '',
      status: 'draft',
      createdAt: '2026-08-30T09:00:00.000Z',
      updatedAt: '2026-08-30T09:00:00.000Z',
      data: {
        content: [
          {
            type: 'HeadingBlock',
            props: { id: 'heading-1', text: originalHeading },
          },
          {
            type: 'NoticeBlock',
            props: { id: 'notice-1', heading: originalNoticeHeading, text: noticeText },
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
    localStorage.setItem(DOCUMENT_STORAGE_KEY, JSON.stringify(schemaFourDocument))

    mountApp()

    const heading = await puckHeading(originalHeading)
    await heading.hover()
    await expect.element(heading).toHaveAttribute('contenteditable', 'plaintext-only')
    await heading.fill(editedHeading)
    await userEvent.tab()

    const noticeHeading = await puckHeading(originalNoticeHeading)
    await noticeHeading.hover()
    await expect.element(noticeHeading).toHaveAttribute('contenteditable', 'plaintext-only')
    await noticeHeading.fill(editedNoticeHeading)
    await userEvent.tab()

    const noticeBody = await puckText(originalNoticeBody)
    await noticeBody.hover()
    await noticeBody.fill(editedNoticeBody)
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

    await userEvent.click(page.getByRole('button', { name: 'Layout settings' }))
    const topMargin = page.getByRole('spinbutton', { name: 'Top margin' })
    await userEvent.fill(topMargin, '9')
    await userEvent.tab()
    await expect.element(page.getByText('Enter a whole number from 10 to 40.')).toBeVisible()
    await userEvent.click(page.getByRole('button', { name: 'Layout settings' }))
    await userEvent.click(page.getByRole('button', { name: 'Layout settings' }))
    await expect.element(page.getByRole('spinbutton', { name: 'Top margin' })).toHaveValue(20)
    await expect.element(page.getByText('Enter a whole number from 10 to 40.')).not.toBeInTheDocument()

    const reopenedTopMargin = page.getByRole('spinbutton', { name: 'Top margin' })
    await userEvent.fill(reopenedTopMargin, '24')
    await userEvent.tab()
    await expect.element(await puckContent()).toHaveStyle({ top: '24mm' })

    await userEvent.click(page.getByRole('button', { name: 'Fluid' }))
    await expect.element(page.getByRole('button', { name: 'Fluid' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await userEvent.click(page.getByRole('button', { name: 'Layout settings' }))
    const contentWidth = page.getByRole('spinbutton', { name: 'Content width' })
    await userEvent.fill(contentWidth, '760')
    await userEvent.tab()
    await expect.element(await puckContent()).toHaveStyle({ width: 'min(760px, calc(100% - 48px))' })

    await userEvent.click(page.getByRole('button', { name: 'Paged / A4' }))
    await userEvent.click(page.getByRole('button', { name: 'Layout settings' }))
    await expect.element(page.getByRole('spinbutton', { name: 'Top margin' })).toHaveValue(24)

    await userEvent.click(page.getByRole('button', { name: 'Fluid' }))
    await userEvent.click(page.getByRole('button', { name: 'Layout settings' }))
    await expect.element(page.getByRole('spinbutton', { name: 'Content width' })).toHaveValue(760)

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
      layout: { mode: 'fluid', maxWidth: { value: 760, unit: 'px' } },
    })
    expect(savedDocument.data.content[0]).toMatchObject({
      type: 'HeadingBlock',
      props: { id: 'heading-1', text: editedHeading },
    })
    expect(savedDocument.data.content[1]).toMatchObject({
      type: 'NoticeBlock',
      props: {
        id: 'notice-1',
        heading: editedNoticeHeading,
        text: `<p>${editedNoticeBody}</p>`,
      },
    })
    expect(savedDocument.createdAt).toMatch(/Z$/)
    expect(savedDocument.updatedAt).toMatch(/Z$/)
    expect(Date.parse(savedDocument.updatedAt)).toBeGreaterThan(Date.parse(savedDocument.createdAt))
    expect(savedDocument.layout.mode).toBe('fluid')

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
    await userEvent.click(page.getByRole('button', { name: 'Layout settings' }))
    await expect.element(page.getByRole('spinbutton', { name: 'Content width' })).toHaveValue(760)
    await puckHeading(editedHeading)
    await puckHeading(editedNoticeHeading)
    await puckText(editedNoticeBody)
    expect(loadDocument()).toEqual(savedDocument)
  })
})
