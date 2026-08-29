import type { Meta, StoryObj } from '@storybook/react-vite'
import { TextBlock } from './TextBlock'

const meta = {
  title: 'CommsPliant/Blocks/Text',
  component: TextBlock,
} satisfies Meta<typeof TextBlock>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    text: 'This is a customer communication text block.',
  },
}