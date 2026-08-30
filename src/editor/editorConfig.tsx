import type { Config, RichtextField } from '@puckeditor/core'
import { DocumentCanvas } from '../components/DocumentCanvas/DocumentCanvas'
import { LayoutBlock } from '../components/DocumentCanvas/LayoutBlock'
import { HeadingBlock } from '../components/HeadingBlock/HeadingBlock'
import { TextBlock } from '../components/TextBlock/TextBlock'
import { PageBreakBlock } from '../components/PageBreakBlock/PageBreakBlock'
import { NoticeBlock } from '../components/NoticeBlock/NoticeBlock'
import { RichTextToolbar } from './RichTextToolbar'
import type { DocumentLayout, EditorComponents } from '../document/document'

export const constrainedRichTextField = {
  type: 'richtext' as const,
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
  renderMenu: (props: Parameters<typeof RichTextToolbar>[0]) => <RichTextToolbar {...props} />,
  renderInlineMenu: (props: Parameters<typeof RichTextToolbar>[0]) => <RichTextToolbar {...props} />,
} satisfies RichtextField

export const defaultRichTextValue = {
  type: 'doc' as const,
  content: [
    {
      type: 'paragraph' as const,
      content: [{ type: 'text' as const, text: 'Write your text here.' }],
    },
  ],
}

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
            ...constrainedRichTextField,
          },
        },
        defaultProps: {
          text: defaultRichTextValue,
        },
        render: ({ id, text }) => (
          <LayoutBlock id={id}>
            <TextBlock text={text as React.ReactNode} />
          </LayoutBlock>
        ),
      },
      NoticeBlock: {
        label: 'Important notice',
        fields: {
          heading: { type: 'text', contentEditable: true },
          text: { ...constrainedRichTextField },
        },
        defaultProps: {
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
        },
        render: ({ id, heading, text }) => (
          <LayoutBlock id={id}>
            <NoticeBlock heading={heading} text={text as React.ReactNode} />
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
