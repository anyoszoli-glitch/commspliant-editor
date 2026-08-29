import type { Meta, StoryObj } from '@storybook/react-vite'
import { HeadingBlock } from './HeadingBlock'

const meta = {
  title: 'CommsPliant/Blocks/Heading',
  component: HeadingBlock,
} satisfies Meta<typeof HeadingBlock>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    text: 'Important information about your account',
  },
}