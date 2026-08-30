import { useContext, type ReactNode } from 'react'
import { LayoutContext } from './layoutContext'

type LayoutBlockProps = {
  id: string
  children: ReactNode
  breakAfter?: boolean
}

export function LayoutBlock({ id, children, breakAfter = false }: LayoutBlockProps) {
  const { mode, placements } = useContext(LayoutContext)
  const placement = placements[id]

  return (
    <div
      data-document-block={id}
      data-page-break={breakAfter ? 'after' : undefined}
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
