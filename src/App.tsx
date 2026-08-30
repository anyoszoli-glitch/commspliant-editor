import { useState } from 'react'
import { DocumentEditor } from './components/DocumentEditor/DocumentEditor'
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
    <DocumentEditor
      value={document}
      variableDefinitions={variableDefinitions}
      previewValues={previewValues}
      onDocumentNameChange={(name) => setDocument((current) => ({ ...current, name }))}
      onDocumentDescriptionChange={(description) =>
        setDocument((current) => ({ ...current, description }))
      }
      onChange={setDocument}
      onSave={(savedDocument) => {
        setDocument(saveDocument(savedDocument))
      }}
    />
  )
}

export default App
