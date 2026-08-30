import {
  defaultFluidLayout,
  defaultPagedLayout,
  type FluidDocumentLayout,
  type PagedDocumentLayout,
} from '../../document/document'

export const PAGED_MARGIN_MIN = 10
export const PAGED_MARGIN_MAX = 40
export const FLUID_WIDTH_MIN = 480
export const FLUID_WIDTH_MAX = 960

export type PagedMargin = keyof PagedDocumentLayout['margins'] extends infer Key
  ? Key extends 'top' | 'right' | 'bottom' | 'left'
    ? Key
    : never
  : never

export function parseLayoutInteger(value: string, min: number, max: number): number | undefined {
  if (!/^\d+$/.test(value)) return undefined
  const parsedValue = Number(value)
  return Number.isSafeInteger(parsedValue) && parsedValue >= min && parsedValue <= max
    ? parsedValue
    : undefined
}

export function layoutValidationMessage(min: number, max: number): string {
  return `Enter a whole number from ${min} to ${max}.`
}

export function updatePagedMargin(
  layout: PagedDocumentLayout,
  margin: PagedMargin,
  value: number,
): PagedDocumentLayout {
  return { ...layout, margins: { ...layout.margins, [margin]: value } }
}

export function updateFluidContentWidth(
  layout: FluidDocumentLayout,
  value: number,
): FluidDocumentLayout {
  return { ...layout, maxWidth: { ...layout.maxWidth, value } }
}

export function resetPagedMargins(layout: PagedDocumentLayout): PagedDocumentLayout {
  return {
    ...layout,
    margins: {
      ...layout.margins,
      top: defaultPagedLayout.margins.top,
      right: defaultPagedLayout.margins.right,
      bottom: defaultPagedLayout.margins.bottom,
      left: defaultPagedLayout.margins.left,
    },
  }
}

export function resetFluidContentWidth(layout: FluidDocumentLayout): FluidDocumentLayout {
  return { ...layout, maxWidth: { ...layout.maxWidth, value: defaultFluidLayout.maxWidth.value } }
}
