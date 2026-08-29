import { Puck, type Config } from '@puckeditor/core'
import '@puckeditor/core/puck.css'

import { HeadingBlock } from '../HeadingBlock/HeadingBlock'
import { TextBlock } from '../TextBlock/TextBlock'

type EditorComponents = {
  HeadingBlock: {
    text: string
  }
  TextBlock: {
    text: string
  }
}

const config: Config<EditorComponents> = {
  components: {
    HeadingBlock: {
      fields: {
        text: {
          type: 'text',
        },
      },
      defaultProps: {
        text: 'New heading',
      },
      render: ({ text }) => <HeadingBlock text={text} />,
    },

    TextBlock: {
      fields: {
        text: {
          type: 'textarea',
        },
      },
      defaultProps: {
        text: 'Write your text here.',
      },
      render: ({ text }) => <TextBlock text={text} />,
    },
  },
}

const initialData = {
  content: [],
  root: {},
}

export function DocumentEditor() {
  return (
    <Puck
      config={config}
      data={initialData}
      onPublish={(data) => {
        console.log('Document saved:', data)
      }}
    />
  )
}