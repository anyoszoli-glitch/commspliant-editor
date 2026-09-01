import { describe, expect, it } from 'vitest'
import {
  createInitialFloatingPanelGeometry,
  fitFloatingPanelToBounds,
  getFloatingPanelBounds,
  moveFloatingPanel,
  resizeFloatingPanel,
} from './floatingPanelModel'

const workspace = {
  left: 0,
  top: 0,
  right: 1200,
  bottom: 900,
  width: 1200,
  height: 900,
}
const bounds = getFloatingPanelBounds(workspace, 1200, 900)

describe('floating panel geometry', () => {
  it('places left and right panels beside their original docked edges', () => {
    const left = createInitialFloatingPanelGeometry(
      'left',
      { left: 43, top: 38, right: 189, bottom: 900, width: 146, height: 862 },
      bounds,
    )
    const right = createInitialFloatingPanelGeometry(
      'right',
      { left: 867, top: 38, right: 1200, bottom: 900, width: 333, height: 862 },
      bounds,
    )

    expect(left).toMatchObject({ x: 43, y: 38, width: 260 })
    expect(right.x + right.width).toBe(bounds.right)
    expect(right.width).toBe(333)
  })

  it('keeps a dragged panel fully inside the workspace', () => {
    const geometry = { x: 100, y: 100, width: 320, height: 480 }

    expect(moveFloatingPanel(geometry, -500, -500, bounds)).toMatchObject({
      x: bounds.left,
      y: bounds.top,
    })
    expect(moveFloatingPanel(geometry, 2000, 2000, bounds)).toMatchObject({
      x: bounds.right - geometry.width,
      y: bounds.bottom - geometry.height,
    })
  })

  it('enforces usable resize limits without moving the panel origin', () => {
    const geometry = { x: 400, y: 200, width: 320, height: 480 }
    const smaller = resizeFloatingPanel(geometry, 20, 20, bounds)
    const larger = resizeFloatingPanel(geometry, 2000, 2000, bounds)

    expect(smaller).toEqual({ x: 400, y: 200, width: 260, height: 280 })
    expect(larger.x).toBe(400)
    expect(larger.y).toBe(200)
    expect(larger.width).toBeLessThanOrEqual(bounds.right - geometry.x)
    expect(larger.height).toBeLessThanOrEqual(bounds.bottom - geometry.y)
  })

  it('fits saved geometry after the workspace becomes smaller', () => {
    const smallerBounds = getFloatingPanelBounds(
      { left: 100, top: 50, right: 800, bottom: 650, width: 700, height: 600 },
      900,
      700,
    )
    const fitted = fitFloatingPanelToBounds(
      { x: 900, y: 800, width: 800, height: 900 },
      smallerBounds,
    )

    expect(fitted.x).toBeGreaterThanOrEqual(smallerBounds.left)
    expect(fitted.y).toBeGreaterThanOrEqual(smallerBounds.top)
    expect(fitted.x + fitted.width).toBeLessThanOrEqual(smallerBounds.right)
    expect(fitted.y + fitted.height).toBeLessThanOrEqual(smallerBounds.bottom)
  })
})
