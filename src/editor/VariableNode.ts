import { mergeAttributes, Node } from '@tiptap/core'
import {
  findVariableDefinition,
  resolveVariable,
  type VariableDefinition,
  type VariablePreviewValues,
} from './variables'

type VariableNodeOptions = {
  variableDefinitions: readonly VariableDefinition[]
  previewEnabled: boolean
  previewValues: VariablePreviewValues
}

export const VariableNode = Node.create<VariableNodeOptions>({
  name: 'variable',
  inline: true,
  group: 'inline',
  atom: true,

  addOptions() {
    return { variableDefinitions: [], previewEnabled: false, previewValues: {} }
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
      const resolution = this.options.previewEnabled
        ? resolveVariable(key, this.options.variableDefinitions, this.options.previewValues)
        : undefined
      const dom = document.createElement('span')

      dom.className = [
        'commspliant-variable-token',
        !definition && 'commspliant-variable-token--unknown',
        resolution && 'commspliant-variable-token--preview',
      ]
        .filter(Boolean)
        .join(' ')
      dom.contentEditable = 'false'
      dom.setAttribute('role', 'img')

      if (!resolution) {
        dom.setAttribute('aria-label', definition ? `Variable: ${definition.label}` : `Unknown variable: ${key}`)
        dom.textContent = definition ? definition.label : `Unknown variable: ${key}`
      } else if (resolution.status === 'resolved') {
        const text = resolution.value || `[Empty: ${resolution.definition.label}]`
        dom.setAttribute('aria-label', text)
        dom.textContent = text
      } else if (resolution.status === 'missing-value') {
        const text = `[Missing: ${resolution.definition.label}]`
        dom.setAttribute('aria-label', text)
        dom.textContent = text
      } else {
        const text = `[Unknown variable: ${resolution.key}]`
        dom.setAttribute('aria-label', text)
        dom.textContent = text
      }

      return { dom }
    }
  },
})
