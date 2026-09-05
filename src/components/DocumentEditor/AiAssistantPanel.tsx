import { useId } from 'react'
import type {
  AiAssistantAction,
  AiAssistantBlockContext,
  AiAssistantContext,
  AiAssistantModelOption,
  AiAssistantRequest,
  AiAssistantSuggestion,
  AiAssistantSuggestionAction,
} from '../../editor/aiAssistant'
import type { Translate } from '../../i18n'

type AiAssistantPanelProps = {
  context: AiAssistantContext
  onContextChange: (context: AiAssistantContext) => void
  selectedText?: string
  blockContext?: AiAssistantBlockContext
  modelsConfigured: boolean
  models: readonly AiAssistantModelOption[]
  selectedModelId?: string
  onSelectedModelIdChange: (modelId: string) => void
  suggestion?: AiAssistantSuggestion
  onRequest?: (request: AiAssistantRequest) => void
  onSuggestionAction?: (action: AiAssistantSuggestionAction, suggestion: AiAssistantSuggestion) => void
  t: Translate
}

function contextDescription(
  context: AiAssistantContext,
  t: Translate,
  selectedText?: string,
  blockContext?: AiAssistantBlockContext,
) {
  if (context === 'selection') {
    return selectedText
      ? t('selectedText', { text: selectedText })
      : t('selectTextForAi')
  }

  if (context === 'block') {
    return blockContext
      ? t('currentBlock', { index: blockContext.index + 1, zone: blockContext.zone ? ` · ${blockContext.zone}` : '' })
      : t('selectBlockForAi')
  }

  return t('aiDocumentContext')
}

export function AiAssistantPanel({
  context,
  onContextChange,
  selectedText,
  blockContext,
  modelsConfigured,
  models,
  selectedModelId,
  onSelectedModelIdChange,
  suggestion,
  onRequest,
  onSuggestionAction,
  t,
}: AiAssistantPanelProps) {
  const modelSelectId = useId()
  const contexts: Array<{ value: AiAssistantContext; label: string }> = [
    { value: 'selection', label: t('selection') }, { value: 'block', label: t('block') }, { value: 'document', label: t('document') },
  ]
  const actions: Array<{ value: AiAssistantAction; label: string }> = [
    { value: 'rewrite', label: t('rewrite') }, { value: 'shorten', label: t('shorten') }, { value: 'plain-english', label: t('plainEnglish') }, { value: 'improve-clarity', label: t('improveClarity') }, { value: 'change-tone', label: t('changeTone') },
  ]
  const hasSelectedModel = models.some((model) => model.id === selectedModelId)
  const canRequest =
    Boolean(onRequest) &&
    (!modelsConfigured || hasSelectedModel) &&
    (context !== 'selection' || Boolean(selectedText))

  const requestAction = (action: AiAssistantAction) => {
    if (!onRequest || !canRequest) return

    onRequest({
      action,
      context,
      selectedText: context === 'selection' ? selectedText : undefined,
      block: context === 'block' ? blockContext : undefined,
      ...(modelsConfigured && hasSelectedModel && selectedModelId ? { modelId: selectedModelId } : {}),
    })
  }

  const applySuggestionAction = (action: AiAssistantSuggestionAction) => {
    if (suggestion && onSuggestionAction) onSuggestionAction(action, suggestion)
  }

  return (
    <div className="document-editor__ai-panel" role="region" aria-label={t('aiAssistant')}>
      {modelsConfigured && (
        models.length > 0 ? (
          <div className="document-editor__ai-model-field">
            <label htmlFor={modelSelectId}>{t('aiTool')}</label>
            <select
              id={modelSelectId}
              className="document-editor__ai-model-select"
              value={selectedModelId ?? ''}
              onChange={(event) => onSelectedModelIdChange(event.currentTarget.value)}
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>{model.displayName}</option>
              ))}
            </select>
          </div>
        ) : (
          <p className="document-editor__ai-hint" role="status">{t('aiToolsUnconfigured')}</p>
        )
      )}
      <div
        className="document-editor__ai-context-switch"
        role="tablist"
        aria-label={t('aiContext')}
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
        {contextDescription(context, t, selectedText, blockContext)}
      </p>

      <section className="document-editor__ai-section" aria-labelledby="ai-actions-heading">
        <h3 id="ai-actions-heading">{t('actions')}</h3>
        <div className="document-editor__ai-actions">
          {actions.map(({ value, label }) => (
            <button key={value} type="button" disabled={!canRequest} onClick={() => requestAction(value)}>
              {label}
            </button>
          ))}
          <button type="button" disabled={!canRequest} onClick={() => requestAction('ask')}>
            {t('askAi')}
          </button>
        </div>
        {!onRequest && <p className="document-editor__ai-hint">{t('aiHostHint')}</p>}
      </section>

      <section className="document-editor__ai-section" aria-labelledby="ai-suggestion-heading">
        <h3 id="ai-suggestion-heading">{t('suggestion')}</h3>
        <div className="document-editor__ai-suggestion-grid">
          <div className="document-editor__ai-suggestion-card">
            <h4>{t('original')}</h4>
            <p>{suggestion?.original ?? t('noSuggestion')}</p>
          </div>
          <div className="document-editor__ai-suggestion-card">
            <h4>{t('suggested')}</h4>
            <p>{suggestion?.suggested ?? t('noSuggestion')}</p>
          </div>
        </div>
        <div className="document-editor__ai-suggestion-actions">
          <button type="button" disabled={!suggestion || !onSuggestionAction} onClick={() => applySuggestionAction('reject')}>
            {t('reject')}
          </button>
          <button type="button" disabled={!suggestion || !onSuggestionAction} onClick={() => applySuggestionAction('accept')}>
            {t('accept')}
          </button>
        </div>
      </section>
    </div>
  )
}
