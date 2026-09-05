import { describe, expect, it } from 'vitest'
import {
  normalizeAiAssistantModelOptions,
  resolveSelectedAiAssistantModelId,
  type AiAssistantModelOption,
} from './aiAssistant'

describe('AI Assistant model options', () => {
  it('ignores blank and duplicate options without changing the host data', () => {
    const models = [
      { id: 'writing', displayName: 'Writing helper' },
      { id: ' ', displayName: 'Blank ID' },
      { id: 'review', displayName: '  ' },
      { id: 'writing', displayName: 'Duplicate writing helper' },
      { id: 'review', displayName: 'Compliance reviewer' },
    ] satisfies readonly AiAssistantModelOption[]
    const original = models.map((model) => ({ ...model }))

    const normalized = normalizeAiAssistantModelOptions(models)

    expect(normalized).toEqual([
      { id: 'writing', displayName: 'Writing helper' },
      { id: 'review', displayName: 'Compliance reviewer' },
    ])
    expect(normalized[0]).not.toBe(models[0])
    expect(models).toEqual(original)
    expect(normalizeAiAssistantModelOptions([{ id: ' ', displayName: 'Unavailable' }])).toEqual([])
  })

  it('keeps a valid selection and otherwise selects the first available model', () => {
    const models = [
      { id: 'writing', displayName: 'Writing helper' },
      { id: 'review', displayName: 'Compliance reviewer' },
    ]

    expect(resolveSelectedAiAssistantModelId('review', models)).toBe('review')
    expect(resolveSelectedAiAssistantModelId('removed', models)).toBe('writing')
    expect(resolveSelectedAiAssistantModelId(undefined, models)).toBe('writing')
    expect(resolveSelectedAiAssistantModelId('review', [])).toBeUndefined()
  })
})
