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

export const MixedFormatting: Story = {
  args: {
    text: (
      <p>
        This paragraph contains <strong>bold</strong>, <em>italic</em>, and <u>underlined</u>{' '}
        text.
      </p>
    ),
  },
}

export const BulletList: Story = {
  args: {
    text: (
      <ul>
        <li>First important point</li>
        <li>Second important point</li>
      </ul>
    ),
  },
}

export const NumberedList: Story = {
  args: {
    text: (
      <ol>
        <li>Review the communication</li>
        <li>Confirm the next step</li>
      </ol>
    ),
  },
}

export const Link: Story = {
  args: {
    text: (
      <p>
        Read the <a href="https://example.com">supporting guidance</a>.
      </p>
    ),
  },
}

export const VariableAndLiteralBraces: Story = {
  args: {
    text: (
      <p>
        Dear <span className="commspliant-variable-token">Customer name</span>, literal {'{{customerName}}'}
      </p>
    ),
  },
}
