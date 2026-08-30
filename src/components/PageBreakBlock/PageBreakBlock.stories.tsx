import type { Meta, StoryObj } from '@storybook/react-vite'
import { PageBreakBlock } from './PageBreakBlock'

const meta = {
  title: 'CommsPliant/Blocks/Page Break',
  component: PageBreakBlock,
} satisfies Meta<typeof PageBreakBlock>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
