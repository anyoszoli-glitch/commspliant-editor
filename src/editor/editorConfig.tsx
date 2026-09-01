import type { Config, RichtextField } from '@puckeditor/core'
import { DocumentCanvas } from '../components/DocumentCanvas/DocumentCanvas'
import { LayoutBlock } from '../components/DocumentCanvas/LayoutBlock'
import { HeadingBlock } from '../components/HeadingBlock/HeadingBlock'
import { TextBlock } from '../components/TextBlock/TextBlock'
import { PageBreakBlock } from '../components/PageBreakBlock/PageBreakBlock'
import { NoticeBlock } from '../components/NoticeBlock/NoticeBlock'
import { DividerBlock } from '../components/DividerBlock/DividerBlock'
import { SpacerBlock } from '../components/SpacerBlock/SpacerBlock'
import { TableBlock } from '../components/TableBlock/TableBlock'
import { TableEditorField } from '../components/TableBlock/TableEditorField'
import { defaultTableData } from '../components/TableBlock/tableModel'
import { RichTextToolbar } from './RichTextToolbar'
import type {
  DocumentBackgroundImage,
  DocumentLayout,
  EditorComponents,
} from '../document/document'
import { VariableNode } from './VariableNode'
import { typographyExtensions } from './TypographyExtensions'
import type { VariableDefinition, VariablePreviewValues } from './variables'

export function createConstrainedRichTextField(
  variableDefinitions: readonly VariableDefinition[] = [],
  previewEnabled = false,
  previewValues: VariablePreviewValues = {},
  onRequestAi?: (selectedText: string) => void,
) {
  return {
  type: 'richtext' as const,
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
    tiptap: {
      extensions: [
        ...typographyExtensions,
        VariableNode.configure({ variableDefinitions, previewEnabled, previewValues }),
      ],
    },
    renderMenu: (props: Parameters<typeof RichTextToolbar>[0]) => (
      <RichTextToolbar
        {...props}
        variableDefinitions={variableDefinitions}
        readOnly={props.readOnly || previewEnabled}
        onRequestAi={onRequestAi}
      />
    ),
    renderInlineMenu: (props: Parameters<typeof RichTextToolbar>[0]) => (
      <RichTextToolbar
        {...props}
        inline
        variableDefinitions={variableDefinitions}
        readOnly={props.readOnly || previewEnabled}
        onRequestAi={onRequestAi}
      />
    ),
  } satisfies RichtextField
}

export const defaultRichTextValue = {
  type: 'doc' as const,
  content: [
    {
      type: 'paragraph' as const,
      content: [{ type: 'text' as const, text: 'Write your text here.' }],
    },
  ],
}

export function createEditorConfig(
  layout: DocumentLayout,
  backgroundImage?: DocumentBackgroundImage,
  variableDefinitions: readonly VariableDefinition[] = [],
  previewEnabled = false,
  previewValues: VariablePreviewValues = {},
  onRequestAi?: (selectedText: string) => void,
): Config<EditorComponents> {
  const constrainedRichTextField = createConstrainedRichTextField(
    variableDefinitions,
    previewEnabled,
    previewValues,
    onRequestAi,
  )
  return {
    root: {
      render: ({ children }) => {
        // Preview is a host-level mode. Puck can briefly report isEditing as false when its
        // canvas remounts after a layout switch, so use the host state for editor-only chrome.
        const isEditorCanvas = !previewEnabled

        return (
          <DocumentCanvas
            layout={layout}
            backgroundImage={backgroundImage}
            isEditorCanvas={isEditorCanvas}
            showEditorPageIndicators={isEditorCanvas}
          >
            {children}
          </DocumentCanvas>
        )
      },
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
      TableBlock: {
        label: 'Table',
        fields: {
          table: {
            type: 'custom',
            render: ({ value, onChange, readOnly }) => (
              <TableEditorField value={value} onChange={onChange} readOnly={readOnly} />
            ),
          },
        },
        defaultProps: { table: defaultTableData },
        render: ({ id, table }) => (
          <LayoutBlock id={id}>
            <TableBlock table={table} />
          </LayoutBlock>
        ),
      },
      DividerBlock: {
        label: 'Divider',
        defaultProps: {},
        render: ({ id }) => (
          <LayoutBlock id={id}>
            <DividerBlock />
          </LayoutBlock>
        ),
      },
      SpacerBlock: {
        label: 'Spacer',
        fields: {
          size: {
            type: 'select',
            options: [
              { label: 'Small', value: 'small' },
              { label: 'Medium', value: 'medium' },
              { label: 'Large', value: 'large' },
            ],
          },
        },
        defaultProps: { size: 'medium' },
        render: ({ id, size }) => (
          <LayoutBlock id={id}>
            <SpacerBlock size={size} showIndicator={!previewEnabled} />
          </LayoutBlock>
        ),
      },
    },
  }
}
