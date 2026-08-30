import { useEffect, useMemo, useRef } from 'react'
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

export type DocumentEditorProps = Omit<
  DocumentIdentityProps,
  'documentName' | 'description' | 'status'
> & {
  document: LetterDocument
  onChange: (document: LetterDocument) => void
  onSave?: (document: LetterDocument) => void
}

export function DocumentEditor({
  document,
  onDocumentNameChange,
  onDocumentDescriptionChange,
  onChange,
  onSave,
}: DocumentEditorProps) {
  const currentData = useRef<DocumentData>(document.data)
  const lastPagedLayout = useRef<PagedDocumentLayout>(
    document.layout.mode === 'paged' ? document.layout : defaultPagedLayout,
  )
  const lastFluidLayout = useRef<FluidDocumentLayout>(
    document.layout.mode === 'fluid' ? document.layout : defaultFluidLayout,
  )
  const config = useMemo(() => createEditorConfig(document.layout), [document.layout])

  useEffect(() => {
    currentData.current = document.data
    if (document.layout.mode === 'paged') lastPagedLayout.current = document.layout
    if (document.layout.mode === 'fluid') lastFluidLayout.current = document.layout
  }, [document])

  const selectLayout = (mode: DocumentLayout['mode']) => {
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

  return (
    <div className="document-editor">
      <div className="document-editor__topbar">
        <DocumentIdentity
          documentName={document.name}
          description={document.description}
          onDocumentNameChange={onDocumentNameChange}
          onDocumentDescriptionChange={onDocumentDescriptionChange}
          status={document.status}
        />
      </div>
      <Puck
        key={document.layout.mode}
        config={config}
        data={document.data}
        dictionary={{ 'header-publish': 'Save draft' }}
        height="calc(100vh - 64px)"
        overrides={{
          drawerItem: ({ name }) => <BlockPickerItem name={name} />,
          headerActions: ({ children }) => (
            <div className="document-editor__header-actions">
              <div className="document-editor__layout-switch" aria-label="Document layout">
                <span>Document layout:</span>
                <button
                  type="button"
                  aria-pressed={document.layout.mode === 'paged'}
                  onClick={() => selectLayout('paged')}
                >
                  Paged / A4
                </button>
                <button
                  type="button"
                  aria-pressed={document.layout.mode === 'fluid'}
                  onClick={() => selectLayout('fluid')}
                >
                  Fluid
                </button>
              </div>
              {children}
            </div>
          ),
        }}
        onChange={(data) => {
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
