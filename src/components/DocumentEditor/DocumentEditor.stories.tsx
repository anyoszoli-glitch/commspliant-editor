import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import '../../App.css'
import { createDocument } from '../../document/document'
import { DocumentEditor, type DocumentEditorProps } from './DocumentEditor'

function DocumentEditorStory(args: DocumentEditorProps) {
  const [document, setDocument] = useState(args.document)
  const [documentName, setDocumentName] = useState(args.documentName)

  return (
    <DocumentEditor
      {...args}
      document={document}
      documentName={documentName}
      onChange={setDocument}
      onDocumentNameChange={args.onDocumentNameChange ? setDocumentName : undefined}
    />
  )
}

const meta = {
  title: 'CommsPliant/Editor/Document Editor',
  component: DocumentEditor,
  parameters: {
    layout: 'fullscreen',
  },
  render: (args) => <DocumentEditorStory {...args} />,
  args: {
    document: createDocument('storybook-document'),
    documentName: 'Fee Change Letter',
    description: 'Customer notice for the 2026 fee update',
    onChange: () => undefined,
    onSave: () => undefined,
  },
} satisfies Meta<typeof DocumentEditor>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const EditableName: Story = {
  args: {
    onDocumentNameChange: () => undefined,
  },
}
