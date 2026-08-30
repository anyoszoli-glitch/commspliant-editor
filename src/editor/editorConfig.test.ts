import { describe, expect, it } from 'vitest'
import { defaultFluidLayout, defaultPagedLayout } from '../document/document'
import { createEditorConfig } from './editorConfig'

describe('editor config', () => {
  it('keeps heading and text blocks editable and available to Puck', () => {
    const config = createEditorConfig(defaultPagedLayout)

    expect(config.components.HeadingBlock.fields?.text).toMatchObject({
      type: 'text',
      contentEditable: true,
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
        strike: false,
        textAlign: false,
      },
    })
    expect(config.components.PageBreakBlock.label).toBe('Page break')
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
  })
})
