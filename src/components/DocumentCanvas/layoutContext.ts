import { createContext } from 'react'
import type { BlockPlacement } from './pagination'

export type LayoutContextValue = {
  mode: 'paged' | 'fluid'
  placements: Record<string, BlockPlacement>
}

export const LayoutContext = createContext<LayoutContextValue>({
  mode: 'fluid',
  placements: {},
})
