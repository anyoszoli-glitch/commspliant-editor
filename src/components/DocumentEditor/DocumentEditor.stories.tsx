import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import '../../App.css'
import {
  createDocument,
  defaultFluidLayout,
  defaultPagedLayout,
  type DocumentData,
  type DocumentLayout,
} from '../../document/document'
import { DocumentEditor, type DocumentEditorProps } from './DocumentEditor'

const storyTimestamp = '2026-08-30T09:00:00.000Z'

const populatedContent: DocumentData['content'] = [
  {
    type: 'HeadingBlock',
    props: { id: 'heading-introduction', text: 'Important changes to your account' },
  },
  {
    type: 'TextBlock',
    props: {
      id: 'text-greeting',
      text: 'Dear Andrea,\n\nWe are writing to let you know about an upcoming change to your account. This letter explains what is changing, when it will happen, and where you can find help if you need it.',
    },
  },
  {
    type: 'HeadingBlock',
    props: { id: 'heading-change', text: 'What is changing' },
  },
  {
    type: 'TextBlock',
    props: {
      id: 'text-change',
      text: 'From 1 October 2026, the monthly service fee will change. Your existing services will continue as normal, and there is nothing you need to do to keep your account open.',
    },
  },
  {
    type: 'TextBlock',
    props: {
      id: 'text-details',
      text: 'The new fee will appear on your first statement after the effective date. Any other charges, discounts, or credits that apply to your account will continue to be shown separately on your statement.',
    },
  },
  {
    type: 'HeadingBlock',
    props: { id: 'heading-support', text: 'Questions and support' },
  },
  {
    type: 'TextBlock',
    props: {
      id: 'text-support',
      text: 'If you have questions, please contact our support team through the usual channel. We will be happy to explain the change, review your account, and help you understand your options.',
    },
  },
]

const noticeContent: DocumentData['content'] = [
  ...populatedContent.slice(0, 2),
  {
    type: 'NoticeBlock',
    props: {
      id: 'notice-important-change',
      heading: 'Important notice',
      text: 'Please read this information carefully before the change takes effect.',
    },
  },
  ...populatedContent.slice(2),
]

const longContent: DocumentData['content'] = [
  ...populatedContent,
  {
    type: 'PageBreakBlock',
    props: { id: 'page-break-next-steps' },
  },
  {
    type: 'HeadingBlock',
    props: { id: 'heading-next-steps', text: 'Next steps' },
  },
  ...[
    'Please keep this letter for your records. The information on the following pages gives more detail about the timing of the change and the support available to you.',
    'Your account remains active during this change. You can continue to use your existing services, view your statements, and manage your preferences in the usual way.',
    'We aim to make our notices clear and useful. If any part of this letter is difficult to understand, please get in touch and tell us which section you would like us to explain.',
    'Thank you for continuing to use our service. We appreciate your business and look forward to supporting you in the future.',
  ].map((text, index) => ({
    type: 'TextBlock' as const,
    props: { id: `text-next-steps-${index + 1}`, text },
  })),
]

function createStoryDocument(
  layout: DocumentLayout = defaultPagedLayout,
  content: DocumentData['content'] = populatedContent,
) {
  const document = createDocument('storybook-populated-document', layout, {
    name: 'Fee Change Letter',
    description: 'Customer notice for the 2026 fee update',
    now: storyTimestamp,
  })

  return { ...document, data: { ...document.data, content } }
}

function DocumentEditorStory(args: DocumentEditorProps) {
  const [document, setDocument] = useState(args.value)

  return (
    <DocumentEditor
      {...args}
      value={document}
      onChange={setDocument}
      onDocumentNameChange={
        args.onDocumentNameChange ? (name) => setDocument((current) => ({ ...current, name })) : undefined
      }
      onDocumentDescriptionChange={
        args.onDocumentDescriptionChange
          ? (description) => setDocument((current) => ({ ...current, description }))
          : undefined
      }
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
    value: createDocument('storybook-document'),
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

export const EditableDescriptionEmpty: Story = {
  args: {
    value: createDocument('storybook-empty-description', defaultPagedLayout, {
      name: 'Fee Change Letter',
      now: storyTimestamp,
    }),
    onDocumentDescriptionChange: () => undefined,
  },
}

export const EditableDescriptionPopulated: Story = {
  args: {
    value: createStoryDocument(),
    onDocumentDescriptionChange: () => undefined,
  },
}

export const PopulatedPagedA4: Story = {
  args: {
    value: createStoryDocument(),
  },
}

export const PopulatedFluid: Story = {
  args: {
    value: createStoryDocument(defaultFluidLayout),
  },
}

export const NoticePagedA4: Story = {
  args: {
    value: createStoryDocument(defaultPagedLayout, noticeContent),
  },
}

export const NoticeFluid: Story = {
  args: {
    value: createStoryDocument(defaultFluidLayout, noticeContent),
  },
}

export const PagedLayoutSettings: Story = {
  args: {
    value: createDocument('storybook-paged-layout-settings', {
      ...defaultPagedLayout,
      margins: { top: 24, right: 18, bottom: 22, left: 26, unit: 'mm' },
    }),
  },
}

export const FluidLayoutSettings: Story = {
  args: {
    value: createDocument('storybook-fluid-layout-settings', {
      ...defaultFluidLayout,
      maxWidth: { value: 760, unit: 'px' },
    }),
  },
}

export const LongPagedDocument: Story = {
  args: {
    value: createStoryDocument(defaultPagedLayout, longContent),
  },
}

export const SaveDraftAction: Story = {
  args: {
    value: createStoryDocument(),
    onSave: () => undefined,
  },
}
