import { useState } from 'react'
import { DocumentEditor } from './components/DocumentEditor/DocumentEditor'
import { loadDocument, saveDocument } from './document/documentStorage'
import './App.css'

function App() {
  const [document, setDocument] = useState(loadDocument)

  return (
    <DocumentEditor
      document={document}
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
