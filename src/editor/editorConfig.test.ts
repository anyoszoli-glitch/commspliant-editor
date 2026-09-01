import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'
import { defaultFluidLayout, defaultPagedLayout } from '../document/document'
import { createEditorConfig } from './editorConfig'

function renderRoot(isEditing: boolean, previewEnabled = false, showMarginGuides = true) {
  const root = createEditorConfig(
    defaultPagedLayout,
    undefined,
    [],
    previewEnabled,
    {},
    undefined,
    'page-root',
    undefined,
    undefined,
    undefined,
    showMarginGuides,
  ).root
  if (!root?.render) throw new Error('Expected root renderer')

  return renderToStaticMarkup(
    root.render({ children: null, puck: { isEditing } } as never) as ReactElement,
  )
}

describe('editor config', () => {
  it('keeps heading and text blocks editable and available to Puck', () => {
    const config = createEditorConfig(defaultPagedLayout)

    expect(config.components.HeadingBlock.fields?.text).toMatchObject({
      type: 'richtext',
      contentEditable: true,
      options: {
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      },
    })
    expect(config.components.HeadingBlock.defaultProps).toEqual({
      text: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'New heading' }],
          },
        ],
      },
    })
    expect(config.components.TextBlock.fields?.text).toMatchObject({
      type: 'richtext',
      contentEditable: true,
      options: {
        blockquote: false,
        code: false,
        codeBlock: false,
        heading: { levels: [2, 3] },
        horizontalRule: false,
        strike: {},
        textAlign: {},
      },
    })

    const headingField = config.components.HeadingBlock.fields?.text
    const textField = config.components.TextBlock.fields?.text
    if (headingField?.type !== 'richtext' || textField?.type !== 'richtext') {
      throw new Error('Expected rich-text fields')
    }

    const menuProps = { children: null, editor: null, editorState: null, readOnly: false }
    const headingMenu = headingField.renderMenu?.(menuProps) as ReactElement<{
      formatWholeBlockOnEmptySelection?: boolean
    }>
    const textMenu = textField.renderMenu?.(menuProps) as ReactElement<{
      formatWholeBlockOnEmptySelection?: boolean
    }>
    expect(headingMenu.props.formatWholeBlockOnEmptySelection).toBe(true)
    expect(textMenu.props.formatWholeBlockOnEmptySelection).toBe(false)

    expect(config.components.PageBreakBlock.label).toBe('Page break')
    expect(config.components.TableBlock.label).toBe('Table')
    expect(config.components.ImageBlock.label).toBe('Image')
    expect(config.components.DividerBlock.label).toBe('Divider')
    expect(config.components.SpacerBlock.label).toBe('Spacer')
  })

  it('registers an Important notice with the constrained rich-text body editor', () => {
    const config = createEditorConfig(defaultPagedLayout)
    const notice = config.components.NoticeBlock

    expect(notice.label).toBe('Important notice')
    expect(notice.defaultProps).toEqual({
      heading: 'Important notice',
      text: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Add important information here.' }],
          },
        ],
      },
    })
    expect(JSON.parse(JSON.stringify(notice.defaultProps))).toEqual(notice.defaultProps)
    expect(notice.fields?.heading).toMatchObject({ type: 'text', contentEditable: true })
    expect(notice.fields?.text).toMatchObject(config.components.TextBlock.fields?.text ?? {})
  })

  it('keeps the page break component available in fluid mode', () => {
    const config = createEditorConfig(defaultFluidLayout)

    expect(config.components.PageBreakBlock).toBeDefined()
    expect(config.components.TableBlock).toBeDefined()
    expect(config.components.DividerBlock).toBeDefined()
    expect(config.components.SpacerBlock).toBeDefined()
  })

  it('uses serializable defaults for the new document blocks', () => {
    const config = createEditorConfig(defaultPagedLayout)

    expect(config.components.TableBlock.defaultProps).toEqual({
      table: {
        headerRow: true,
        alignment: 'left',
        rows: [
          { cells: ['Column 1', 'Column 2', 'Column 3'] },
          { cells: ['', '', ''] },
          { cells: ['', '', ''] },
        ],
      },
    })
    expect(config.components.DividerBlock.defaultProps).toEqual({})
    expect(config.components.SpacerBlock.defaultProps).toEqual({ size: 'medium' })
    expect(config.components.ImageBlock.defaultProps).toEqual({
      image: { alt: '', title: '', width: 100, alignment: 'center', horizontalOffset: 0 },
    })
    expect(JSON.parse(JSON.stringify(config.components.TableBlock.defaultProps)))
      .toEqual(config.components.TableBlock.defaultProps)
  })

  it('renders page indicators only outside Preview output', () => {
    expect(renderRoot(true)).toContain('data-editor-page-indicator')
    expect(renderRoot(true, true)).not.toContain('data-editor-page-indicator')
    expect(renderRoot(false)).toContain('data-editor-page-indicator')
  })

  it('renders margin guides only on the selected editor page when enabled', () => {
    expect(renderRoot(true)).toContain('data-editor-margin-guide="true"')
    expect(renderRoot(true, false, false)).not.toContain('data-editor-margin-guide="true"')
    expect(renderRoot(true, true)).not.toContain('data-editor-margin-guide="true"')
  })
})
