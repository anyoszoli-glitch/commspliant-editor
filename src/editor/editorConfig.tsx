import { createContext, useContext, type ReactNode } from 'react'
import type { Config, RichtextField } from '@puckeditor/core'
import { DocumentCanvas } from '../components/DocumentCanvas/DocumentCanvas'
import { LayoutBlock } from '../components/DocumentCanvas/LayoutBlock'
import type { PageDescriptor } from '../components/DocumentCanvas/pagination'
import { HeadingBlock } from '../components/HeadingBlock/HeadingBlock'
import { TextBlock } from '../components/TextBlock/TextBlock'
import { PageBreakBlock } from '../components/PageBreakBlock/PageBreakBlock'
import { NoticeBlock } from '../components/NoticeBlock/NoticeBlock'
import { DividerBlock } from '../components/DividerBlock/DividerBlock'
import { SpacerBlock } from '../components/SpacerBlock/SpacerBlock'
import { ColumnsBlock, ColumnsBlockAuthoring } from '../components/ColumnsBlock/ColumnsBlock'
import { ColumnsEditorField } from '../components/ColumnsBlock/ColumnsEditorField'
import { ColumnsBackgroundColourField } from '../components/ColumnsBlock/ColumnsBackgroundColourField'
import { ColumnsWidthPresetField } from '../components/ColumnsBlock/ColumnsWidthPresetField'
import { TableBlock } from '../components/TableBlock/TableBlock'
import { TableEditorField } from '../components/TableBlock/TableEditorField'
import { defaultTableData } from '../components/TableBlock/tableModel'
import { ImageBlock } from '../components/ImageBlock/ImageBlock'
import { ImageEditorField } from '../components/ImageBlock/ImageEditorField'
import type { ImagePicker } from '../components/ImageBlock/imageTypes'
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
import {
  defaultColumnsBlockData,
  getColumnCount,
  getColumnsForCount,
  normalizeColumnBackgrounds,
  normalizeColumnsLayout,
} from '../document/document'
import { VariableNode } from './VariableNode'
import { typographyExtensions } from './TypographyExtensions'
import type { VariableDefinition, VariablePreviewValues } from './variables'
import { createTranslator, type Translate } from '../i18n'

export function createConstrainedRichTextField(
  variableDefinitions: readonly VariableDefinition[] = [],
  previewEnabled = false,
  previewValues: VariablePreviewValues = {},
  onRequestAi?: (selectedText: string) => void,
  textStyleOptions: readonly RichTextStyleOption[] = defaultRichTextStyleOptions,
  formatWholeBlockOnEmptySelection = false,
  t: Translate = createTranslator(),
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
        VariableNode.configure({ variableDefinitions, previewEnabled, previewValues, t }),
      ],
    },
    renderMenu: (props: { children: ReactNode; editor: Parameters<typeof RichTextToolbar>[0]['editor']; editorState: Parameters<typeof RichTextToolbar>[0]['editorState']; readOnly: boolean }) => (
      <RichTextToolbar
        {...props}
        variableDefinitions={variableDefinitions}
        textStyleOptions={textStyleOptions}
        formatWholeBlockOnEmptySelection={formatWholeBlockOnEmptySelection}
        readOnly={props.readOnly || previewEnabled}
        onRequestAi={onRequestAi}
        t={t}
      />
    ),
    renderInlineMenu: (props: { children: ReactNode; editor: Parameters<typeof RichTextToolbar>[0]['editor']; editorState: Parameters<typeof RichTextToolbar>[0]['editorState']; readOnly: boolean }) => (
      <RichTextToolbar
        {...props}
        inline
        variableDefinitions={variableDefinitions}
        textStyleOptions={textStyleOptions}
        formatWholeBlockOnEmptySelection={formatWholeBlockOnEmptySelection}
        readOnly={props.readOnly || previewEnabled}
        onRequestAi={onRequestAi}
        t={t}
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
  showMarginGuides,
  selectedPageId,
  onPageSelect,
  onPagesChange,
  pageSettingsChannel,
}: {
  children?: ReactNode
  layout: DocumentLayout
  fallbackBackgroundImage?: DocumentBackgroundImage
  isEditorCanvas: boolean
  showMarginGuides: boolean
  selectedPageId?: string
  onPageSelect?: (pageId: string) => void
  onPagesChange?: (pages: PageDescriptor[]) => void
  pageSettingsChannel?: string
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
      showMarginGuides={showMarginGuides}
      selectedPageId={selectedPageId}
      onPageSelect={onPageSelect}
      onPagesChange={onPagesChange}
      pageSettingsChannel={pageSettingsChannel}
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
  selectedPageId?: string,
  onPageSelect?: (pageId: string) => void,
  onPagesChange?: (pages: PageDescriptor[]) => void,
  pageSettingsChannel?: string,
  showMarginGuides = true,
  t: Translate = createTranslator(),
  imagePicker?: ImagePicker,
  imagePickerActionLabel?: string,
): Config<EditorComponents> {
  const constrainedRichTextField = createConstrainedRichTextField(
    variableDefinitions,
    previewEnabled,
    previewValues,
    onRequestAi,
    defaultRichTextStyleOptions.map((option) => ({ ...option, label: option.value === 'p' ? t('paragraph') : option.value === 'h2' ? t('heading2') : t('heading3') })),
    false,
    t,
  )
  const headingRichTextField = createConstrainedRichTextField(
    variableDefinitions,
    previewEnabled,
    previewValues,
    onRequestAi,
    headingTextStyleOptions.map((option) => ({ ...option, label: t(`heading${option.value.slice(1)}` as Parameters<Translate>[0]) })),
    true,
    t,
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
            showMarginGuides={showMarginGuides}
            selectedPageId={selectedPageId}
            onPageSelect={onPageSelect}
            onPagesChange={onPagesChange}
            pageSettingsChannel={pageSettingsChannel}
          >
            <div className="document-editor__root-dropzone">
              {children}
              <div className="document-editor__empty-drop-helper" aria-hidden="true">
                <span className="document-editor__empty-drop-helper-icons">
                  <span className="document-editor__empty-drop-helper-square" />
                  <span className="document-editor__empty-drop-helper-arrow">→</span>
                  <span className="document-editor__empty-drop-helper-arrow">↓</span>
                </span>
                <strong>{t('startPage')}</strong>
                <span>{t('dragBlock')}</span>
              </div>
            </div>
          </EditorDocumentCanvas>
        )
      },
    },
    components: {
      HeadingBlock: {
        label: t('heading'),
        fields: { text: { ...headingRichTextField } },
        defaultProps: { text: defaultHeadingValue },
        render: ({ id, text }) => (
          <LayoutBlock id={id}>
            <HeadingBlock text={text as React.ReactNode} />
          </LayoutBlock>
        ),
      },
      TextBlock: {
        label: t('text'),
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
        label: t('importantNotice'),
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
        label: t('pageBreak'),
        defaultProps: {},
        render: ({ id }) => (
          <LayoutBlock id={id} breakAfter>
            <PageBreakBlock />
          </LayoutBlock>
        ),
      },
      TableBlock: {
        label: t('table'),
        fields: {
          table: {
            type: 'custom',
            render: ({ value, onChange, readOnly }) => (
              <TableEditorField value={value} onChange={onChange} readOnly={readOnly} t={t} />
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
      ImageBlock: {
        label: t('image'),
        fields: {
          image: {
            type: 'custom',
            render: ({ value, onChange, readOnly }) => (
              <ImageEditorField
                value={value}
                onChange={onChange}
                readOnly={readOnly}
                imagePicker={imagePicker}
                imagePickerActionLabel={imagePickerActionLabel}
                t={t}
              />
            ),
          },
        },
        defaultProps: {
          image: { alt: '', title: '', width: 100, alignment: 'center', horizontalOffset: 0 },
        },
        render: ({ id, image }) => (
          <LayoutBlock id={id}>
            <ImageBlock image={image} pickerAvailable={!!imagePicker} t={t} />
          </LayoutBlock>
        ),
      },
      DividerBlock: {
        label: t('divider'),
        defaultProps: {},
        render: ({ id }) => (
          <LayoutBlock id={id}>
            <DividerBlock />
          </LayoutBlock>
        ),
      },
      SpacerBlock: {
        label: t('spacer'),
        fields: {
          size: {
            type: 'select',
            options: [
              { label: t('small'), value: 'small' },
              { label: t('medium'), value: 'medium' },
              { label: t('large'), value: 'large' },
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
      ColumnsBlock: {
        label: t('columns'),
        fields: {
          columns: {
            type: 'custom',
            render: ({ value, onChange, readOnly }) => (
              <ColumnsEditorField
                value={value}
                onChange={onChange}
                readOnly={readOnly}
                t={t}
              />
            ),
          },
          layout: {
            type: 'custom',
            render: ({ value, onChange, readOnly }) => (
              <ColumnsWidthPresetField value={value} onChange={onChange} readOnly={readOnly} t={t} />
            ),
          },
          columnBackgrounds: {
            type: 'custom',
            render: ({ value, onChange, readOnly }) => (
              <ColumnsBackgroundColourField value={value} onChange={onChange} readOnly={readOnly} t={t} />
            ),
          },
          leftColumn: {
            type: 'slot',
            allow: ['HeadingBlock', 'TextBlock', 'TableBlock', 'ImageBlock', 'DividerBlock', 'SpacerBlock'],
            disallow: ['ColumnsBlock'],
          },
          rightColumn: {
            type: 'slot',
            allow: ['HeadingBlock', 'TextBlock', 'TableBlock', 'ImageBlock', 'DividerBlock', 'SpacerBlock'],
            disallow: ['ColumnsBlock'],
          },
          thirdColumn: {
            type: 'slot',
            allow: ['HeadingBlock', 'TextBlock', 'TableBlock', 'ImageBlock', 'DividerBlock', 'SpacerBlock'],
            disallow: ['ColumnsBlock'],
          },
          fourthColumn: {
            type: 'slot',
            allow: ['HeadingBlock', 'TextBlock', 'TableBlock', 'ImageBlock', 'DividerBlock', 'SpacerBlock'],
            disallow: ['ColumnsBlock'],
          },
        },
        defaultProps: {
          columns: defaultColumnsBlockData.columns.map((column) => ({ ...column })),
          layout: { ...defaultColumnsBlockData.layout },
          columnBackgrounds: { ...defaultColumnsBlockData.columnBackgrounds },
          leftColumn: [],
          rightColumn: [],
          thirdColumn: [],
          fourthColumn: [],
        },
        resolveData: (data) => {
          const count = getColumnCount(data.props.columns)
          return {
            props: {
              columns: getColumnsForCount(count),
              layout: normalizeColumnsLayout(data.props.layout, count),
              columnBackgrounds: normalizeColumnBackgrounds(data.props.columnBackgrounds),
            },
          }
        },
        render: ({ id, columns, layout, columnBackgrounds, leftColumn, rightColumn, thirdColumn, fourthColumn }) => {
          const columnsProps = {
            columns,
            layout,
            columnBackgrounds,
            leftColumn,
            rightColumn,
            thirdColumn,
            fourthColumn,
          }

          return (
            <LayoutBlock id={id}>
              {previewEnabled ? (
                <ColumnsBlock {...columnsProps} />
              ) : (
                <ColumnsBlockAuthoring {...columnsProps} id={id} showEmptyGuidance />
              )}
            </LayoutBlock>
          )
        },
      },
    },
  }
}
