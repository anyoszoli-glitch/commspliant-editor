# Tili-Toli editor

Tili-Toli is a controlled React editor for the CommsPliant shared document contract. This repository contains two deliberately separate deliverables:

- the standalone demo at <https://anyoszoli-glitch.github.io/commspliant-editor/>;
- the reusable `@commspliant/tili-toli-editor` package.

The standalone demo supplies its own white identity header and local browser persistence. Those features are not part of the reusable package.

## Install the reusable package

Install the pinned GitHub release tarball (recommended):

```sh
npm install https://github.com/anyoszoli-glitch/commspliant-editor/releases/download/v0.1.0/commspliant-tili-toli-editor-0.1.0.tgz
```

The repository tag can also be installed directly:

```sh
npm install github:anyoszoli-glitch/commspliant-editor#v0.1.0
```

The package is distributed from this repository, not from a public npm registry.

## Use the editor

Import the component, its stylesheet, and the shared contract type:

```tsx
import { useState } from 'react'
import {
  CommsPliantEditor,
  type LetterDocument,
} from '@commspliant/tili-toli-editor'
import '@commspliant/tili-toli-editor/styles.css'

type EditorScreenProps = {
  initialDocument: LetterDocument
  saveDocument: (document: LetterDocument) => void | Promise<void>
}

export function EditorScreen({ initialDocument, saveDocument }: EditorScreenProps) {
  const [document, setDocument] = useState(initialDocument)

  return (
    <CommsPliantEditor
      document={document}
      onChange={setDocument}
      onSave={saveDocument}
      height="calc(100vh - 64px)"
    />
  )
}
```

`document` is the complete shared-contract JSON value. `onChange` receives the complete updated value after edits. `onSave` is called by the editor's **Save draft** action. The optional `height` prop defaults to `100vh`.

Optional variable authoring and preview values are supplied by the host:

```tsx
<CommsPliantEditor
  document={document}
  onChange={setDocument}
  variableDefinitions={[{ key: 'customerName', label: 'Customer name' }]}
  previewValues={{ customerName: 'Andrea' }}
/>
```

## Supported shared-contract API

The package root exports:

- `CommsPliantEditor` and `CommsPliantEditorProps`;
- `LetterDocument` and all nested document/layout/rich-text contract types;
- `DOCUMENT_SCHEMA_VERSION`;
- `isLetterDocument` for runtime boundary validation;
- `createDocument` for creating a valid empty document;
- `VariableDefinition` and `VariablePreviewValues`.

Consumers should validate untrusted JSON with `isLetterDocument` before passing it to the editor.

## Responsibility boundary

Tili-Toli owns only this exchange:

```text
shared document contract JSON
        ↓
Tili-Toli editor
        ↓
edited shared document contract JSON
```

The host application owns persistence, authentication, tenancy, datasets, preview orchestration, document generation/rendering, approvals, Vault, audit workflow, routing, and all surrounding application UI.

The reusable package does not import the standalone `App`, identity header, localStorage adapter, routing, or demo infrastructure.

## Local development

```sh
npm ci
npm run test
npm run typecheck
npm run build
npm run build:package
npm pack
```

The standalone app remains the Vite entry in `src/main.tsx`. The reusable package entry is `src/CommsPliantEditor.ts`.
