import type { SpacerSize } from '../../document/document'

const spacerHeights: Record<SpacerSize, number> = {
  small: 16,
  medium: 32,
  large: 48,
}

type SpacerBlockProps = {
  size: SpacerSize
  showIndicator?: boolean
}

export function SpacerBlock({ size, showIndicator = false }: SpacerBlockProps) {
  return (
    <div
      className={showIndicator ? 'commspliant-spacer-block commspliant-spacer-block--author' : 'commspliant-spacer-block'}
      data-spacer-size={size}
      style={{ height: spacerHeights[size] }}
      aria-label={`${size} spacer`}
    >
      {showIndicator && <span>{size}</span>}
    </div>
  )
}
