import { describe, expect, it } from 'vitest'
import { defaultPagedLayout } from '../document/document'
import { createEditorConfig } from './editorConfig'

describe('editor config', () => {
  it('keeps heading and text blocks editable and available to Puck', () => {
    const config = createEditorConfig(defaultPagedLayout)

    expect(config.components.HeadingBlock.fields?.text).toMatchObject({
      type: 'text',
      contentEditable: true,
    })
    expect(config.components.TextBlock.fields?.text).toMatchObject({
      type: 'textarea',
      contentEditable: true,
    })
  })
})
