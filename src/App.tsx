import { useState } from 'react'
import { DocumentEditor } from './components/DocumentEditor/DocumentEditor'
import { loadDocument, saveDocument } from './document/documentStorage'
import './App.css'

const variableDefinitions = [{ key: 'customerName', label: 'Customer name' }]

function App() {
  const [document, setDocument] = useState(loadDocument)

  return (
    <DocumentEditor
      value={document}
      variableDefinitions={variableDefinitions}
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
