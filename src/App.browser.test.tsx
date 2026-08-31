import { page, userEvent } from 'vitest/browser'
import { flushSync } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'
import { DocumentEditor } from './components/DocumentEditor/DocumentEditor'
import {
  createDocument,
  DOCUMENT_SCHEMA_VERSION,
  DOCUMENT_STORAGE_KEY,
  type LetterDocument,
} from './document/document'
import { DOCUMENT_NAME_STORAGE_KEY, loadDocument } from './document/documentStorage'
import { sanitizeRichTextHtml } from './document/richTextSanitizer'

const originalHeading = 'Original customer heading'
const editedHeading = 'Updated customer heading'
const editedName = 'Updated customer letter'
const editedDescription = 'Customer notice for the September update'
const originalNoticeHeading = 'Original important notice'
const editedNoticeHeading = 'Updated important notice'
const originalNoticeBody = 'Read this important information.'
const editedNoticeBody = 'Please review this updated important information.'
const greetingText = 'Dear '
const noticeText = {
  type: 'doc' as const,
  content: [
    {
      type: 'paragraph' as const,
      content: [{ type: 'text' as const, text: originalNoticeBody }],
    },
  ],
}
const previewVariablesText =
  '<p><span data-commspliant-variable="missingValue">{{missingValue}}</span> <span data-commspliant-variable="emptyValue">{{emptyValue}}</span> <span data-commspliant-variable="htmlValue">{{htmlValue}}</span> <span data-commspliant-variable="oldVariable">{{oldVariable}}</span></p>'

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

async function puckVariable(label: string) {
  let frame: HTMLIFrameElement | undefined

  await expect.poll(() => {
    frame = document.querySelector<HTMLIFrameElement>('#preview-frame') ?? undefined
    return frame?.contentDocument?.readyState
  }).toBe('complete')

  return page.frameLocator(page.elementLocator(frame!)).getByRole('img', { name: `Variable: ${label}` }).first()
}

afterEach(() => {
  unmountApp()
  localStorage.removeItem(DOCUMENT_STORAGE_KEY)
  localStorage.removeItem(DOCUMENT_NAME_STORAGE_KEY)
})

describe('App persistence', () => {
  it('uses a keyboard-navigable segmented control for document layout', async () => {
    mountApp()

    await expect.element(page.getByRole('radiogroup', { name: 'Document layout:' })).toBeVisible()
    const paged = page.getByRole('radio', { name: 'Paged / A4' })
    const fluid = page.getByRole('radio', { name: 'Fluid' })

    await expect.element(paged).toHaveAttribute('aria-checked', 'true')
    await expect.element(fluid).toHaveAttribute('aria-checked', 'false')

    await userEvent.click(paged)
    await userEvent.keyboard('{ArrowRight}')
    await expect.element(fluid).toHaveAttribute('aria-checked', 'true')
    await expect.element(paged).toHaveAttribute('aria-checked', 'false')

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    await userEvent.keyboard('{ArrowLeft}')
    await expect.element(paged).toHaveAttribute('aria-checked', 'true')
  })

  it('sanitizes rich-text HTML while preserving variable spans and literal braces', () => {
    expect(sanitizeRichTextHtml('<p onclick="alert(1)">Hello<script>alert(1)</script></p>')).toBe(
      '<p>Hello</p>',
    )
    expect(sanitizeRichTextHtml('<img src=x onerror="alert(1)"><a href="javascript:alert(1)">click</a>')).toBe(
      '<a>click</a>',
    )
    expect(
      sanitizeRichTextHtml(
        '<span data-commspliant-variable="customerName" onclick="alert(1)" data-other="x">{{customerName}}</span>',
      ),
    ).toBe('<span data-commspliant-variable="customerName">{{customerName}}</span>')
    expect(sanitizeRichTextHtml('<p>{{customerName}}</p>')).toBe('<p>{{customerName}}</p>')
    expect(
      sanitizeRichTextHtml('<span data-commspliant-variable="oldVariable">{{oldVariable}}</span>'),
    ).toBe('<span data-commspliant-variable="oldVariable">{{oldVariable}}</span>')
  })

  it('sanitizes rich text returned from the real schema 3 migration path', () => {
    localStorage.setItem(
      DOCUMENT_STORAGE_KEY,
      JSON.stringify({
        id: 'legacy-unsafe-document',
        schemaVersion: 3,
        documentType: 'letter',
        data: {
          content: [
            {
              type: 'TextBlock',
              props: {
                id: 'legacy-text',
                text: '<p onclick="alert(1)">Hello<script>alert(2)</script></p><span data-commspliant-variable="customerName">{{customerName}}</span>',
              },
            },
          ],
          root: {},
        },
        layout: {
          mode: 'paged',
          pageSize: 'A4',
          margins: { top: 20, right: 20, bottom: 20, left: 20, unit: 'mm' },
        },
      }),
    )

    const migratedDocument = loadDocument()
    const textBlock = migratedDocument.data.content[0]
    if (textBlock.type !== 'TextBlock') throw new Error('Expected migrated text block')

    expect(migratedDocument.schemaVersion).toBe(DOCUMENT_SCHEMA_VERSION)
    expect(textBlock.props.text).toBe(
      '<p>Hello</p><span data-commspliant-variable="customerName">{{customerName}}</span>',
    )
  })

  it('shows preview only when values are supplied and keeps the projection out of onChange', async () => {
    await page.viewport(1440, 900)
    const previewDocument = {
      ...createDocument('preview-control-document'),
      data: {
        root: {},
        content: [
          {
            type: 'TextBlock' as const,
            props: {
              id: 'preview-control-text',
              text: '<p><span data-commspliant-variable="customerName">{{customerName}}</span></p>',
            },
          },
        ],
      },
    }
    let changeCount = 0
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    const renderEditor = (previewValues?: Readonly<Record<string, string>>) => {
      flushSync(() => {
        root?.render(
          <DocumentEditor
            value={previewDocument}
            variableDefinitions={[{ key: 'customerName', label: 'Customer name' }]}
            previewValues={previewValues}
            onChange={() => {
              changeCount += 1
            }}
            onSave={() => undefined}
          />,
        )
      })
    }

    renderEditor()
    await expect.element(page.getByRole('button', { name: 'Preview' })).not.toBeInTheDocument()
    await (await puckVariable('Customer name')).hover()

    renderEditor({ customerName: 'Andrea' })
    await expect.element(page.getByRole('button', { name: 'Author' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(page.getByRole('button', { name: 'Preview' }))
    await puckText('Andrea')
    expect(changeCount).toBe(0)

    await userEvent.click(page.getByRole('button', { name: 'Author' }))
    await (await puckVariable('Customer name')).hover()
    expect(changeCount).toBe(0)

    await userEvent.click(page.getByRole('button', { name: 'Preview' }))
    await puckText('Andrea')

    renderEditor(undefined)
    await expect.element(page.getByRole('button', { name: 'Preview' })).not.toBeInTheDocument()
    await (await puckVariable('Customer name')).hover()
    expect(changeCount).toBe(0)
  })

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
          {
            type: 'TextBlock',
            props: { id: 'greeting', text: `<p>${greetingText}</p>` },
          },
          {
            type: 'TextBlock',
            props: { id: 'literal-braces', text: '<p>{{customerName}}</p>' },
          },
          {
            type: 'NoticeBlock',
            props: {
              id: 'notice-preview',
              heading: 'Preview notice',
              text: '<p>For <span data-commspliant-variable="customerName">{{customerName}}</span>.</p>',
            },
          },
          {
            type: 'TextBlock',
            props: { id: 'preview-variables', text: previewVariablesText },
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

    await puckText('{{customerName}}')

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

    const greeting = await puckText('Dear')
    await greeting.hover()
    await greeting.click()
    await greeting.fill(greetingText)
    await userEvent.selectOptions(page.getByRole('combobox', { name: 'Insert variable' }), 'customerName')
    await (await puckVariable('Customer name')).hover()

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

    await userEvent.click(page.getByRole('radio', { name: 'Fluid' }))
    await expect.element(page.getByRole('radio', { name: 'Fluid' })).toHaveAttribute(
      'aria-checked',
      'true',
    )

    await userEvent.click(page.getByRole('button', { name: 'Layout settings' }))
    const contentWidth = page.getByRole('spinbutton', { name: 'Content width' })
    await userEvent.fill(contentWidth, '760')
    await userEvent.tab()
    await expect.element(await puckContent()).toHaveStyle({ width: 'min(760px, calc(100% - 48px))' })

    await userEvent.click(page.getByRole('radio', { name: 'Paged / A4' }))
    await userEvent.click(page.getByRole('button', { name: 'Layout settings' }))
    await expect.element(page.getByRole('spinbutton', { name: 'Top margin' })).toHaveValue(24)

    await userEvent.click(page.getByRole('radio', { name: 'Fluid' }))
    await userEvent.click(page.getByRole('button', { name: 'Layout settings' }))
    await expect.element(page.getByRole('spinbutton', { name: 'Content width' })).toHaveValue(760)

    await puckHeading(editedHeading)
    await userEvent.click(page.getByRole('button', { name: 'Preview' }))
    await expect.element(page.getByRole('button', { name: 'Preview' })).toHaveAttribute('aria-pressed', 'true')
    await puckText('Andrea')
    await puckText('[Missing: Missing value]')
    await puckText('[Empty: Empty value]')
    await puckText('<img src=x onerror=alert(1)>')
    await puckText('[Unknown variable: oldVariable]')
    await expect.element(page.getByRole('textbox', { name: 'Document name' })).not.toBeInTheDocument()
    await expect.element(page.getByRole('button', { name: 'Layout settings' })).toBeDisabled()
    await expect.element(page.getByRole('combobox', { name: 'Insert variable' })).not.toBeInTheDocument()

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
    expect(savedDocument.data.content[2]).toMatchObject({
      type: 'TextBlock',
      props: {
        id: 'greeting',
        text: '<p>Dear <span data-commspliant-variable="customerName">{{customerName}}</span></p>',
      },
    })
    expect(savedDocument.data.content[4]).toMatchObject({
      type: 'NoticeBlock',
      props: {
        id: 'notice-preview',
        text: '<p>For <span data-commspliant-variable="customerName">{{customerName}}</span>.</p>',
      },
    })
    expect(savedDocument.data.content[5]).toMatchObject({
      type: 'TextBlock',
      props: { id: 'preview-variables', text: previewVariablesText },
    })
    expect(JSON.stringify(savedDocument)).not.toContain('Andrea')
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
    await expect.element(page.getByRole('radio', { name: 'Fluid' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await userEvent.click(page.getByRole('button', { name: 'Layout settings' }))
    await expect.element(page.getByRole('spinbutton', { name: 'Content width' })).toHaveValue(760)
    await puckHeading(editedHeading)
    await puckHeading(editedNoticeHeading)
    await puckText(editedNoticeBody)
    await (await puckVariable('Customer name')).hover()
    await puckText('{{customerName}}')
    expect(loadDocument()).toEqual(savedDocument)
  })
})
