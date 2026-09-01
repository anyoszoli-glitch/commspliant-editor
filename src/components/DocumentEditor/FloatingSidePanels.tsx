import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { useTranslation, type Translate } from '../../i18n'

import {
  createInitialFloatingPanelGeometry,
  fitFloatingPanelToBounds,
  getFloatingPanelBounds,
  moveFloatingPanel,
  resizeFloatingPanel,
  type FloatingPanelGeometry,
  type FloatingPanelSide,
} from './floatingPanelModel'

type FloatingSidePanelsProps = {
  workspaceRef: RefObject<HTMLDivElement | null>
}

type PanelMode = 'docked' | 'floating'

type PanelState = {
  mode: PanelMode
  geometry: FloatingPanelGeometry
  hasFloated: boolean
}

type SidebarTarget = {
  element: HTMLElement | null
  visible: boolean
}

type PointerOperation = {
  side: FloatingPanelSide
  kind: 'move' | 'resize'
  pointerId: number
  startX: number
  startY: number
  startGeometry: FloatingPanelGeometry
}

const sidebarSelectors: Record<FloatingPanelSide, string> = {
  left: '[class*="_Sidebar--left_"]',
  right: '[class*="_Sidebar--right_"]',
}

const initialPanelState = (side: FloatingPanelSide): PanelState => ({
  mode: 'docked',
  geometry: {
    x: 0,
    y: 0,
    width: side === 'left' ? 280 : 333,
    height: 600,
  },
  hasFloated: false,
})

const sameGeometry = (left: FloatingPanelGeometry, right: FloatingPanelGeometry) =>
  left.x === right.x &&
  left.y === right.y &&
  left.width === right.width &&
  left.height === right.height

function panelBounds(workspace: HTMLElement) {
  return getFloatingPanelBounds(
    workspace.getBoundingClientRect(),
    window.innerWidth,
    window.innerHeight,
  )
}

function applyPanelPresentation(
  element: HTMLElement,
  side: FloatingPanelSide,
  panel: PanelState,
  isActive: boolean,
) {
  element.dataset.tiliPanelSide = side
  element.dataset.tiliPanelMode = panel.mode
  element.dataset.tiliPanelActive = isActive ? 'true' : 'false'
  element.style.setProperty('--tili-floating-panel-x', `${panel.geometry.x}px`)
  element.style.setProperty('--tili-floating-panel-y', `${panel.geometry.y}px`)
  element.style.setProperty('--tili-floating-panel-width', `${panel.geometry.width}px`)
  element.style.setProperty('--tili-floating-panel-height', `${panel.geometry.height}px`)

  return () => {
    delete element.dataset.tiliPanelSide
    delete element.dataset.tiliPanelMode
    delete element.dataset.tiliPanelActive
    element.style.removeProperty('--tili-floating-panel-x')
    element.style.removeProperty('--tili-floating-panel-y')
    element.style.removeProperty('--tili-floating-panel-width')
    element.style.removeProperty('--tili-floating-panel-height')
  }
}

function PanelIcon({ mode }: { mode: PanelMode }) {
  return mode === 'docked' ? (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <rect x="2.5" y="4.5" width="8" height="8" rx="1" />
      <path d="M7 2.5h6.5V9M13.5 2.5 8 8" />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <rect x="2.5" y="2.5" width="11" height="11" rx="1" />
      <path d="M6 2.5v11M10 8 7.5 5.5M10 8l-2.5 2.5" />
    </svg>
  )
}

type PanelChromeProps = {
  side: FloatingPanelSide
  mode: PanelMode
  onModeChange: () => void
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerEnd: (event: ReactPointerEvent<HTMLDivElement>) => void
  t: Translate
}

const panelTitle = (side: FloatingPanelSide, t: Translate) =>
  t(side === 'left' ? 'leftPanelTitle' : 'rightPanelTitle')

function PanelChrome({
  side,
  mode,
  onModeChange,
  onPointerDown,
  onPointerMove,
  onPointerEnd,
  t,
}: PanelChromeProps) {
  const sideLabel = panelTitle(side, t)
  const actionLabel = t(mode === 'docked' ? 'undockPanel' : 'dockPanel', { panel: sideLabel })

  return (
    <div
      className="document-editor__panel-chrome"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onLostPointerCapture={onPointerEnd}
    >
      <span className="document-editor__panel-title">{sideLabel}</span>
      <button
        type="button"
        className="document-editor__panel-mode-button"
        aria-label={actionLabel}
        title={actionLabel}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={onModeChange}
      >
        <PanelIcon mode={mode} />
        <span>{t(mode === 'docked' ? 'undock' : 'dock')}</span>
      </button>
    </div>
  )
}

export function FloatingSidePanels({ workspaceRef }: FloatingSidePanelsProps) {
  const t = useTranslation()
  const [panels, setPanels] = useState<Record<FloatingPanelSide, PanelState>>(() => ({
    left: initialPanelState('left'),
    right: initialPanelState('right'),
  }))
  const [sidebars, setSidebars] = useState<Record<FloatingPanelSide, SidebarTarget>>({
    left: { element: null, visible: false },
    right: { element: null, visible: false },
  })
  const [topPanel, setTopPanel] = useState<FloatingPanelSide>('right')
  const pointerOperation = useRef<PointerOperation | undefined>(undefined)
  const previousBodyStyles = useRef<{ cursor: string; userSelect: string } | undefined>(undefined)

  const finishPointerOperation = useCallback(() => {
    pointerOperation.current = undefined
    if (!previousBodyStyles.current) return

    document.body.style.cursor = previousBodyStyles.current.cursor
    document.body.style.userSelect = previousBodyStyles.current.userSelect
    previousBodyStyles.current = undefined
  }, [])

  useEffect(() => finishPointerOperation, [finishPointerOperation])

  useEffect(() => {
    const workspace = workspaceRef.current
    if (!workspace) return

    const discoverSidebars = () => {
      setSidebars((current) => {
        const leftElement = workspace.querySelector<HTMLElement>(sidebarSelectors.left)
        const rightElement = workspace.querySelector<HTMLElement>(sidebarSelectors.right)
        const next = {
          left: {
            element: leftElement,
            visible: leftElement?.className.includes('Sidebar--isVisible') ?? false,
          },
          right: {
            element: rightElement,
            visible: rightElement?.className.includes('Sidebar--isVisible') ?? false,
          },
        }

        return current.left.element === next.left.element &&
          current.left.visible === next.left.visible &&
          current.right.element === next.right.element &&
          current.right.visible === next.right.visible
          ? current
          : next
      })
    }

    discoverSidebars()
    const observer = new MutationObserver(discoverSidebars)
    observer.observe(workspace, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [workspaceRef])

  useEffect(() => {
    const workspace = workspaceRef.current
    if (!workspace) return

    workspace.dataset.tiliLeftPanelMode = panels.left.mode
    workspace.dataset.tiliRightPanelMode = panels.right.mode

    return () => {
      delete workspace.dataset.tiliLeftPanelMode
      delete workspace.dataset.tiliRightPanelMode
    }
  }, [panels.left.mode, panels.right.mode, workspaceRef])

  useLayoutEffect(() => {
    const cleanups: Array<() => void> = []

    for (const side of ['left', 'right'] as const) {
      const element = sidebars[side].element
      if (!element) continue

      cleanups.push(applyPanelPresentation(element, side, panels[side], topPanel === side))
    }

    return () => cleanups.forEach((cleanup) => cleanup())
  }, [panels, sidebars, topPanel])

  useEffect(() => {
    const cleanups: Array<() => void> = []

    for (const side of ['left', 'right'] as const) {
      const element = sidebars[side].element
      if (!element) continue

      const bringToFront = () => {
        if (panels[side].mode === 'floating') setTopPanel(side)
      }
      element.addEventListener('pointerdown', bringToFront)
      cleanups.push(() => element.removeEventListener('pointerdown', bringToFront))
    }

    return () => cleanups.forEach((cleanup) => cleanup())
  }, [panels, sidebars])

  const keepPanelsInBounds = useCallback(() => {
    const workspace = workspaceRef.current
    if (!workspace) return
    const bounds = panelBounds(workspace)

    setPanels((current) => {
      let changed = false
      const next = { ...current }

      for (const side of ['left', 'right'] as const) {
        if (current[side].mode !== 'floating') continue
        const geometry = fitFloatingPanelToBounds(current[side].geometry, bounds)
        if (!sameGeometry(geometry, current[side].geometry)) {
          next[side] = { ...current[side], geometry }
          changed = true
        }
      }

      return changed ? next : current
    })
  }, [workspaceRef])

  useEffect(() => {
    const workspace = workspaceRef.current
    if (!workspace) return

    window.addEventListener('resize', keepPanelsInBounds)
    const resizeObserver = new ResizeObserver(keepPanelsInBounds)
    resizeObserver.observe(workspace)

    return () => {
      window.removeEventListener('resize', keepPanelsInBounds)
      resizeObserver.disconnect()
    }
  }, [keepPanelsInBounds, workspaceRef])

  const setPanelMode = useCallback(
    (side: FloatingPanelSide, mode: PanelMode) => {
      const workspace = workspaceRef.current
      const sidebar = sidebars[side].element
      if (!workspace || !sidebar) return

      setPanels((current) => {
        const panel = current[side]
        if (panel.mode === mode) return current

        const bounds = panelBounds(workspace)
        const geometry =
          mode === 'floating'
            ? panel.hasFloated
              ? fitFloatingPanelToBounds(panel.geometry, bounds)
              : createInitialFloatingPanelGeometry(side, sidebar.getBoundingClientRect(), bounds)
            : panel.geometry

        return {
          ...current,
          [side]: {
            mode,
            geometry,
            hasFloated: panel.hasFloated || mode === 'floating',
          },
        }
      })
      if (mode === 'floating') setTopPanel(side)
    },
    [sidebars, workspaceRef],
  )

  const startPointerOperation = useCallback(
    (
      event: ReactPointerEvent<HTMLElement>,
      side: FloatingPanelSide,
      kind: PointerOperation['kind'],
    ) => {
      if (event.button !== 0 || panels[side].mode !== 'floating') return

      pointerOperation.current = {
        side,
        kind,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startGeometry: panels[side].geometry,
      }
      previousBodyStyles.current = {
        cursor: document.body.style.cursor,
        userSelect: document.body.style.userSelect,
      }
      document.body.style.cursor = kind === 'move' ? 'grabbing' : 'nwse-resize'
      document.body.style.userSelect = 'none'
      event.currentTarget.setPointerCapture(event.pointerId)
      setTopPanel(side)
      event.preventDefault()
    },
    [panels],
  )

  const updatePointerOperation = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const operation = pointerOperation.current
      const workspace = workspaceRef.current
      if (!operation || operation.pointerId !== event.pointerId || !workspace) return

      const deltaX = event.clientX - operation.startX
      const deltaY = event.clientY - operation.startY
      const bounds = panelBounds(workspace)
      const geometry =
        operation.kind === 'move'
          ? moveFloatingPanel(
              operation.startGeometry,
              operation.startGeometry.x + deltaX,
              operation.startGeometry.y + deltaY,
              bounds,
            )
          : resizeFloatingPanel(
              operation.startGeometry,
              operation.startGeometry.width + deltaX,
              operation.startGeometry.height + deltaY,
              bounds,
            )

      setPanels((current) => ({
        ...current,
        [operation.side]: { ...current[operation.side], geometry },
      }))
    },
    [workspaceRef],
  )

  const endPointerOperation = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (pointerOperation.current?.pointerId !== event.pointerId) return
      finishPointerOperation()
    },
    [finishPointerOperation],
  )

  const resizeWithKeyboard = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, side: FloatingPanelSide) => {
      const delta = event.shiftKey ? 32 : 16
      const deltaWidth = event.key === 'ArrowRight' ? delta : event.key === 'ArrowLeft' ? -delta : 0
      const deltaHeight = event.key === 'ArrowDown' ? delta : event.key === 'ArrowUp' ? -delta : 0
      if (deltaWidth === 0 && deltaHeight === 0) return

      const workspace = workspaceRef.current
      if (!workspace) return
      event.preventDefault()
      const bounds = panelBounds(workspace)
      setPanels((current) => {
        const panel = current[side]
        return {
          ...current,
          [side]: {
            ...panel,
            geometry: resizeFloatingPanel(
              panel.geometry,
              panel.geometry.width + deltaWidth,
              panel.geometry.height + deltaHeight,
              bounds,
            ),
          },
        }
      })
      setTopPanel(side)
    },
    [workspaceRef],
  )

  const chrome = (side: FloatingPanelSide) => {
    const target = sidebars[side].element
    if (!target) return null
    const panel = panels[side]

    return createPortal(
      <PanelChrome
        side={side}
        mode={panel.mode}
        onModeChange={() => setPanelMode(side, panel.mode === 'docked' ? 'floating' : 'docked')}
        onPointerDown={(event) => startPointerOperation(event, side, 'move')}
        onPointerMove={updatePointerOperation}
        onPointerEnd={endPointerOperation}
        t={t}
      />,
      target,
    )
  }

  const resizeHandle = (side: FloatingPanelSide) => {
    const panel = panels[side]
    if (panel.mode !== 'floating' || !sidebars[side].visible) return null

    return createPortal(
      <button
        type="button"
        className="document-editor__floating-panel-resize"
        aria-label={t('resizePanel', { panel: panelTitle(side, t) })}
        title={t('resizePanelHint')}
        style={{
          left: panel.geometry.x + panel.geometry.width - 18,
          top: panel.geometry.y + panel.geometry.height - 18,
          zIndex: topPanel === side ? 5003 : 5001,
        }}
        onPointerDown={(event) => startPointerOperation(event, side, 'resize')}
        onPointerMove={updatePointerOperation}
        onPointerUp={endPointerOperation}
        onPointerCancel={endPointerOperation}
        onLostPointerCapture={endPointerOperation}
        onKeyDown={(event) => resizeWithKeyboard(event, side)}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M6 13h7V6M9 13l4-4M12 13l1-1" />
        </svg>
      </button>,
      document.body,
    )
  }

  return (
    <>
      {chrome('left')}
      {chrome('right')}
      {resizeHandle('left')}
      {resizeHandle('right')}
    </>
  )
}
