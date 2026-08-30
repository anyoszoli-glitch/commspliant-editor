import { useMemo, useRef, useState } from 'react'
import { Puck } from '@puckeditor/core'
import '@puckeditor/core/puck.css'

import { loadDocument, saveDocument } from '../../document/documentStorage'
import {
  changeDocumentLayout,
  defaultFluidLayout,
  defaultPagedLayout,
  type DocumentData,
  type DocumentLayout,
  type FluidDocumentLayout,
  type PagedDocumentLayout,
} from '../../document/document'
import { createEditorConfig } from '../../editor/editorConfig'
import { BlockPickerItem } from './BlockPickerItem'

export function DocumentEditor() {
  const [document, setDocument] = useState(loadDocument)
  const currentData = useRef<DocumentData>(document.data)
  const lastPagedLayout = useRef<PagedDocumentLayout>(
    document.layout.mode === 'paged' ? document.layout : defaultPagedLayout,
  )
  const lastFluidLayout = useRef<FluidDocumentLayout>(
    document.layout.mode === 'fluid' ? document.layout : defaultFluidLayout,
  )
  const config = useMemo(() => createEditorConfig(document.layout), [document.layout])

  const selectLayout = (mode: DocumentLayout['mode']) => {
    if (mode === document.layout.mode) return
    if (document.layout.mode === 'paged') lastPagedLayout.current = document.layout
    if (document.layout.mode === 'fluid') lastFluidLayout.current = document.layout

    setDocument((currentDocument) =>
      changeDocumentLayout(
        { ...currentDocument, data: currentData.current },
        mode,
        lastPagedLayout.current,
        lastFluidLayout.current,
      ),
    )
  }

  return (
    <div className="document-editor">
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
      <Puck
        key={document.layout.mode}
        config={config}
        data={document.data}
        height="calc(100vh - 57px)"
        headerTitle="CommsPliant document editor"
        overrides={{
          drawerItem: ({ name }) => <BlockPickerItem name={name} />,
        }}
        onChange={(data) => {
          currentData.current = data
        }}
        onPublish={(data) => {
          currentData.current = data
          const savedDocument = { ...document, data }
          saveDocument(savedDocument)
          setDocument(savedDocument)
        }}
      />
    </div>
  )
}
