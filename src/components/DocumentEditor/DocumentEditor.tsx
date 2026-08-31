import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Puck } from '@puckeditor/core'
import '@puckeditor/core/puck.css'

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
import { DocumentIdentity, type DocumentIdentityProps } from './DocumentIdentity'
import { LayoutSettings } from './LayoutSettings'
import {
  normalizeVariableDefinitions,
  type VariableDefinition,
  type VariablePreviewValues,
} from '../../editor/variables'

export type { VariableDefinition, VariablePreviewValues } from '../../editor/variables'

const emptyPreviewValues: VariablePreviewValues = {}

export type DocumentEditorProps = Omit<
  DocumentIdentityProps,
  'documentName' | 'description' | 'status'
> & {
  value: LetterDocument
  onChange: (document: LetterDocument) => void
  onSave?: (document: LetterDocument) => void
  variableDefinitions?: readonly VariableDefinition[]
  previewValues?: VariablePreviewValues
}

export function DocumentEditor({
  value,
  onDocumentNameChange,
  onDocumentDescriptionChange,
  onChange,
  onSave,
  variableDefinitions = [],
  previewValues,
}: DocumentEditorProps) {
  const document = value
  const [isPreview, setIsPreview] = useState(false)
  const [previewRevision, setPreviewRevision] = useState(0)
  const previousPreviewValues = useRef(previewValues)
  const layoutSwitchRef = useRef<HTMLDivElement>(null)
  const layoutFocusMode = useRef<DocumentLayout['mode'] | undefined>(undefined)
  const validVariableDefinitions = useMemo(
    () => normalizeVariableDefinitions(variableDefinitions),
    [variableDefinitions],
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
      ),
    [document.layout, document.backgroundImage, isPreview, previewValues, validVariableDefinitions],
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
      <div className="document-editor__topbar">
        <DocumentIdentity
          documentName={document.name}
          description={document.description}
          onDocumentNameChange={isPreview ? undefined : onDocumentNameChange}
          onDocumentDescriptionChange={isPreview ? undefined : onDocumentDescriptionChange}
          status={document.status}
        />
      </div>
      <Puck
        key={`${document.layout.mode}-${previewRevision}`}
        config={config}
        data={currentData.current}
        dictionary={{ 'header-publish': 'Save draft' }}
        height="calc(100vh - 64px)"
        permissions={isPreview ? { drag: false, duplicate: false, delete: false, edit: false, insert: false } : undefined}
        overrides={{
          drawerItem: ({ name }) => <BlockPickerItem name={name} />,
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
                  <span id="document-layout-label">Document layout:</span>
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
                <LayoutSettings layout={document.layout} onChange={updateLayout} disabled={isPreview} />
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
