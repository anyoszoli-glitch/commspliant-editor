import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Puck, type Viewports } from '@puckeditor/core'
import '@puckeditor/core/puck.css'
import '../../App.css'

import {
  changeDocumentLayout,
  defaultFluidLayout,
  defaultPagedLayout,
  type DocumentData,
  type DocumentLayout,
  type FluidDocumentLayout,
  type PagedDocumentLayout,
  type LetterDocument,
} from '../../document/document'
import { createEditorConfig } from '../../editor/editorConfig'
import { BlockPickerItem } from './BlockPickerItem'
import { LayoutSettings } from './LayoutSettings'
import { BackgroundSettings } from './BackgroundSettings'
import { AiAssistantPanel } from './AiAssistantPanel'
import type {
  AiAssistantContext,
  AiAssistantRequest,
  AiAssistantSuggestion,
  AiAssistantSuggestionAction,
} from '../../editor/aiAssistant'
import {
  normalizeVariableDefinitions,
  type VariableDefinition,
  type VariablePreviewValues,
} from '../../editor/variables'

export type { VariableDefinition, VariablePreviewValues } from '../../editor/variables'
export type {
  AiAssistantAction,
  AiAssistantBlockContext,
  AiAssistantContext,
  AiAssistantRequest,
  AiAssistantSuggestion,
  AiAssistantSuggestionAction,
} from '../../editor/aiAssistant'

const emptyPreviewValues: VariablePreviewValues = {}

// Puck's default desktop viewport is 1280px wide, which is appropriate for a web page but
// makes a fixed A4 document unnecessarily small. Keep a slim canvas frame around the page
// while allowing Puck's supported auto-zoom behaviour to fit it to the available workspace.
const A4_WIDTH_PX = (210 / 25.4) * 96
const DOCUMENT_VIEWPORT_GUTTER_PX = 24
const pagedDocumentViewports: Viewports = [
  {
    width: Math.round(A4_WIDTH_PX + DOCUMENT_VIEWPORT_GUTTER_PX),
    height: 'auto',
    icon: 'Monitor',
    label: 'Document page',
  },
]

export type CommsPliantEditorProps = {
  document: LetterDocument
  onChange: (document: LetterDocument) => void
  onSave?: (document: LetterDocument) => void
  variableDefinitions?: readonly VariableDefinition[]
  previewValues?: VariablePreviewValues
  height?: string
  onAiRequest?: (request: AiAssistantRequest) => void
  aiSuggestion?: AiAssistantSuggestion
  onAiSuggestionAction?: (action: AiAssistantSuggestionAction, suggestion: AiAssistantSuggestion) => void
}

export function CommsPliantEditor({
  document,
  onChange,
  onSave,
  variableDefinitions = [],
  previewValues,
  height = '100vh',
  onAiRequest,
  aiSuggestion,
  onAiSuggestionAction,
}: CommsPliantEditorProps) {
  const [isPreview, setIsPreview] = useState(false)
  const [previewRevision, setPreviewRevision] = useState(0)
  const [isBackgroundSettingsOpen, setIsBackgroundSettingsOpen] = useState(false)
  const [rightSidebarMode, setRightSidebarMode] = useState<'properties' | 'assistant'>('properties')
  const [aiContext, setAiContext] = useState<AiAssistantContext>('document')
  const [selectedText, setSelectedText] = useState<string>()
  const previousPreviewValues = useRef(previewValues)
  const layoutSwitchRef = useRef<HTMLDivElement>(null)
  const layoutFocusMode = useRef<DocumentLayout['mode'] | undefined>(undefined)
  const handleRichTextAiRequest = useCallback((text: string) => {
    setSelectedText(text)
    setAiContext('selection')
    setRightSidebarMode('assistant')
  }, [])
  const validVariableDefinitions = useMemo(
    () => normalizeVariableDefinitions(variableDefinitions),
    [variableDefinitions],
  )
  const documentViewports = useMemo<Viewports>(
    () =>
      document.layout.mode === 'paged'
        ? pagedDocumentViewports
        : [
            {
              width: document.layout.maxWidth.value + DOCUMENT_VIEWPORT_GUTTER_PX,
              height: 'auto',
              icon: 'Monitor',
              label: 'Fluid document',
            },
          ],
    [document.layout],
  )
  const currentData = useRef<DocumentData>(document.data)
  const lastPagedLayout = useRef<PagedDocumentLayout>(
    document.layout.mode === 'paged' ? document.layout : defaultPagedLayout,
  )
  const lastFluidLayout = useRef<FluidDocumentLayout>(
    document.layout.mode === 'fluid' ? document.layout : defaultFluidLayout,
  )
  const config = useMemo(
    () =>
      createEditorConfig(
        document.layout,
        document.backgroundImage,
        validVariableDefinitions,
        isPreview,
        previewValues ?? emptyPreviewValues,
        handleRichTextAiRequest,
      ),
    [
      document.layout,
      document.backgroundImage,
      isPreview,
      previewValues,
      validVariableDefinitions,
      handleRichTextAiRequest,
    ],
  )

  useEffect(() => {
    currentData.current = document.data
    if (document.layout.mode === 'paged') lastPagedLayout.current = document.layout
    if (document.layout.mode === 'fluid') lastFluidLayout.current = document.layout
  }, [document])

  useEffect(() => {
    const previewValuesChanged = previousPreviewValues.current !== previewValues
    previousPreviewValues.current = previewValues

    if (isPreview && previewValues === undefined) {
      setIsPreview(false)
      setPreviewRevision((revision) => revision + 1)
    } else if (previewValuesChanged) {
      setPreviewRevision((revision) => revision + 1)
    }
  }, [isPreview, previewValues])

  const togglePreview = (nextPreview: boolean) => {
    if (nextPreview && previewValues === undefined) return
    if (nextPreview === isPreview) return
    setIsPreview(nextPreview)
    setPreviewRevision((revision) => revision + 1)
  }

  const selectLayout = (mode: DocumentLayout['mode']) => {
    if (isPreview) return
    if (mode === document.layout.mode) return
    if (document.layout.mode === 'paged') lastPagedLayout.current = document.layout
    if (document.layout.mode === 'fluid') lastFluidLayout.current = document.layout

    onChange(
      changeDocumentLayout(
        { ...document, data: currentData.current },
        mode,
        lastPagedLayout.current,
        lastFluidLayout.current,
      ),
    )
  }

  const handleLayoutKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (isPreview) return

    const nextMode =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 'fluid'
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? 'paged'
          : event.key === 'Home'
            ? 'paged'
            : event.key === 'End'
              ? 'fluid'
              : undefined

    if (nextMode === undefined) return

    event.preventDefault()
    if (nextMode !== document.layout.mode) layoutFocusMode.current = nextMode
    selectLayout(nextMode)
  }

  const setLayoutSwitchRef = (element: HTMLDivElement | null) => {
    layoutSwitchRef.current = element
    if (element === null || layoutFocusMode.current !== document.layout.mode) return

    const requestedMode = layoutFocusMode.current
    requestAnimationFrame(() => {
      if (layoutFocusMode.current !== requestedMode) return

      layoutSwitchRef.current
        ?.querySelector<HTMLButtonElement>(`[data-layout-mode="${requestedMode}"]`)
        ?.focus()
      layoutFocusMode.current = undefined
    })
  }

  const updateLayout = (layout: DocumentLayout) => {
    if (isPreview) return
    if (layout.mode === 'paged') lastPagedLayout.current = layout
    if (layout.mode === 'fluid') lastFluidLayout.current = layout
    onChange({ ...document, data: currentData.current, layout })
  }

  return (
    <div className="document-editor">
      <Puck
        key={`${document.id}-${document.layout.mode}-${previewRevision}`}
        config={config}
        data={currentData.current}
        dictionary={{ 'header-publish': 'Save draft' }}
        height={height}
        viewports={documentViewports}
        permissions={isPreview ? { drag: false, duplicate: false, delete: false, edit: false, insert: false } : undefined}
        overrides={{
          drawerItem: ({ name }) => <BlockPickerItem name={name} />,
          fields: ({ children, itemSelector }) => (
            <>
              <div
                className="document-editor__sidebar-mode-switch"
                role="tablist"
                aria-label="Sidebar mode"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={rightSidebarMode === 'properties'}
                  onClick={() => setRightSidebarMode('properties')}
                >
                  Properties
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={rightSidebarMode === 'assistant'}
                  onClick={() => setRightSidebarMode('assistant')}
                >
                  ✨ AI Assistant
                </button>
              </div>
              {rightSidebarMode === 'properties' ? (
                children
              ) : (
                <AiAssistantPanel
                  context={aiContext}
                  onContextChange={setAiContext}
                  selectedText={selectedText}
                  blockContext={itemSelector ?? undefined}
                  suggestion={aiSuggestion}
                  onRequest={onAiRequest}
                  onSuggestionAction={onAiSuggestionAction}
                />
              )}
            </>
          ),
          headerActions: ({ children }) => (
            <div className="document-editor__header-actions">
              {previewValues !== undefined && (
                <div className="document-editor__preview-toggle" aria-label="Variable presentation">
                  <button type="button" aria-pressed={!isPreview} onClick={() => togglePreview(false)}>
                    Author
                  </button>
                  <button type="button" aria-pressed={isPreview} onClick={() => togglePreview(true)}>
                    Preview
                  </button>
                </div>
              )}
              <div className="document-editor__layout-controls">
                <div className="document-editor__layout-switch" ref={setLayoutSwitchRef}>
                  <span id="document-layout-label">Layout:</span>
                  <div
                    className="document-editor__layout-segmented-control"
                    role="radiogroup"
                    aria-labelledby="document-layout-label"
                  >
                    <button
                      type="button"
                      role="radio"
                      data-layout-mode="paged"
                      aria-checked={document.layout.mode === 'paged'}
                      tabIndex={document.layout.mode === 'paged' ? 0 : -1}
                      onClick={() => selectLayout('paged')}
                      onKeyDown={handleLayoutKeyDown}
                      disabled={isPreview}
                    >
                      Paged / A4
                    </button>
                    <button
                      type="button"
                      role="radio"
                      data-layout-mode="fluid"
                      aria-checked={document.layout.mode === 'fluid'}
                      tabIndex={document.layout.mode === 'fluid' ? 0 : -1}
                      onClick={() => selectLayout('fluid')}
                      onKeyDown={handleLayoutKeyDown}
                      disabled={isPreview}
                    >
                      Fluid
                    </button>
                  </div>
                </div>
                <div className="document-editor__settings-controls">
                  <LayoutSettings layout={document.layout} onChange={updateLayout} disabled={isPreview} />
                  <BackgroundSettings
                    image={document.backgroundImage}
                    open={isBackgroundSettingsOpen}
                    onOpenChange={setIsBackgroundSettingsOpen}
                    disabled={isPreview}
                    onChange={(backgroundImage) =>
                      onChange({
                        ...document,
                        data: currentData.current,
                        backgroundImage,
                      })
                    }
                  />
                </div>
              </div>
              {children}
            </div>
          ),
        }}
        onChange={(data) => {
          if (isPreview) return
          currentData.current = data
          onChange({ ...document, data })
        }}
        onPublish={(data) => {
          currentData.current = data
          const savedDocument = { ...document, data }
          onChange(savedDocument)
          onSave?.(savedDocument)
        }}
      />
    </div>
  )
}
