import type { ReactNode } from 'react'

type HeadingBlockProps = {
  text: string | ReactNode
}

export function HeadingBlock({ text }: HeadingBlockProps) {
  return (
    <div className="commspliant-heading-block">
      {typeof text === 'string' ? <h1>{text}</h1> : text}
    </div>
  )
}
