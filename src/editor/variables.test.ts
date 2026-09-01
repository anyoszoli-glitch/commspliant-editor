import { describe, expect, it } from 'vitest'
import { createConstrainedRichTextField } from './editorConfig'
import { VariableNode } from './VariableNode'
import { normalizeVariableDefinitions, resolveVariable } from './variables'

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

    expect(field.tiptap?.extensions?.some((extension) => extension.name === 'variable')).toBe(true)
    expect(VariableNode.name).toBe('variable')
  })

  it('resolves known definitions with supplied values, including an empty string', () => {
    const definitions = [{ key: 'customerName', label: 'Customer name' }]

    expect(resolveVariable('customerName', definitions, { customerName: 'Andrea' })).toEqual({
      status: 'resolved',
      definition: definitions[0],
      value: 'Andrea',
    })
    expect(resolveVariable('customerName', definitions, { customerName: '' })).toEqual({
      status: 'resolved',
      definition: definitions[0],
      value: '',
    })
  })

  it('keeps missing and unknown variables distinct', () => {
    const definitions = [{ key: 'customerName', label: 'Customer name' }]

    expect(resolveVariable('customerName', definitions, {})).toEqual({
      status: 'missing-value',
      definition: definitions[0],
    })
    expect(resolveVariable('oldVariable', definitions, { oldVariable: 'obsolete' })).toEqual({
      status: 'unknown-variable',
      key: 'oldVariable',
    })
    expect(resolveVariable('customerName', definitions, { unused: 'value' })).toEqual({
      status: 'missing-value',
      definition: definitions[0],
    })
  })
})
