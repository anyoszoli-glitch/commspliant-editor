import type {
  AiAssistantAction,
  AiAssistantBlockContext,
  AiAssistantContext,
  AiAssistantRequest,
  AiAssistantSuggestion,
  AiAssistantSuggestionAction,
} from '../../editor/aiAssistant'

type AiAssistantPanelProps = {
  context: AiAssistantContext
  onContextChange: (context: AiAssistantContext) => void
  selectedText?: string
  blockContext?: AiAssistantBlockContext
  suggestion?: AiAssistantSuggestion
  onRequest?: (request: AiAssistantRequest) => void
  onSuggestionAction?: (action: AiAssistantSuggestionAction, suggestion: AiAssistantSuggestion) => void
}

const contexts: Array<{ value: AiAssistantContext; label: string }> = [
  { value: 'selection', label: 'Selection' },
  { value: 'block', label: 'Block' },
  { value: 'document', label: 'Document' },
]

const actions: Array<{ value: AiAssistantAction; label: string }> = [
  { value: 'rewrite', label: 'Rewrite' },
  { value: 'shorten', label: 'Shorten' },
  { value: 'plain-english', label: 'Plain English' },
  { value: 'improve-clarity', label: 'Improve clarity' },
  { value: 'change-tone', label: 'Change tone' },
]

function contextDescription(
  context: AiAssistantContext,
  selectedText?: string,
  blockContext?: AiAssistantBlockContext,
) {
  if (context === 'selection') {
    return selectedText
      ? `Selected text: “${selectedText}”`
      : 'Select text in the document to prepare a selection.'
  }

  if (context === 'block') {
    return blockContext
      ? `Current block ${blockContext.index + 1}${blockContext.zone ? ` · ${blockContext.zone}` : ''}`
      : 'Select a block in the document to prepare a block context.'
  }

  return 'The complete document will be available to the host AI service.'
}

export function AiAssistantPanel({
  context,
  onContextChange,
  selectedText,
  blockContext,
  suggestion,
  onRequest,
  onSuggestionAction,
}: AiAssistantPanelProps) {
  const canRequest = Boolean(onRequest) && (context !== 'selection' || Boolean(selectedText))

  const requestAction = (action: AiAssistantAction) => {
    if (!onRequest || !canRequest) return

    onRequest({
      action,
      context,
      selectedText: context === 'selection' ? selectedText : undefined,
      block: context === 'block' ? blockContext : undefined,
    })
  }

  const applySuggestionAction = (action: AiAssistantSuggestionAction) => {
    if (suggestion && onSuggestionAction) onSuggestionAction(action, suggestion)
  }

  return (
    <div className="document-editor__ai-panel" role="region" aria-label="AI Assistant">
      <div
        className="document-editor__ai-context-switch"
        role="tablist"
        aria-label="AI context"
      >
        {contexts.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={context === value}
            onClick={() => onContextChange(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="document-editor__ai-context-description">
        {contextDescription(context, selectedText, blockContext)}
      </p>

      <section className="document-editor__ai-section" aria-labelledby="ai-actions-heading">
        <h3 id="ai-actions-heading">Actions</h3>
        <div className="document-editor__ai-actions">
          {actions.map(({ value, label }) => (
            <button key={value} type="button" disabled={!canRequest} onClick={() => requestAction(value)}>
              {label}
            </button>
          ))}
          <button type="button" disabled={!canRequest} onClick={() => requestAction('ask')}>
            Ask AI...
          </button>
        </div>
        {!onRequest && <p className="document-editor__ai-hint">AI actions will be enabled when the host connects a handler.</p>}
      </section>

      <section className="document-editor__ai-section" aria-labelledby="ai-suggestion-heading">
        <h3 id="ai-suggestion-heading">Suggestion</h3>
        <div className="document-editor__ai-suggestion-grid">
          <div className="document-editor__ai-suggestion-card">
            <h4>Original</h4>
            <p>{suggestion?.original ?? 'No suggestion yet.'}</p>
          </div>
          <div className="document-editor__ai-suggestion-card">
            <h4>Suggested</h4>
            <p>{suggestion?.suggested ?? 'No suggestion yet.'}</p>
          </div>
        </div>
        <div className="document-editor__ai-suggestion-actions">
          <button type="button" disabled={!suggestion || !onSuggestionAction} onClick={() => applySuggestionAction('reject')}>
            Reject
          </button>
          <button type="button" disabled={!suggestion || !onSuggestionAction} onClick={() => applySuggestionAction('accept')}>
            Accept
          </button>
        </div>
      </section>
    </div>
  )
}
