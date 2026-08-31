import { useState } from 'react'
import { CommsPliantEditor } from './CommsPliantEditor'
import { DocumentIdentity } from './components/DocumentEditor/DocumentIdentity'
import { loadDocument, saveDocument } from './document/documentStorage'
import './App.css'

const variableDefinitions = [
  { key: 'customerName', label: 'Customer name' },
  { key: 'missingValue', label: 'Missing value' },
  { key: 'emptyValue', label: 'Empty value' },
  { key: 'htmlValue', label: 'HTML-like value' },
]
const previewValues = {
  customerName: 'Andrea',
  emptyValue: '',
  htmlValue: '<img src=x onerror=alert(1)>',
}

function App() {
  const [document, setDocument] = useState(loadDocument)

  return (
    <>
      <div className="document-editor__topbar">
        <DocumentIdentity
          documentName={document.name}
          description={document.description}
          onDocumentNameChange={(name) => setDocument((current) => ({ ...current, name }))}
          onDocumentDescriptionChange={(description) =>
            setDocument((current) => ({ ...current, description }))
          }
          status={document.status}
        />
      </div>
      <CommsPliantEditor
        document={document}
        variableDefinitions={variableDefinitions}
        previewValues={previewValues}
        height="calc(100vh - 64px)"
        onChange={setDocument}
        onSave={(savedDocument) => {
          setDocument(saveDocument(savedDocument))
        }}
      />
    </>
  )
}

export default App
