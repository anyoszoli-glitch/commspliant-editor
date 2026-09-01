import { createContext } from 'react'
import type { PageMargins } from '../../document/document'
import type { BlockPlacement } from './pagination'

export type LayoutContextValue = {
  mode: 'paged' | 'fluid'
  placements: Record<string, BlockPlacement>
  pageMargins: Record<number, PageMargins>
}

export const LayoutContext = createContext<LayoutContextValue>({
  mode: 'fluid',
  placements: {},
  pageMargins: {},
})
