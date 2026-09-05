import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { createRoot, type Root } from 'react-dom/client'
import { useState } from 'react'
import type { AiAssistantModelOption, AiAssistantRequest } from '../../editor/aiAssistant'
import { createTranslator } from '../../i18n'
import { AiAssistantPanel } from './AiAssistantPanel'

let root: Root | undefined
let container: HTMLDivElement | undefined

function mountPanel({
  modelsConfigured = false,
  models = [],
  onRequest = vi.fn<(request: AiAssistantRequest) => void>(),
}: {
  modelsConfigured?: boolean
  models?: readonly AiAssistantModelOption[]
  onRequest?: ReturnType<typeof vi.fn<(request: AiAssistantRequest) => void>>
} = {}) {
  container = document.createElement('div')
  document.body.append(container)

  function Harness() {
    const [selectedModelId, setSelectedModelId] = useState(models[0]?.id)

    return (
      <AiAssistantPanel
        context="document"
        onContextChange={() => undefined}
        modelsConfigured={modelsConfigured}
        models={models}
        selectedModelId={selectedModelId}
        onSelectedModelIdChange={setSelectedModelId}
        onRequest={onRequest}
        t={createTranslator()}
      />
    )
  }

  root = createRoot(container)
  root.render(<Harness />)
  return onRequest
}

afterEach(() => {
  root?.unmount()
  container?.remove()
  root = undefined
  container = undefined
})

describe('AI Assistant model selector', () => {
  it('preserves the legacy request when models are omitted', async () => {
    const onRequest = mountPanel()

    await expect.element(page.getByRole('combobox', { name: 'AI tool' })).not.toBeInTheDocument()
    await userEvent.click(page.getByRole('button', { name: 'Rewrite' }))

    expect(onRequest).toHaveBeenCalledWith({
      action: 'rewrite', context: 'document', selectedText: undefined, block: undefined,
    })
    expect(onRequest.mock.calls[0]?.[0]).not.toHaveProperty('modelId')
  })

  it('shows the unconfigured state and prevents requests without valid models', async () => {
    const onRequest = mountPanel({ modelsConfigured: true })

    await expect.element(page.getByText('No AI tools configured.')).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Rewrite' })).toBeDisabled()
    expect(onRequest).not.toHaveBeenCalled()
  })

  it('selects the only configured model and sends its ID', async () => {
    const onRequest = mountPanel({
      modelsConfigured: true,
      models: [{ id: 'writing', displayName: 'Writing helper' }],
    })

    const selector = page.getByRole('combobox', { name: 'AI tool' })
    await expect.element(selector).toHaveValue('writing')
    await expect.element(page.getByRole('option', { name: 'Writing helper' })).toBeInTheDocument()
    await userEvent.click(page.getByRole('button', { name: 'Rewrite' }))

    expect(onRequest).toHaveBeenCalledWith(expect.objectContaining({ modelId: 'writing' }))
  })

  it('uses the changed option ID for later requests', async () => {
    const onRequest = mountPanel({
      modelsConfigured: true,
      models: [
        { id: 'writing', displayName: 'Writing helper' },
        { id: 'review', displayName: 'Compliance reviewer' },
      ],
    })

    const selector = page.getByRole('combobox', { name: 'AI tool' })
    await expect.element(selector).toHaveValue('writing')
    await userEvent.selectOptions(selector, 'review')
    await expect.element(selector).toHaveValue('review')
    await userEvent.click(page.getByRole('button', { name: 'Shorten' }))

    expect(onRequest).toHaveBeenCalledWith(expect.objectContaining({ modelId: 'review' }))
  })
})
