import type { Config } from '@puckeditor/core'
import { DocumentCanvas } from '../components/DocumentCanvas/DocumentCanvas'
import { LayoutBlock } from '../components/DocumentCanvas/LayoutBlock'
import { HeadingBlock } from '../components/HeadingBlock/HeadingBlock'
import { TextBlock } from '../components/TextBlock/TextBlock'
import { PageBreakBlock } from '../components/PageBreakBlock/PageBreakBlock'
import { RichTextToolbar } from './RichTextToolbar'
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
        label: 'Heading',
        fields: { text: { type: 'text', contentEditable: true } },
        defaultProps: { text: 'New heading' },
        render: ({ id, text }) => (
          <LayoutBlock id={id}>
            <HeadingBlock text={text} />
          </LayoutBlock>
        ),
      },
      TextBlock: {
        label: 'Text',
        fields: {
          text: {
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
            renderMenu: (props) => <RichTextToolbar {...props} />,
            renderInlineMenu: (props) => <RichTextToolbar {...props} />,
          },
        },
        defaultProps: {
          text: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Write your text here.' }],
              },
            ],
          },
        },
        render: ({ id, text }) => (
          <LayoutBlock id={id}>
            <TextBlock text={text as React.ReactNode} />
          </LayoutBlock>
        ),
      },
      PageBreakBlock: {
        label: 'Page break',
        defaultProps: {},
        render: ({ id }) => (
          <LayoutBlock id={id} breakAfter>
            <PageBreakBlock />
          </LayoutBlock>
        ),
      },
    },
  }
}
