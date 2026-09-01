import { useContext, type ReactNode } from 'react'
import { LayoutContext } from './layoutContext'

type LayoutBlockProps = {
  id: string
  children: ReactNode
  breakAfter?: boolean
}

export function LayoutBlock({ id, children, breakAfter = false }: LayoutBlockProps) {
  const { mode, placements, pageMargins } = useContext(LayoutContext)
  const placement = placements[id]
  const margins = placement ? pageMargins[placement.page] : undefined

  return (
    <div
      data-document-block={id}
      data-page-break={breakAfter ? 'after' : undefined}
      data-page-number={mode === 'paged' ? (placement?.page ?? 1) : undefined}
      style={{
        display: 'flow-root',
        marginTop: mode === 'paged' && placement ? placement.offsetBefore : undefined,
        marginLeft: mode === 'paged' && margins ? `${margins.left}${margins.unit}` : undefined,
        width:
          mode === 'paged' && margins
            ? `${210 - margins.left - margins.right}${margins.unit}`
            : undefined,
      }}
    >
      {children}
    </div>
  )
}
