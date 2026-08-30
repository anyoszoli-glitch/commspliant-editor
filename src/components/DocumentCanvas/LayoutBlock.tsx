import { useContext, type ReactNode } from 'react'
import { LayoutContext } from './layoutContext'

type LayoutBlockProps = {
  id: string
  children: ReactNode
}

export function LayoutBlock({ id, children }: LayoutBlockProps) {
  const { mode, placements } = useContext(LayoutContext)
  const placement = placements[id]

  return (
    <div
      data-document-block={id}
      data-page-number={mode === 'paged' ? (placement?.page ?? 1) : undefined}
      style={{
        display: 'flow-root',
        marginTop: mode === 'paged' && placement ? placement.offsetBefore : undefined,
      }}
    >
      {children}
    </div>
  )
}
