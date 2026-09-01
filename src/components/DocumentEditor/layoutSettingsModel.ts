import {
  defaultFluidLayout,
  defaultPagedLayout,
  type FluidDocumentLayout,
  type PagedDocumentLayout,
  type PageNumbering,
} from '../../document/document'

export const PAGED_MARGIN_MIN = 0
export const PAGED_MARGIN_MAX = 100
export const FLUID_WIDTH_MIN = 480
export const FLUID_WIDTH_MAX = 960

export const PAGE_NUMBERING_OPTIONS: Array<{ value: PageNumbering; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'page-number', label: 'Page 1' },
  { value: 'page-number-of-total', label: 'Page 1 of 3' },
  { value: 'number', label: '1' },
  { value: 'number-of-total', label: '1 / 3' },
]

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

export function enablePageMarginOverride(
  layout: PagedDocumentLayout,
  pageId: string,
): PagedDocumentLayout {
  if (layout.pageSettings?.[pageId]) return layout

  return {
    ...layout,
    pageSettings: {
      ...layout.pageSettings,
      [pageId]: { margins: { ...layout.margins } },
    },
  }
}

export function updatePageMargin(
  layout: PagedDocumentLayout,
  pageId: string,
  margin: PagedMargin,
  value: number,
): PagedDocumentLayout {
  const updatedLayout = enablePageMarginOverride(layout, pageId)
  const currentMargins = updatedLayout.pageSettings?.[pageId]?.margins ?? updatedLayout.margins

  return {
    ...updatedLayout,
    pageSettings: {
      ...updatedLayout.pageSettings,
      [pageId]: { margins: { ...currentMargins, [margin]: value } },
    },
  }
}

export function resetPageMarginOverride(
  layout: PagedDocumentLayout,
  pageId: string,
): PagedDocumentLayout {
  if (!layout.pageSettings?.[pageId]) return layout

  const { [pageId]: _removed, ...pageSettings } = layout.pageSettings
  return {
    ...layout,
    ...(Object.keys(pageSettings).length > 0 ? { pageSettings } : { pageSettings: undefined }),
  }
}

export function updatePageNumbering(
  layout: PagedDocumentLayout,
  pageNumbering: PageNumbering,
): PagedDocumentLayout {
  return { ...layout, pageNumbering }
}

export function updateFluidContentWidth(
  layout: FluidDocumentLayout,
  value: number,
): FluidDocumentLayout {
  return { ...layout, maxWidth: { ...layout.maxWidth, value } }
}

export function resetPagedSettings(layout: PagedDocumentLayout): PagedDocumentLayout {
  return {
    ...layout,
    pageNumbering: defaultPagedLayout.pageNumbering,
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
