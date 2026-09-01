# Tili-Toli editor

Tili-Toli is a controlled React editor for the CommsPliant shared document contract. This repository contains two deliberately separate deliverables:

- the standalone demo at <https://anyoszoli-glitch.github.io/commspliant-editor/>;
- the reusable `@commspliant/tili-toli-editor` package.

The standalone demo supplies its own light-blue identity header and local browser persistence. Those features are not part of the reusable package.

## Install the reusable package

Install the next GitHub release tarball (recommended):

```sh
npm install https://github.com/anyoszoli-glitch/commspliant-editor/releases/download/v0.2.0/commspliant-tili-toli-editor-0.2.0.tgz
```

The repository tag can also be installed directly:

```sh
npm install github:anyoszoli-glitch/commspliant-editor#v0.2.0
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

The packaged Tili-Toli logo is visible and non-clickable by default. A host may opt into a link
with `logoHref`; only the standalone demo supplies `https://commspliant.com`.

Optional variable authoring and preview values are supplied by the host:

```tsx
<CommsPliantEditor
  document={document}
  onChange={setDocument}
  variableDefinitions={[{ key: 'customerName', label: 'Customer name' }]}
  previewValues={{ customerName: 'Andrea' }}
/>
```

The reusable editor also exposes an AI Assistant frontend shell. It is intentionally provider-neutral:

```tsx
<CommsPliantEditor
  document={document}
  onChange={setDocument}
  onAiRequest={(request) => hostAiService.request(request)}
  aiSuggestion={suggestion}
  onAiSuggestionAction={(action, currentSuggestion) => {
    hostSuggestionWorkflow.handle(action, currentSuggestion)
  }}
/>
```

`onAiRequest` receives an `AiAssistantRequest` containing the selected context, action, and
available selection or block context. `aiSuggestion` supplies host-generated `original` and
`suggested` text for the comparison area; `onAiSuggestionAction` receives `accept` or `reject`.
Without these optional host callbacks, the AI actions remain disabled placeholders and the
editor makes no AI or network calls. The contextual sparkle control in rich-text editing opens
the Assistant in Selection mode when text is selected.

The existing editor functionality remains part of this package build, including typography
marks (font family, preset or custom text colour, preset or custom highlight, strikethrough),
line spacing, alignment, clear formatting, Table/Divider/Spacer blocks, independent page
background colour and image settings, dynamic page numbering, related styles, serialization
support, and public types.
Import `@commspliant/tili-toli-editor/styles.css` as shown above; no standalone branding assets
are required.

## Supported shared-contract API

The package root exports:

- `CommsPliantEditor` and `CommsPliantEditorProps`;
- `AiAssistantRequest`, `AiAssistantSuggestion`, and the related AI context/action types;
- `LetterDocument` and all nested document/layout/rich-text contract types;
- `DocumentBackgroundColour`, `DocumentBackgroundImage`, and
  `isDocumentBackgroundColour` for page appearance integration;
- `PageNumbering` and `isPageNumbering` for the optional paged-layout footer format;
- `DOCUMENT_SCHEMA_VERSION`;
- `isLetterDocument` for runtime boundary validation;
- `createDocument` for creating a valid empty document;
- `VariableDefinition` and `VariablePreviewValues`.

Consumers should validate untrusted JSON with `isLetterDocument` before passing it to the editor.

The schema remains version 5. Its supported Puck content now includes `TableBlock`,
`DividerBlock`, and `SpacerBlock` alongside the original blocks. Table content is plain-text
cell data (`TableData`), and spacer values use `SpacerSize`. Rich-text typography is stored in
the existing rich-text value as marks (`fontFamily`, `textColour`, `textHighlight`) and paragraph
attributes (`lineSpacing`), so no standalone presentation store is required.
Page colour is stored as the optional `LetterDocument.backgroundColour` six-digit hex value.
It is independent from `backgroundImage`; image opacity affects only the image layer.
For paged documents, optional `PagedDocumentLayout.pageNumbering` supports `none`,
`page-number`, `page-number-of-total`, `number`, and `number-of-total`. Missing values remain
backward-compatible and render no footer. Current and total page values are generated by the
editor pagination result rather than stored in document content.

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
