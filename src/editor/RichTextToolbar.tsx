import { RichTextMenu, type RichtextField } from '@puckeditor/core'
import type { ChangeEvent } from 'react'

type InlineMenuProps = Parameters<NonNullable<RichtextField['renderInlineMenu']>>[0]

export function RichTextToolbar({ editor, readOnly }: InlineMenuProps) {
  const textStyle = editor?.isActive('heading', { level: 2 })
    ? 'h2'
    : editor?.isActive('heading', { level: 3 })
      ? 'h3'
      : 'p'

  const changeTextStyle = (event: ChangeEvent<HTMLSelectElement>) => {
    if (!editor) return

    const chain = editor.chain().focus()
    if (event.target.value === 'p') {
      chain.setParagraph().run()
    } else {
      chain.setHeading({ level: event.target.value === 'h2' ? 2 : 3 }).run()
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

  return (
    <div className="commspliant-richtext-toolbar">
      <RichTextMenu>
        <RichTextMenu.Group>
          <select
            className="commspliant-richtext-toolbar__style-select"
            aria-label="Text style"
            value={textStyle}
            disabled={readOnly || !editor}
            onChange={changeTextStyle}
          >
            <option value="p">Paragraph</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>
        </RichTextMenu.Group>
        <RichTextMenu.Group>
          <RichTextMenu.Bold />
          <RichTextMenu.Italic />
          <RichTextMenu.Underline />
        </RichTextMenu.Group>
        <RichTextMenu.Group>
          <RichTextMenu.BulletList />
          <RichTextMenu.OrderedList />
        </RichTextMenu.Group>
        <RichTextMenu.Group>
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
        </RichTextMenu.Group>
      </RichTextMenu>
    </div>
  )
}
