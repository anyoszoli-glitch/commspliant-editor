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

export type AiAssistantRequest = {
  action: AiAssistantAction
  context: AiAssistantContext
  selectedText?: string
  block?: AiAssistantBlockContext
}

export type AiAssistantSuggestion = {
  original: string
  suggested: string
}

export type AiAssistantSuggestionAction = 'accept' | 'reject'
