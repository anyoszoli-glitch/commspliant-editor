import { useState } from 'react'
import { DocumentEditor } from './components/DocumentEditor/DocumentEditor'
import { loadDocument, loadDocumentName, saveDocument, saveDocumentName } from './document/documentStorage'
import './App.css'

function App() {
  const [document, setDocument] = useState(loadDocument)
  const [documentName, setDocumentName] = useState(loadDocumentName)

  return (
    <DocumentEditor
      document={document}
      documentName={documentName}
      onDocumentNameChange={setDocumentName}
      onChange={setDocument}
      onSave={(savedDocument) => {
        saveDocument(savedDocument)
        saveDocumentName(documentName)
      }}
    />
  )
}

export default App
