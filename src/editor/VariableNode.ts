import { mergeAttributes, Node } from '@tiptap/core'
import { findVariableDefinition, type VariableDefinition } from './variables'

type VariableNodeOptions = {
  variableDefinitions: readonly VariableDefinition[]
}

export const VariableNode = Node.create<VariableNodeOptions>({
  name: 'variable',
  inline: true,
  group: 'inline',
  atom: true,

  addOptions() {
    return { variableDefinitions: [] }
  },

  addAttributes() {
    return {
      key: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-commspliant-variable') ?? '',
        renderHTML: (attributes) => ({ 'data-commspliant-variable': attributes.key }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-commspliant-variable]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const key = String(HTMLAttributes['data-commspliant-variable'] ?? '')
    return [
      'span',
      mergeAttributes(HTMLAttributes),
      `{{${key}}}`,
    ]
  },

  addNodeView() {
    return ({ node }) => {
      const key = String(node.attrs.key ?? '')
      const definition = findVariableDefinition(this.options.variableDefinitions, key)
      const dom = document.createElement('span')

      dom.className = definition
        ? 'commspliant-variable-token'
        : 'commspliant-variable-token commspliant-variable-token--unknown'
      dom.contentEditable = 'false'
      dom.setAttribute('role', 'img')
      dom.setAttribute(
        'aria-label',
        definition ? `Variable: ${definition.label}` : `Unknown variable: ${key}`,
      )
      dom.textContent = definition ? definition.label : `Unknown variable: ${key}`

      return { dom }
    }
  },
})
