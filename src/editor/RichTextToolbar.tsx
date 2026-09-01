import { RichTextMenu, type RichtextField } from '@puckeditor/core'
import type { ChangeEvent } from 'react'
import { CustomColourPicker } from '../components/ColourPicker/CustomColourPicker'
import {
  fontFamilyOptions,
  highlightColourOptions,
  lineSpacingOptions,
  textColourOptions,
} from './TypographyExtensions'
import type { VariableDefinition } from './variables'

type InlineMenuProps = Parameters<NonNullable<RichtextField['renderInlineMenu']>>[0]

type RichTextToolbarProps = InlineMenuProps & {
  variableDefinitions?: readonly VariableDefinition[]
  textStyleOptions?: readonly RichTextStyleOption[]
  inline?: boolean
  onRequestAi?: (selectedText: string) => void
}

export type RichTextStyle = 'p' | `h${1 | 2 | 3 | 4 | 5 | 6}`

export type RichTextStyleOption = {
  label: string
  value: RichTextStyle
}

export const defaultRichTextStyleOptions: readonly RichTextStyleOption[] = [
  { label: 'Paragraph', value: 'p' },
  { label: 'Heading 2', value: 'h2' },
  { label: 'Heading 3', value: 'h3' },
]

export function RichTextToolbar({
  editor,
  readOnly,
  variableDefinitions = [],
  textStyleOptions = defaultRichTextStyleOptions,
  inline = false,
  onRequestAi,
}: RichTextToolbarProps) {
  const textStyle = textStyleOptions.find(({ value }) => {
    if (value === 'p') return editor?.isActive('paragraph')
    return editor?.isActive('heading', { level: Number(value.slice(1)) })
  })?.value ?? textStyleOptions[0]?.value ?? 'p'
  const fontFamily = String(editor?.getAttributes('fontFamily').family ?? '')
  const textColour = String(editor?.getAttributes('textColour').colour ?? '')
  const highlightColour = String(editor?.getAttributes('textHighlight').colour ?? '')
  const lineSpacing = String(
    editor?.getAttributes(editor?.isActive('heading') ? 'heading' : 'paragraph').lineSpacing ?? '',
  )

  const changeTextStyle = (event: ChangeEvent<HTMLSelectElement>) => {
    if (!editor) return

    const chain = editor.chain().focus()
    if (event.target.value === 'p') {
      chain.setParagraph().run()
    } else {
      chain.setHeading({
        level: Number(event.target.value.slice(1)) as 1 | 2 | 3 | 4 | 5 | 6,
      }).run()
    }
  }

  const editLink = () => {
    if (!editor) return

    const currentHref = editor.getAttributes('link').href
    const href = window.prompt('Link URL', typeof currentHref === 'string' ? currentHref : 'https://')
    if (href === null) return

    if (href.trim()) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run()
    } else {
      editor.chain().focus().unsetLink().run()
    }
  }

  const insertVariable = (event: ChangeEvent<HTMLSelectElement>) => {
    const key = event.target.value
    if (!editor || !key) return

    editor.chain().focus().insertContent({ type: 'variable', attrs: { key } }).run()
    event.target.value = ''
  }

  const changeMark = (mark: string, attribute: string) => (event: ChangeEvent<HTMLSelectElement>) => {
    if (!editor) return

    const value = event.target.value
    const chain = editor.chain().focus()
    if (value) {
      chain.setMark(mark, { [attribute]: value }).run()
    } else {
      chain.unsetMark(mark).run()
    }
  }

  const applyCustomColour = (mark: 'textColour' | 'textHighlight', colour: string) => {
    if (!editor) return

    // Native colour inputs temporarily move browser focus outside Puck's rich-text field.
    // Restore the editor first so Puck observes the following document transaction and
    // includes the custom mark in controlled data, history, save, and preview output.
    editor.commands.focus()
    requestAnimationFrame(() => {
      if (!editor.isDestroyed) editor.chain().setMark(mark, { colour }).run()
    })
  }

  const isPresetColour = (
    colour: string,
    options: readonly { value: string }[],
  ) => options.some((option) => option.value === colour)

  const changeLineSpacing = (event: ChangeEvent<HTMLSelectElement>) => {
    if (!editor) return

    const lineSpacingValue = event.target.value
    const chain = editor.chain().focus()
    if (lineSpacingValue) {
      chain
        .updateAttributes('paragraph', { lineSpacing: lineSpacingValue })
        .updateAttributes('heading', { lineSpacing: lineSpacingValue })
        .run()
    } else {
      chain
        .resetAttributes('paragraph', 'lineSpacing')
        .resetAttributes('heading', 'lineSpacing')
        .run()
    }
  }

  const clearFormatting = () => {
    if (!editor) return

    editor
      .chain()
      .focus()
      .clearNodes()
      .unsetAllMarks()
      .resetAttributes('paragraph', ['lineSpacing', 'textAlign'])
      .resetAttributes('heading', ['lineSpacing', 'textAlign'])
      .run()
  }

  const requestAi = () => {
    if (!editor || !onRequestAi) return

    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, ' ').trim()
    if (selectedText) onRequestAi(selectedText)
  }

  const linkControl = (
    <RichTextMenu.Control
      title="Link"
      active={editor?.isActive('link')}
      disabled={readOnly || !editor}
      onClick={editLink}
      icon={
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M8 12l4-4M7 14H5.5a3.5 3.5 0 010-7H8M12 7h2.5a3.5 3.5 0 010 7H12" />
        </svg>
      }
    />
  )

  const clearFormattingControl = (
    <RichTextMenu.Control
      title="Clear formatting"
      disabled={readOnly || !editor}
      onClick={clearFormatting}
      icon={
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M5 5h9M9.5 5L7 14M4 15h9M12 11l4 4m0-4l-4 4" />
        </svg>
      }
    />
  )

  const aiControl = (
    <RichTextMenu.Control
      title="Ask AI"
      disabled={readOnly || !editor}
      onClick={requestAi}
      icon={
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 2.5l1.2 4.8L16 8.5l-4.8 1.2L10 14.5l-1.2-4.8L4 8.5l4.8-1.2L10 2.5zM15.5 13l.5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5.5-2z" />
        </svg>
      }
    />
  )

  if (inline) {
    return (
      <div className="commspliant-richtext-toolbar commspliant-richtext-toolbar--inline">
        <RichTextMenu>
          <RichTextMenu.Group>
            <RichTextMenu.Bold />
            <RichTextMenu.Italic />
            <RichTextMenu.Underline />
            <RichTextMenu.Strikethrough />
          </RichTextMenu.Group>
          <RichTextMenu.Group>
            <RichTextMenu.AlignSelect />
            <RichTextMenu.BulletList />
            <RichTextMenu.OrderedList />
            {linkControl}
            {clearFormattingControl}
            {aiControl}
          </RichTextMenu.Group>
        </RichTextMenu>
      </div>
    )
  }

  return (
    <div className="commspliant-richtext-toolbar">
      <RichTextMenu>
        <div className="commspliant-richtext-toolbar__row">
          <RichTextMenu.Group>
            <select
              className="commspliant-richtext-toolbar__style-select"
              aria-label="Text style"
              value={textStyle}
              disabled={readOnly || !editor}
              onChange={changeTextStyle}
            >
              {textStyleOptions.map(({ label, value }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </RichTextMenu.Group>
        </div>
        {variableDefinitions.length > 0 && (
          <div className="commspliant-richtext-toolbar__row">
            <RichTextMenu.Group>
              <select
                className="commspliant-richtext-toolbar__style-select"
                aria-label="Insert variable"
                defaultValue=""
                disabled={readOnly || !editor}
                onChange={insertVariable}
              >
                <option value="" disabled>
                  Insert variable
                </option>
                {variableDefinitions.map((definition) => (
                  <option key={definition.key} value={definition.key}>
                    {definition.label}
                  </option>
                ))}
              </select>
            </RichTextMenu.Group>
          </div>
        )}
        <div className="commspliant-richtext-toolbar__row commspliant-richtext-toolbar__row--responsive-pair">
          <RichTextMenu.Group>
            <select
              className="commspliant-richtext-toolbar__style-select"
              aria-label="Font family"
              value={fontFamily}
              disabled={readOnly || !editor}
              onChange={changeMark('fontFamily', 'family')}
            >
              {fontFamilyOptions.map(({ label, value }) => (
                <option key={label} value={value}>{label}</option>
              ))}
            </select>
          </RichTextMenu.Group>
          <RichTextMenu.Group>
            <select
              className="commspliant-richtext-toolbar__style-select"
              aria-label="Line spacing"
              value={lineSpacing}
              disabled={readOnly || !editor}
              onChange={changeLineSpacing}
            >
              <option value="">Line spacing</option>
              {lineSpacingOptions.map(({ label, value }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </RichTextMenu.Group>
        </div>
        <div className="commspliant-richtext-toolbar__row commspliant-richtext-toolbar__row--responsive-pair">
          <RichTextMenu.Group>
            <div className="commspliant-richtext-toolbar__colour-control">
              <select
                className="commspliant-richtext-toolbar__style-select"
                aria-label="Text colour"
                value={textColour}
                disabled={readOnly || !editor}
                onChange={changeMark('textColour', 'colour')}
              >
                {textColourOptions.map(({ label, value }) => (
                  <option key={label} value={value}>{value ? label : 'Colour'}</option>
                ))}
                {textColour && !isPresetColour(textColour, textColourOptions) && (
                  <option value={textColour}>Custom</option>
                )}
              </select>
              <CustomColourPicker
                className="commspliant-richtext-toolbar__custom-colour"
                ariaLabel="Custom text colour"
                title="Custom text colour"
                value={textColour}
                fallbackColour="#18181b"
                disabled={readOnly || !editor}
                onChange={(colour) => applyCustomColour('textColour', colour)}
              />
            </div>
          </RichTextMenu.Group>
          <RichTextMenu.Group>
            <div className="commspliant-richtext-toolbar__colour-control">
              <select
                className="commspliant-richtext-toolbar__style-select"
                aria-label="Text highlight"
                value={highlightColour}
                disabled={readOnly || !editor}
                onChange={changeMark('textHighlight', 'colour')}
              >
                {highlightColourOptions.map(({ label, value }) => (
                  <option key={label} value={value}>{value ? label : 'Highlight'}</option>
                ))}
                {highlightColour && !isPresetColour(highlightColour, highlightColourOptions) && (
                  <option value={highlightColour}>Custom</option>
                )}
              </select>
              <CustomColourPicker
                className="commspliant-richtext-toolbar__custom-colour"
                ariaLabel="Custom text highlight"
                title="Custom text highlight"
                value={highlightColour}
                fallbackColour="#fff3bf"
                disabled={readOnly || !editor}
                onChange={(colour) => applyCustomColour('textHighlight', colour)}
              />
            </div>
          </RichTextMenu.Group>
        </div>
        <div className="commspliant-richtext-toolbar__row commspliant-richtext-toolbar__row--actions">
          <RichTextMenu.Group>
            <RichTextMenu.Bold />
            <RichTextMenu.Italic />
            <RichTextMenu.Underline />
            <RichTextMenu.Strikethrough />
          </RichTextMenu.Group>
          <RichTextMenu.Group>
            <RichTextMenu.AlignSelect />
          </RichTextMenu.Group>
        </div>
        <div className="commspliant-richtext-toolbar__row commspliant-richtext-toolbar__row--actions">
          <RichTextMenu.Group>
            <RichTextMenu.BulletList />
            <RichTextMenu.OrderedList />
            {linkControl}
            {clearFormattingControl}
            {aiControl}
          </RichTextMenu.Group>
        </div>
      </RichTextMenu>
    </div>
  )
}
