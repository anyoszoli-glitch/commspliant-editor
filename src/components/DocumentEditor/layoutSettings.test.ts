import { describe, expect, it } from 'vitest'
import {
  changeDocumentLayout,
  createDocument,
  defaultFluidLayout,
  defaultPagedLayout,
} from '../../document/document'
import {
  FLUID_WIDTH_MAX,
  FLUID_WIDTH_MIN,
  PAGED_MARGIN_MAX,
  PAGED_MARGIN_MIN,
  parseLayoutInteger,
  resetFluidContentWidth,
  resetPagedMargins,
  updateFluidContentWidth,
  updatePagedMargin,
} from './layoutSettingsModel'

describe('layout settings', () => {
  it.each([PAGED_MARGIN_MIN, PAGED_MARGIN_MAX])('accepts %i mm margins', (value) => {
    expect(parseLayoutInteger(String(value), PAGED_MARGIN_MIN, PAGED_MARGIN_MAX)).toBe(value)
  })

  it.each(['9', '41', '20.5', 'twenty'])('rejects invalid paged margins: %s', (value) => {
    expect(parseLayoutInteger(value, PAGED_MARGIN_MIN, PAGED_MARGIN_MAX)).toBeUndefined()
  })

  it.each([FLUID_WIDTH_MIN, FLUID_WIDTH_MAX])('accepts %i px content widths', (value) => {
    expect(parseLayoutInteger(String(value), FLUID_WIDTH_MIN, FLUID_WIDTH_MAX)).toBe(value)
  })

  it.each(['479', '961', '680.5', 'wide', '', 'Infinity'])(
    'rejects invalid fluid content widths: %s',
    (value) => {
      expect(parseLayoutInteger(value, FLUID_WIDTH_MIN, FLUID_WIDTH_MAX)).toBeUndefined()
    },
  )

  it('updates one margin without changing the other three or document content', () => {
    const document = createDocument('layout-letter')
    document.data.content.push({ type: 'HeadingBlock', props: { id: 'heading', text: 'Keep me' } })
    const originalData = document.data
    const layout = updatePagedMargin(defaultPagedLayout, 'top', 24)

    expect(layout.margins).toEqual({ top: 24, right: 20, bottom: 20, left: 20, unit: 'mm' })
    expect(document.data).toBe(originalData)
  })

  it('resets only exposed paged margins to their defaults', () => {
    const layout = {
      ...defaultPagedLayout,
      margins: { top: 12, right: 13, bottom: 14, left: 15, unit: 'mm' as const },
    }

    expect(resetPagedMargins(layout).margins).toEqual(defaultPagedLayout.margins)
  })

  it('resets only fluid content width and preserves fluid padding', () => {
    const layout = {
      ...defaultFluidLayout,
      maxWidth: { value: 820, unit: 'px' as const },
      padding: { top: 11, right: 12, bottom: 13, left: 14, unit: 'px' as const },
    }

    const resetLayout = resetFluidContentWidth(layout)
    expect(resetLayout.maxWidth).toEqual(defaultFluidLayout.maxWidth)
    expect(resetLayout.padding).toEqual(layout.padding)
  })

  it('keeps the most recent settings for each mode during a session switch', () => {
    const document = createDocument('session-letter')
    const pagedLayout = updatePagedMargin(defaultPagedLayout, 'left', 28)
    const fluidLayout = updateFluidContentWidth(defaultFluidLayout, 760)
    const fluidDocument = changeDocumentLayout({ ...document, layout: pagedLayout }, 'fluid', pagedLayout, fluidLayout)
    const restoredPaged = changeDocumentLayout(fluidDocument, 'paged', pagedLayout, fluidLayout)
    const restoredFluid = changeDocumentLayout(restoredPaged, 'fluid', pagedLayout, fluidLayout)

    expect(restoredPaged.layout).toEqual(pagedLayout)
    expect(restoredFluid.layout).toEqual(fluidLayout)
  })
})
