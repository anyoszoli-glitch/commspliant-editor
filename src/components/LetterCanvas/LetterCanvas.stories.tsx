import type { Meta, StoryObj } from '@storybook/react-vite'
import { LetterCanvas } from './LetterCanvas'
import { HeadingBlock } from '../HeadingBlock/HeadingBlock'
import { TextBlock } from '../TextBlock/TextBlock'

const meta = {
  title: 'CommsPliant/Letter Canvas',
  component: LetterCanvas,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof LetterCanvas>

export default meta

type Story = StoryObj<typeof meta>

export const BlankLetter: Story = {
  args: {
    children: (
      <>
        <HeadingBlock text="Customer Letter" />
        <TextBlock text="Dear Andrea," />
<TextBlock text="This is our first CommsPliant letter." />
      </>
    ),
  },
}