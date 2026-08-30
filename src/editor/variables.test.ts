import { describe, expect, it } from 'vitest'
import { createConstrainedRichTextField } from './editorConfig'
import { VariableNode } from './VariableNode'
import { normalizeVariableDefinitions } from './variables'

describe('inline variables', () => {
  it('keeps valid unique definitions and excludes invalid or duplicate keys', () => {
    expect(
      normalizeVariableDefinitions([
        { key: 'customerName', label: 'Customer name' },
        { key: 'account_1', label: 'Account' },
        { key: '1invalid', label: 'Invalid' },
        { key: 'customerName', label: 'Duplicate' },
        { key: 'empty', label: '   ' },
      ]),
    ).toEqual([
      { key: 'customerName', label: 'Customer name' },
      { key: 'account_1', label: 'Account' },
    ])
  })

  it('registers the shared atomic variable extension in constrained rich text', () => {
    const field = createConstrainedRichTextField([{ key: 'customerName', label: 'Customer name' }])

    expect(field.tiptap?.extensions?.[0].name).toBe('variable')
    expect(VariableNode.name).toBe('variable')
  })
})
