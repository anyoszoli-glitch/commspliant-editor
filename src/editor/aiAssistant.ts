export type AiAssistantContext = 'selection' | 'block' | 'document'

export type AiAssistantAction =
  | 'rewrite'
  | 'shorten'
  | 'plain-english'
  | 'improve-clarity'
  | 'change-tone'
  | 'ask'

export type AiAssistantBlockContext = {
  index: number
  zone?: string
}

export type AiAssistantModelOption = {
  id: string
  displayName: string
}

export type AiAssistantRequest = {
  action: AiAssistantAction
  context: AiAssistantContext
  selectedText?: string
  block?: AiAssistantBlockContext
  modelId?: string
}

export type AiAssistantSuggestion = {
  original: string
  suggested: string
}

export type AiAssistantSuggestionAction = 'accept' | 'reject'

export function normalizeAiAssistantModelOptions(
  models: readonly AiAssistantModelOption[] | undefined,
): AiAssistantModelOption[] {
  const normalized: AiAssistantModelOption[] = []
  const seenIds = new Set<string>()

  for (const model of models ?? []) {
    if (
      !model ||
      typeof model.id !== 'string' ||
      typeof model.displayName !== 'string' ||
      !model.id.trim() ||
      !model.displayName.trim() ||
      seenIds.has(model.id)
    ) {
      continue
    }

    seenIds.add(model.id)
    normalized.push({ id: model.id, displayName: model.displayName })
  }

  return normalized
}

export function resolveSelectedAiAssistantModelId(
  selectedModelId: string | undefined,
  models: readonly AiAssistantModelOption[],
): string | undefined {
  return models.some((model) => model.id === selectedModelId)
    ? selectedModelId
    : models[0]?.id
}
