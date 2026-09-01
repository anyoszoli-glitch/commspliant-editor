import { createContext, useContext, type ReactNode } from 'react'
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
import {
  defaultRichTextStyleOptions,
  RichTextToolbar,
  type RichTextStyleOption,
} from './RichTextToolbar'
import type {
  DocumentBackgroundColour,
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
  textStyleOptions: readonly RichTextStyleOption[] = defaultRichTextStyleOptions,
) {
  const headingLevels = textStyleOptions.flatMap(({ value }) =>
    value === 'p' ? [] : [Number(value.slice(1)) as 1 | 2 | 3 | 4 | 5 | 6],
  )

  return {
  type: 'richtext' as const,
  contentEditable: true,
  options: {
    blockquote: false,
    code: false,
    codeBlock: false,
    heading: { levels: headingLevels },
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
        textStyleOptions={textStyleOptions}
        readOnly={props.readOnly || previewEnabled}
        onRequestAi={onRequestAi}
      />
    ),
    renderInlineMenu: (props: Parameters<typeof RichTextToolbar>[0]) => (
      <RichTextToolbar
        {...props}
        inline
        variableDefinitions={variableDefinitions}
        textStyleOptions={textStyleOptions}
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

export const defaultHeadingValue = {
  type: 'doc' as const,
  content: [
    {
      type: 'heading' as const,
      attrs: { level: 1 },
      content: [{ type: 'text' as const, text: 'New heading' }],
    },
  ],
}

const headingTextStyleOptions: readonly RichTextStyleOption[] = [
  { label: 'Heading 1', value: 'h1' },
  { label: 'Heading 2', value: 'h2' },
  { label: 'Heading 3', value: 'h3' },
  { label: 'Heading 4', value: 'h4' },
  { label: 'Heading 5', value: 'h5' },
  { label: 'Heading 6', value: 'h6' },
]

type DocumentAppearance = {
  backgroundImage?: DocumentBackgroundImage
  backgroundColour?: DocumentBackgroundColour
}

export const DocumentAppearanceContext = createContext<DocumentAppearance | null>(null)

function EditorDocumentCanvas({
  children,
  layout,
  fallbackBackgroundImage,
  isEditorCanvas,
}: {
  children?: ReactNode
  layout: DocumentLayout
  fallbackBackgroundImage?: DocumentBackgroundImage
  isEditorCanvas: boolean
}) {
  const appearance = useContext(DocumentAppearanceContext)

  return (
    <DocumentCanvas
      layout={layout}
      backgroundImage={
        appearance ? appearance.backgroundImage : fallbackBackgroundImage
      }
      backgroundColour={appearance?.backgroundColour}
      isEditorCanvas={isEditorCanvas}
      showEditorPageIndicators={isEditorCanvas}
    >
      {children}
    </DocumentCanvas>
  )
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
  const headingRichTextField = createConstrainedRichTextField(
    variableDefinitions,
    previewEnabled,
    previewValues,
    onRequestAi,
    headingTextStyleOptions,
  )
  return {
    root: {
      render: ({ children }) => {
        // Preview is a host-level mode. Puck can briefly report isEditing as false when its
        // canvas remounts after a layout switch, so use the host state for editor-only chrome.
        const isEditorCanvas = !previewEnabled

        return (
          <EditorDocumentCanvas
            layout={layout}
            fallbackBackgroundImage={backgroundImage}
            isEditorCanvas={isEditorCanvas}
          >
            {children}
          </EditorDocumentCanvas>
        )
      },
    },
    components: {
      HeadingBlock: {
        label: 'Heading',
        fields: { text: { ...headingRichTextField } },
        defaultProps: { text: defaultHeadingValue },
        render: ({ id, text }) => (
          <LayoutBlock id={id}>
            <HeadingBlock text={text as React.ReactNode} />
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
