import type { Meta, StoryObj } from '@storybook/react-vite'
import '../../App.css'
import { NoticeBlock } from './NoticeBlock'

const meta = {
  title: 'CommsPliant/Blocks/Important Notice',
  component: NoticeBlock,
} satisfies Meta<typeof NoticeBlock>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    heading: 'Important notice',
    text: 'Add important information here.',
  },
}

export const ActionRequired: Story = {
  args: {
    heading: 'Action required',
    text: 'Please review the information in this letter and contact us if you have any questions.',
  },
}

export const LongNotice: Story = {
  args: {
    heading: 'Important information about this change',
    text: 'This notice contains additional detail for pagination inspection. Please read it alongside the rest of the letter, retain it for your records, and contact our support team if you need help understanding what this means for you.',
  },
}
