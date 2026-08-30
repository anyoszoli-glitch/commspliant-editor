import type { ReactNode } from 'react'

type TextBlockProps = {
  text: string | ReactNode
}

export function TextBlock({ text }: TextBlockProps) {
  return (
    <p
      style={{
        fontSize: '16px',
        lineHeight: 1.6,
        margin: '0 0 16px 0',
      }}
    >
      {text}
    </p>
  )
}