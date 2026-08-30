import type { Meta, StoryObj } from '@storybook/react-vite'
import { DocumentEditor } from './DocumentEditor'

const meta = {
  title: 'CommsPliant/Editor/Document Editor',
  component: DocumentEditor,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof DocumentEditor>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
