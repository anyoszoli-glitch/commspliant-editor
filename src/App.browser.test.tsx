import { useState } from 'react'
import { page, userEvent } from 'vitest/browser'
import { flushSync } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'
import { CommsPliantEditor } from './CommsPliantEditor'
import {
  createDocument,
  DOCUMENT_SCHEMA_VERSION,
  type LetterDocument,
} from './document/document'
import {
  DOCUMENT_NAME_STORAGE_KEY,
  DOCUMENT_STORAGE_KEY,
  loadDocument,
} from './document/documentStorage'
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

function EmbeddedEditorHarness({
  initialDocument,
  changes,
  saves,
  previewValues,
}: {
  initialDocument: LetterDocument
  changes: LetterDocument[]
  saves: LetterDocument[]
  previewValues?: Record<string, string>
}) {
  const [document, setDocument] = useState(initialDocument)

  return (
    <CommsPliantEditor
      document={document}
      onChange={(updatedDocument) => {
        changes.push(updatedDocument)
        setDocument(updatedDocument)
      }}
      onSave={(updatedDocument) => saves.push(updatedDocument)}
      previewValues={previewValues}
    />
  )
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
  it('exposes a controlled editor boundary without the host identity header', async () => {
    const changes: LetterDocument[] = []
    const saves: LetterDocument[] = []
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    root.render(
      <EmbeddedEditorHarness
        initialDocument={createDocument('embedded-editor-document')}
        changes={changes}
        saves={saves}
      />,
    )

    await expect.element(page.getByText('Save draft', { exact: true })).toBeVisible()
    expect(container.querySelector('.document-editor__topbar')).toBeNull()
    await expect.element(page.getByRole('textbox', { name: 'Document name' })).not.toBeInTheDocument()

    await userEvent.click(page.getByRole('radio', { name: 'Fluid' }))
    await expect.poll(() => changes.at(-1)?.layout.mode).toBe('fluid')

    await userEvent.click(page.getByText('Save draft', { exact: true }))
    await expect.poll(() => saves.length).toBe(1)
    expect(saves[0].layout.mode).toBe('fluid')
    expect(saves[0]).toEqual(changes.at(-1))
  })

  it('keeps the embedded background opacity slider mounted across continuous updates', async () => {
    const changes: LetterDocument[] = []
    const editorDocument = createDocument('embedded-background-document')
    editorDocument.backgroundImage = {
      src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/%3E',
      opacity: 0.2,
    }

    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    root.render(
      <EmbeddedEditorHarness
        initialDocument={editorDocument}
        changes={changes}
        saves={[]}
      />,
    )

    await puckContent()
    await userEvent.click(page.getByRole('button', { name: 'Background settings' }))

    const range = document.querySelector<HTMLInputElement>(
      "input[aria-label='Background image opacity']",
    )!
    const nativeValueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!

    for (const value of ['30', '45', '60', '75']) {
      nativeValueSetter.call(range, value)
      range.dispatchEvent(new Event('input', { bubbles: true }))
      await expect.poll(() => changes.at(-1)?.backgroundImage?.opacity).toBe(Number(value) / 100)
      expect(document.querySelector("input[aria-label='Background image opacity']")).toBe(range)
    }

    await userEvent.click(page.getByRole('button', { name: 'Light blue' }))
    await expect.poll(() => changes.at(-1)?.backgroundColour).toBe('#eaf0f4')
  })

  it('renders dynamic page numbering in Author and Preview and exposes shared custom colour inputs', async () => {
    const changes: LetterDocument[] = []
    const editorDocument = createDocument('embedded-numbered-document')
    if (editorDocument.layout.mode !== 'paged') throw new Error('Expected paged document')
    editorDocument.layout.pageNumbering = 'page-number-of-total'
    editorDocument.data.content = [
      { type: 'TextBlock', props: { id: 'first', text: '<p>First page</p>' } },
      { type: 'PageBreakBlock', props: { id: 'break-one' } },
      { type: 'TextBlock', props: { id: 'second', text: '<p>Second page</p>' } },
      { type: 'PageBreakBlock', props: { id: 'break-two' } },
      { type: 'TextBlock', props: { id: 'third', text: '<p>Third page</p>' } },
    ]

    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    root.render(
      <EmbeddedEditorHarness
        initialDocument={editorDocument}
        changes={changes}
        saves={[]}
        previewValues={{}}
      />,
    )

    await puckText('First page')

    const pageNumberTexts = () => {
      const frame = document.querySelector<HTMLIFrameElement>('#preview-frame')
      return [...(frame?.contentDocument?.querySelectorAll('[data-document-page-number]') ?? [])]
        .map((element) => element.textContent)
    }

    await expect.poll(pageNumberTexts).toEqual(['Page 1 of 3', 'Page 2 of 3', 'Page 3 of 3'])

    await userEvent.click(page.getByRole('button', { name: 'Page setup' }))
    await userEvent.selectOptions(
      page.getByRole('combobox', { name: 'Page numbering' }),
      'number-of-total',
    )
    await expect.poll(() => changes.at(-1)?.layout).toMatchObject({
      mode: 'paged',
      pageNumbering: 'number-of-total',
    })
    await expect.poll(pageNumberTexts).toEqual(['1 / 3', '2 / 3', '3 / 3'])

    const firstPageText = await puckText('First page')
    await firstPageText.hover()
    await firstPageText.click()
    expect(document.querySelectorAll("input[aria-label='Custom text colour']").length).toBeGreaterThan(0)
    expect(document.querySelectorAll("input[aria-label='Custom text highlight']").length).toBeGreaterThan(0)

    await userEvent.click(page.getByRole('button', { name: 'Preview' }))
    await expect.poll(pageNumberTexts).toEqual(['1 / 3', '2 / 3', '3 / 3'])
  })

  it('gives paged and fluid documents compact frames without changing document geometry', async () => {
    await page.viewport(1440, 900)
    localStorage.removeItem('puck-sidebar-widths')
    mountApp()

    await puckContent()

    let canvasRoot = document.querySelector<HTMLElement>('#puck-canvas-root')!
    let canvas = canvasRoot.parentElement?.parentElement as HTMLElement
    const leftSidebar = document.querySelector<HTMLElement>("[class*='_Sidebar--left_']")!
    const rightSidebar = document.querySelector<HTMLElement>("[class*='_Sidebar--right_']")!

    await expect.poll(() => canvasRoot.style.width).toBe('818px')
    expect(getComputedStyle(canvas).paddingLeft).toBe('6px')
    expect(getComputedStyle(canvas).paddingTop).toBe('5px')
    expect(leftSidebar.getBoundingClientRect().width).toBe(146)
    expect(rightSidebar.getBoundingClientRect().width).toBe(318)

    let frame = document.querySelector<HTMLIFrameElement>('#preview-frame')!
    await expect
      .poll(() => frame.contentDocument?.querySelector('[data-document-page]') !== null)
      .toBe(true)
    const documentPage = frame.contentDocument?.querySelector<HTMLElement>('[data-document-page]')
    const documentContent = frame.contentDocument?.querySelector<HTMLElement>('[data-document-content]')

    expect(documentPage).not.toBeNull()
    expect(documentContent).not.toBeNull()

    expect(documentPage!.style.width).toBe('210mm')
    expect(documentContent!.style.left).toBe('20mm')
    expect(documentContent!.style.width).toBe('170mm')

    await userEvent.click(page.getByRole('radio', { name: 'Fluid' }))
    await puckContent()

    canvasRoot = document.querySelector<HTMLElement>('#puck-canvas-root')!
    canvas = canvasRoot.parentElement?.parentElement as HTMLElement
    frame = document.querySelector<HTMLIFrameElement>('#preview-frame')!
    const fluidContent = frame.contentDocument?.querySelector<HTMLElement>('[data-document-content]')

    await expect.poll(() => canvasRoot.style.width).toBe('704px')
    expect(getComputedStyle(canvas).paddingLeft).toBe('6px')
    expect(fluidContent?.style.width).toBe('min(680px, 100% - 24px)')
    expect(fluidContent?.style.minHeight).toBe('calc(-24px + 100vh)')
    expect(fluidContent?.style.padding).toBe('32px')

    await page.viewport(480, 900)
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    expect(canvasRoot.getBoundingClientRect().width).toBeLessThanOrEqual(
      canvasRoot.parentElement!.getBoundingClientRect().width + 1,
    )
  })

  it('keeps editor page indicators out of Preview output', async () => {
    await page.viewport(1440, 900)
    mountApp()
    await puckContent()

    let frame = document.querySelector<HTMLIFrameElement>('#preview-frame')!
    await expect
      .poll(() => frame.contentDocument?.querySelector('[data-editor-page-indicator]') !== null)
      .toBe(true)

    await userEvent.click(page.getByRole('button', { name: 'Preview' }))
    await puckContent()

    frame = document.querySelector<HTMLIFrameElement>('#preview-frame')!
    await expect
      .poll(() => frame.contentDocument?.querySelector('[data-document-content]') !== null)
      .toBe(true)
    expect(frame.contentDocument?.querySelector('[data-editor-page-indicator]')).toBeNull()
  })

  it('switches the right sidebar between Properties and the AI Assistant shell', async () => {
    await page.viewport(1440, 900)
    mountApp()
    await puckContent()

    const rightSidebar = document.querySelector<HTMLElement>("[class*='_Sidebar--right_']")!
    expect(rightSidebar.getBoundingClientRect().width).toBe(318)
    await expect.element(page.getByRole('tab', { name: 'Properties' })).toHaveAttribute('aria-selected', 'true')
    await expect.element(page.getByRole('heading', { name: 'Page' })).toBeVisible()

    await userEvent.click(page.getByRole('tab', { name: '✨ AI Assistant' }))
    await expect.element(page.getByRole('tab', { name: '✨ AI Assistant' })).toHaveAttribute('aria-selected', 'true')
    await expect.element(page.getByRole('region', { name: 'AI Assistant' })).toBeVisible()
    await expect.element(page.getByRole('tab', { name: 'Selection' })).toHaveAttribute('aria-selected', 'false')

    await userEvent.click(page.getByRole('tab', { name: 'Block' }))
    await expect.element(page.getByRole('tab', { name: 'Block' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(page.getByRole('tab', { name: 'Document' }))
    await expect.element(page.getByRole('tab', { name: 'Document' })).toHaveAttribute('aria-selected', 'true')

    await userEvent.click(page.getByRole('tab', { name: 'Properties' }))
    await expect.element(page.getByRole('heading', { name: 'Page' })).toBeVisible()
    await expect.element(page.getByRole('region', { name: 'AI Assistant' })).not.toBeInTheDocument()
  })

  it('keeps the editor header controls visible across responsive widths', async () => {
    mountApp()

    const controlLabels = [
      'Undo',
      'Redo',
      'Author',
      'Preview',
      'Paged / A4',
      'Fluid',
      'Page setup',
      'Background settings',
      'Save draft',
    ]

    const controlWithLabel = (label: string) =>
      Array.from(document.querySelectorAll<HTMLElement>('button, [class*="_Button_"]')).find(
        (control) => {
          const normalizedLabel = label.toLowerCase()

          return (
            control.getAttribute('aria-label')?.toLowerCase() === normalizedLabel ||
            control.getAttribute('title')?.toLowerCase() === normalizedLabel ||
            control.textContent?.replace(/\s+/g, ' ').trim().toLowerCase() === normalizedLabel
          )
        },
      )

    await expect.element(page.getByText('Save draft', { exact: true })).toBeVisible()

    const saveDraft = controlWithLabel('Save draft')!
    const saveDraftSize = saveDraft.getBoundingClientRect()
    const undo = controlWithLabel('Undo')!
    const author = controlWithLabel('Author')!
    const paged = controlWithLabel('Paged / A4')!
    const blockTile = document.querySelector<HTMLElement>('.commspliant-block-tile')!

    expect(saveDraftSize.height).toBe(18)
    expect(undo.getBoundingClientRect().height).toBe(16)
    expect(author.getBoundingClientRect().height).toBe(16)
    expect(paged.getBoundingClientRect().height).toBe(16)
    expect(blockTile.getBoundingClientRect().width).toBe(56)
    expect(blockTile.getBoundingClientRect().height).toBe(48)

    for (const width of [1440, 1100, 760, 480, 320]) {
      await page.viewport(width, 900)
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

      for (const label of controlLabels) {
        const control = controlWithLabel(label)
        expect(control, `${label} should exist at ${width}px`).toBeDefined()

        const rect = control!.getBoundingClientRect()
        expect(rect.width, `${label} should be visible at ${width}px`).toBeGreaterThan(0)
        expect(rect.height, `${label} should be visible at ${width}px`).toBeGreaterThan(0)
        expect(rect.left, `${label} should not overflow left at ${width}px`).toBeGreaterThanOrEqual(0)
        expect(rect.right, `${label} should not overflow right at ${width}px`).toBeLessThanOrEqual(
          width,
        )
      }

      expect(controlWithLabel('Page setup')!.getBoundingClientRect().top).toBe(
        controlWithLabel('Background settings')!.getBoundingClientRect().top,
      )
    }

    expect(controlWithLabel('Undo')).toBeDisabled()
    expect(controlWithLabel('Redo')).toBeDisabled()
  })

  it('uses a keyboard-navigable segmented control for document layout', async () => {
    mountApp()

    await expect.element(page.getByRole('radiogroup', { name: 'Layout:' })).toBeVisible()
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

  it('opens layout settings as an anchored popover without moving the editor', async () => {
    mountApp()

    await expect.element(page.getByRole('button', { name: 'Page setup' })).toBeVisible()
    const layoutButton = document.querySelector<HTMLButtonElement>('.document-editor__layout-settings-toggle')!
    const header = layoutButton.closest<HTMLElement>('[class*="_PuckHeader_"]')!

    for (const width of [1440, 320]) {
      await page.viewport(width, 900)
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

      const headerHeight = header.getBoundingClientRect().height
      const buttonRect = layoutButton.getBoundingClientRect()
      await userEvent.click(page.getByRole('button', { name: 'Page setup' }))

      const panel = document.querySelector<HTMLElement>('#layout-settings-panel')!
      const panelRect = panel.getBoundingClientRect()
      expect(panel.style.position).toBe('fixed')
      expect(panelRect.top).toBeGreaterThanOrEqual(buttonRect.bottom + 8)
      expect(panelRect.left).toBeGreaterThanOrEqual(8)
      expect(panelRect.right).toBeLessThanOrEqual(width - 8)
      expect(header.getBoundingClientRect().height).toBe(headerHeight)

      await userEvent.click(page.getByRole('button', { name: 'Page setup' }))
      expect(document.querySelector('#layout-settings-panel')).toBeNull()
    }

    await userEvent.click(page.getByRole('button', { name: 'Page setup' }))
    await userEvent.keyboard('{Escape}')
    expect(document.querySelector('#layout-settings-panel')).toBeNull()
    expect(document.activeElement).toBe(layoutButton)

    await userEvent.click(page.getByRole('button', { name: 'Page setup' }))
    await userEvent.click(page.getByText('CommsPliant document editor', { exact: true }))
    expect(document.querySelector('#layout-settings-panel')).toBeNull()
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
    expect(
      sanitizeRichTextHtml(
        '<p style="line-height: 1.5; text-align: center; position: fixed"><span style="font-family: Georgia; color: #1d4ed8; background-color: #fff3bf">Formatted</span></p>',
      ),
    ).toBe(
      '<p style="line-height: 1.5; text-align: center"><span style="font-family: Georgia; color: #1d4ed8; background-color: #fff3bf">Formatted</span></p>',
    )
    expect(
      sanitizeRichTextHtml('<span style="font-family: fantasy; color: red; position: fixed">Unsafe style</span>'),
    ).toBe('<span>Unsafe style</span>')
    expect(
      sanitizeRichTextHtml(
        '<p><span style="color: rgb(47, 107, 87); background-color: rgb(246, 207, 226)">Custom colours</span></p>',
      ),
    ).toBe(
      '<p><span style="color: rgb(47, 107, 87); background-color: rgb(246, 207, 226)">Custom colours</span></p>',
    )
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
          <CommsPliantEditor
            document={previewDocument}
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

    await userEvent.click(page.getByRole('button', { name: 'Page setup' }))
    const topMargin = page.getByRole('spinbutton', { name: 'Top margin' })
    await userEvent.fill(topMargin, '9')
    await userEvent.tab()
    await expect.element(page.getByText('Enter a whole number from 10 to 40.')).toBeVisible()
    await userEvent.click(page.getByRole('button', { name: 'Page setup' }))
    await userEvent.click(page.getByRole('button', { name: 'Page setup' }))
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

    await userEvent.click(page.getByRole('button', { name: 'Page setup' }))
    const contentWidth = page.getByRole('spinbutton', { name: 'Content width' })
    await userEvent.fill(contentWidth, '760')
    await userEvent.tab()
    await expect.element(await puckContent()).toHaveStyle({ width: 'min(760px, calc(100% - 24px))' })

    await userEvent.click(page.getByRole('radio', { name: 'Paged / A4' }))
    await userEvent.click(page.getByRole('button', { name: 'Page setup' }))
    await expect.element(page.getByRole('spinbutton', { name: 'Top margin' })).toHaveValue(24)

    await userEvent.click(page.getByRole('radio', { name: 'Fluid' }))
    await userEvent.click(page.getByRole('button', { name: 'Page setup' }))
    await expect.element(page.getByRole('spinbutton', { name: 'Content width' })).toHaveValue(760)

    await puckHeading(editedHeading)
    await userEvent.click(page.getByRole('button', { name: 'Preview' }))
    await expect.element(page.getByRole('button', { name: 'Preview' })).toHaveAttribute('aria-pressed', 'true')
    await puckText('Andrea')
    await puckText('[Missing: Missing value]')
    await puckText('[Empty: Empty value]')
    await puckText('<img src=x onerror=alert(1)>')
    await puckText('[Unknown variable: oldVariable]')
    await expect.element(page.getByRole('textbox', { name: 'Document name' })).toHaveValue(editedName)
    await expect.element(page.getByRole('button', { name: 'Page setup' })).toBeDisabled()
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
    await userEvent.click(page.getByRole('button', { name: 'Page setup' }))
    await expect.element(page.getByRole('spinbutton', { name: 'Content width' })).toHaveValue(760)
    await puckHeading(editedHeading)
    await puckHeading(editedNoticeHeading)
    await puckText(editedNoticeBody)
    await (await puckVariable('Customer name')).hover()
    await puckText('{{customerName}}')
    expect(loadDocument()).toEqual(savedDocument)
  })
})
