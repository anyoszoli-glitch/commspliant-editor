# CommsPliant editor

The editor is exposed as a controlled React component. Its UI begins at the navy toolbar and includes the block/outline area, document canvas, and properties panel. Document identity and persistence belong to the host application.

```tsx
import { useState } from 'react'
import { CommsPliantEditor, type LetterDocument } from './src/CommsPliantEditor'

function EditorScreen({ initialDocument }: { initialDocument: LetterDocument }) {
  const [document, setDocument] = useState(initialDocument)

  return (
    <CommsPliantEditor
      document={document}
      onChange={setDocument}
      onSave={(updatedDocument) => saveDraft(updatedDocument)}
    />
  )
}
```

`onChange` receives the complete updated document after editor changes. `onSave` is called by the **Save draft** action; the component does not perform storage or API work itself. The optional `height` prop defaults to `100vh`.

The local Vite demo in `src/App.tsx` supplies the white document identity header and localStorage persistence around this component.
