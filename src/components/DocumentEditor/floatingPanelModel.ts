export type FloatingPanelSide = 'left' | 'right'

export type FloatingPanelGeometry = {
  x: number
  y: number
  width: number
  height: number
}

export type FloatingPanelBounds = {
  left: number
  top: number
  right: number
  bottom: number
}

export type RectLike = {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

const PANEL_GAP = 12
const PANEL_MIN_WIDTH = 260
const PANEL_MIN_HEIGHT = 280
const PANEL_MAX_WIDTH = 560
const PANEL_MAX_HEIGHT = 760
const PANEL_MAX_WORKSPACE_WIDTH_RATIO = 0.65

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum)

export function getFloatingPanelBounds(
  workspace: RectLike,
  viewportWidth: number,
  viewportHeight: number,
): FloatingPanelBounds {
  const left = clamp(workspace.left + PANEL_GAP, PANEL_GAP, viewportWidth - PANEL_GAP)
  const top = clamp(workspace.top + PANEL_GAP, PANEL_GAP, viewportHeight - PANEL_GAP)
  const right = clamp(workspace.right - PANEL_GAP, left, viewportWidth - PANEL_GAP)
  const bottom = clamp(workspace.bottom - PANEL_GAP, top, viewportHeight - PANEL_GAP)

  return { left, top, right, bottom }
}

function getPanelSizeLimits(bounds: FloatingPanelBounds) {
  const availableWidth = Math.max(1, bounds.right - bounds.left)
  const availableHeight = Math.max(1, bounds.bottom - bounds.top)
  const minWidth = Math.min(PANEL_MIN_WIDTH, availableWidth)
  const minHeight = Math.min(PANEL_MIN_HEIGHT, availableHeight)
  const maxWidth = Math.max(
    minWidth,
    Math.min(PANEL_MAX_WIDTH, availableWidth * PANEL_MAX_WORKSPACE_WIDTH_RATIO),
  )
  const maxHeight = Math.max(minHeight, Math.min(PANEL_MAX_HEIGHT, availableHeight))

  return { minWidth, minHeight, maxWidth, maxHeight }
}

export function fitFloatingPanelToBounds(
  geometry: FloatingPanelGeometry,
  bounds: FloatingPanelBounds,
): FloatingPanelGeometry {
  const { minWidth, minHeight, maxWidth, maxHeight } = getPanelSizeLimits(bounds)
  const width = clamp(geometry.width, minWidth, maxWidth)
  const height = clamp(geometry.height, minHeight, maxHeight)

  return {
    x: clamp(geometry.x, bounds.left, bounds.right - width),
    y: clamp(geometry.y, bounds.top, bounds.bottom - height),
    width,
    height,
  }
}

export function createInitialFloatingPanelGeometry(
  side: FloatingPanelSide,
  dockedPanel: RectLike,
  bounds: FloatingPanelBounds,
): FloatingPanelGeometry {
  const proposedWidth = Math.max(dockedPanel.width, PANEL_MIN_WIDTH)
  const proposedHeight = Math.max(dockedPanel.height, PANEL_MIN_HEIGHT)

  return fitFloatingPanelToBounds(
    {
      x: side === 'right' ? dockedPanel.right - proposedWidth : dockedPanel.left,
      y: dockedPanel.top,
      width: proposedWidth,
      height: proposedHeight,
    },
    bounds,
  )
}

export function moveFloatingPanel(
  geometry: FloatingPanelGeometry,
  x: number,
  y: number,
  bounds: FloatingPanelBounds,
): FloatingPanelGeometry {
  return fitFloatingPanelToBounds({ ...geometry, x, y }, bounds)
}

export function resizeFloatingPanel(
  geometry: FloatingPanelGeometry,
  width: number,
  height: number,
  bounds: FloatingPanelBounds,
): FloatingPanelGeometry {
  const limits = getPanelSizeLimits(bounds)
  const maximumWidthFromOrigin = Math.max(1, bounds.right - geometry.x)
  const maximumHeightFromOrigin = Math.max(1, bounds.bottom - geometry.y)

  return {
    ...geometry,
    width: clamp(
      width,
      Math.min(limits.minWidth, maximumWidthFromOrigin),
      Math.min(limits.maxWidth, maximumWidthFromOrigin),
    ),
    height: clamp(
      height,
      Math.min(limits.minHeight, maximumHeightFromOrigin),
      Math.min(limits.maxHeight, maximumHeightFromOrigin),
    ),
  }
}
