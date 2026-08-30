import type { Config } from '@puckeditor/core'
import { DocumentCanvas } from '../components/DocumentCanvas/DocumentCanvas'
import { LayoutBlock } from '../components/DocumentCanvas/LayoutBlock'
import { HeadingBlock } from '../components/HeadingBlock/HeadingBlock'
import { TextBlock } from '../components/TextBlock/TextBlock'
import type { DocumentLayout, EditorComponents } from '../document/document'

export function createEditorConfig(layout: DocumentLayout): Config<EditorComponents> {
  return {
    root: {
      render: ({ children }) => (
        <DocumentCanvas layout={layout}>
          {children}
        </DocumentCanvas>
      ),
    },
    components: {
      HeadingBlock: {
        fields: { text: { type: 'text', contentEditable: true } },
        defaultProps: { text: 'New heading' },
        render: ({ id, text }) => (
          <LayoutBlock id={id}>
            <HeadingBlock text={text} />
          </LayoutBlock>
        ),
      },
      TextBlock: {
        fields: { text: { type: 'textarea', contentEditable: true } },
        defaultProps: { text: 'Write your text here.' },
        render: ({ id, text }) => (
          <LayoutBlock id={id}>
            <TextBlock text={text} />
          </LayoutBlock>
        ),
      },
    },
  }
}
