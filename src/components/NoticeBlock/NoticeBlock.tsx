import type { ReactNode } from 'react'
import type { RichTextValue } from '../../document/document'

export type NoticeBlockProps = {
  heading: string
  text: RichTextValue
}

type NoticeBlockViewProps = Omit<NoticeBlockProps, 'text'> & { text: ReactNode }

export function NoticeBlock({ heading, text }: NoticeBlockViewProps) {
  return (
    <aside className="commspliant-notice-block" aria-label={heading}>
      <h2 className="commspliant-notice-block__heading">{heading}</h2>
      <div className="commspliant-notice-block__body">{text}</div>
    </aside>
  )
}
