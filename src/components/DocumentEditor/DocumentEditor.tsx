import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import {
  Puck,
  createUsePuck,
  type Config,
  type Overrides,
  type Plugin,
  type PuckAction,
  type Viewports,
} from '@puckeditor/core'
import '@puckeditor/core/puck.css'
import '../../App.css'

import {
  changeDocumentLayout,
  defaultFluidLayout,
  defaultPagedLayout,
  type DocumentData,
  type DocumentLayout,
  type EditorComponents,
  type FluidDocumentLayout,
  type PagedDocumentLayout,
  type LetterDocument,
} from '../../document/document'
import { createEditorConfig, DocumentAppearanceContext } from '../../editor/editorConfig'
import { BlockPickerItem } from './BlockPickerItem'
import { FloatingSidePanels } from './FloatingSidePanels'
import { LayoutSettings } from './LayoutSettings'
import { BackgroundSettings } from './BackgroundSettings'
import type { PageDescriptor } from '../DocumentCanvas/pagination'
import { AiAssistantPanel } from './AiAssistantPanel'
import { PageNavigator } from './PageNavigator'
import type { ImagePicker } from '../ImageBlock/imageTypes'
import { reorderPages } from './pageReordering'
import tiliToliEditorLogo from '../../assets/TiliToliEditorLogo.webp'
import {
  normalizeAiAssistantModelOptions,
  resolveSelectedAiAssistantModelId,
  type AiAssistantModelOption,
  type AiAssistantContext,
  type AiAssistantRequest,
  type AiAssistantSuggestion,
  type AiAssistantSuggestionAction,
} from '../../editor/aiAssistant'
import {
  normalizeVariableDefinitions,
  type VariableDefinition,
  type VariablePreviewValues,
} from '../../editor/variables'
import { I18nProvider, createPuckDictionary, normalizeLocale, type SupportedLocale, useTranslation } from '../../i18n'

export type { VariableDefinition, VariablePreviewValues } from '../../editor/variables'
export type {
  AiAssistantAction,
  AiAssistantBlockContext,
  AiAssistantContext,
  AiAssistantModelOption,
  AiAssistantRequest,
  AiAssistantSuggestion,
  AiAssistantSuggestionAction,
} from '../../editor/aiAssistant'
export type { ImagePicker, ImageSelection } from '../ImageBlock/imageTypes'

const emptyPreviewValues: VariablePreviewValues = {}
const emptyVariableDefinitions: readonly VariableDefinition[] = []

// Puck's default desktop viewport is 1280px wide, which is appropriate for a web page but
// makes a fixed A4 document unnecessarily small. Keep a slim canvas frame around the page
// while allowing Puck's supported auto-zoom behaviour to fit it to the available workspace.
const A4_WIDTH_PX = (210 / 25.4) * 96
const DOCUMENT_VIEWPORT_GUTTER_PX = 24
const useEditorPuck = createUsePuck<Config<EditorComponents>>()
type PageNavigatorPluginProps = {
  pages: PageDescriptor[]
  selectedPageId?: string
  onPageSelect: (pageId: string) => void
  onPageReorder: (fromIndex: number, toIndex: number, dispatch: (action: PuckAction) => void) => void
  t: ReturnType<typeof useTranslation>
}

function PageNavigatorPlugin({ onPageReorder, ...props }: PageNavigatorPluginProps) {
  const dispatch = useEditorPuck((puck) => puck.dispatch)

  return (
    <PageNavigator
      {...props}
      onPageReorder={(fromIndex, toIndex) => onPageReorder(fromIndex, toIndex, dispatch)}
    />
  )
}

export type CommsPliantEditorProps = {
  document: LetterDocument
  onChange: (document: LetterDocument) => void
  onSave?: (document: LetterDocument) => void
  variableDefinitions?: readonly VariableDefinition[]
  previewValues?: VariablePreviewValues
  height?: string
  aiModels?: readonly AiAssistantModelOption[]
  onAiRequest?: (request: AiAssistantRequest) => void
  aiSuggestion?: AiAssistantSuggestion
  onAiSuggestionAction?: (action: AiAssistantSuggestionAction, suggestion: AiAssistantSuggestion) => void
  logoHref?: string
  locale?: SupportedLocale
  imagePicker?: ImagePicker
  imagePickerActionLabel?: string
}

export function CommsPliantEditor({
  locale,
  ...props
}: CommsPliantEditorProps) {
  const activeLocale = normalizeLocale(locale as string | undefined)
  return <I18nProvider locale={activeLocale}><Editor {...props} activeLocale={activeLocale} /></I18nProvider>
}

function Editor({
  document,
  onChange,
  onSave,
  variableDefinitions = emptyVariableDefinitions,
  previewValues,
  height = '100vh',
  aiModels,
  onAiRequest,
  aiSuggestion,
  onAiSuggestionAction,
  logoHref,
  imagePicker,
  imagePickerActionLabel,
  activeLocale,
}: Omit<CommsPliantEditorProps, 'locale'> & { activeLocale: SupportedLocale }) {
  const t = useTranslation()
  const [isPreview, setIsPreview] = useState(false)
  const [previewRevision, setPreviewRevision] = useState(0)
  const [isBackgroundSettingsOpen, setIsBackgroundSettingsOpen] = useState(false)
  const [rightSidebarMode, setRightSidebarMode] = useState<'properties' | 'assistant'>('properties')
  const [aiContext, setAiContext] = useState<AiAssistantContext>('document')
  const [selectedText, setSelectedText] = useState<string>()
  const validAiModels = useMemo(() => normalizeAiAssistantModelOptions(aiModels), [aiModels])
  const [selectedAiModelId, setSelectedAiModelId] = useState<string | undefined>(
    () => validAiModels[0]?.id,
  )
  const [showMarginGuides, setShowMarginGuides] = useState(true)
  const [pagedPages, setPagedPages] = useState<PageDescriptor[]>([])
  const [selectedPageId, setSelectedPageId] = useState<string>()
  const pageSettingsChannel = useRef(`tili-toli-page-settings-${Math.random().toString(36).slice(2)}`)
  const workspaceRef = useRef<HTMLDivElement>(null)
  const previousPreviewValues = useRef(previewValues)
  const layoutSwitchRef = useRef<HTMLDivElement>(null)
  const layoutFocusMode = useRef<DocumentLayout['mode'] | undefined>(undefined)
  const handleRichTextAiRequest = useCallback((text: string) => {
    setSelectedText(text)
    setAiContext('selection')
    setRightSidebarMode('assistant')
  }, [])
  const handlePagesChange = useCallback((pages: PageDescriptor[]) => {
    setPagedPages((current) =>
      current.length === pages.length && current.every((page, index) =>
        page.id === pages[index]?.id &&
        page.blockIds?.join(',') === pages[index]?.blockIds?.join(','),
      )
        ? current
        : pages,
    )
  }, [])
  const handlePageSelect = useCallback((pageId: string) => {
    setSelectedPageId(pageId)
    const frame = globalThis.document.querySelector<HTMLIFrameElement>('.document-editor iframe')
    frame?.contentWindow?.postMessage(
      {
        type: 'tili-toli-page-settings',
        channel: pageSettingsChannel.current,
        action: 'select',
        pageId,
      },
      '*',
    )
    requestAnimationFrame(() => {
      frame?.contentDocument?.querySelector<HTMLElement>(`[data-document-page-id="${pageId}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])
  const handlePageReorder = useCallback((
    fromIndex: number,
    toIndex: number,
    dispatch: (action: PuckAction) => void,
  ) => {
    const currentDocument = documentRef.current
    if (currentDocument.layout.mode !== 'paged') return

    const result = reorderPages(
      currentData.current.content,
      pagedPages,
      fromIndex,
      toIndex,
      currentDocument.layout,
      selectedPageId,
    )
    if (!result) return

    const nextData = { ...currentData.current, content: result.content }
    const nextDocument = { ...currentDocument, data: nextData, layout: result.layout }
    currentData.current = nextData
    documentRef.current = nextDocument
    setSelectedPageId(result.activePageId)
    dispatch({ type: 'setData', data: nextData, recordHistory: true })
    requestAnimationFrame(() => {
      const frame = globalThis.document.querySelector<HTMLIFrameElement>('.document-editor iframe')
      frame?.contentDocument?.querySelector<HTMLElement>(`[data-document-page-id="${result.activePageId}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [pagedPages, selectedPageId])
  useEffect(() => {
    const handlePageSettingsMessage = (event: MessageEvent<unknown>) => {
      const message = event.data
      if (!message || typeof message !== 'object') return

      const pageMessage = message as {
        type?: unknown
        channel?: unknown
        action?: unknown
        pageId?: unknown
        pages?: unknown
      }
      if (
        pageMessage.type !== 'tili-toli-page-settings' ||
        pageMessage.channel !== pageSettingsChannel.current
      ) {
        return
      }

      if (pageMessage.action === 'select' && typeof pageMessage.pageId === 'string') {
        handlePageSelect(pageMessage.pageId)
      }
      if (
        pageMessage.action === 'pages' &&
        Array.isArray(pageMessage.pages) &&
        pageMessage.pages.every(
          (page): page is PageDescriptor =>
            !!page &&
            typeof page === 'object' &&
            typeof page.id === 'string' &&
            typeof page.number === 'number',
        )
      ) {
        handlePagesChange(pageMessage.pages)
      }
    }

    window.addEventListener('message', handlePageSettingsMessage)
    return () => window.removeEventListener('message', handlePageSettingsMessage)
  }, [handlePageSelect, handlePagesChange])
  const validVariableDefinitions = useMemo(
    () => normalizeVariableDefinitions(variableDefinitions),
    [variableDefinitions],
  )
  const documentViewports = useMemo<Viewports>(
    () =>
      document.layout.mode === 'paged'
        ? [
            {
              width: Math.round(A4_WIDTH_PX + DOCUMENT_VIEWPORT_GUTTER_PX),
              height: 'auto',
              icon: 'Monitor',
              label: t('documentPage'),
            },
          ]
        : [
            {
              width: document.layout.maxWidth.value + DOCUMENT_VIEWPORT_GUTTER_PX,
              height: 'auto',
              icon: 'Monitor',
              label: t('fluidDocument'),
            },
          ],
    [document.layout, t],
  )
  const currentData = useRef<DocumentData>(document.data)
  const documentRef = useRef(document)
  const onChangeRef = useRef(onChange)
  documentRef.current = document
  onChangeRef.current = onChange
  const documentAppearance = useMemo(
    () => ({
      backgroundImage: document.backgroundImage,
      backgroundColour: document.backgroundColour,
    }),
    [document.backgroundColour, document.backgroundImage],
  )
  const lastPagedLayout = useRef<PagedDocumentLayout>(
    document.layout.mode === 'paged' ? document.layout : defaultPagedLayout,
  )
  const lastFluidLayout = useRef<FluidDocumentLayout>(
    document.layout.mode === 'fluid' ? document.layout : defaultFluidLayout,
  )
  const config = useMemo(
    () =>
      createEditorConfig(
        document.layout,
        undefined,
        validVariableDefinitions,
        isPreview,
        previewValues ?? emptyPreviewValues,
        handleRichTextAiRequest,
        selectedPageId,
        handlePageSelect,
        handlePagesChange,
        pageSettingsChannel.current,
        showMarginGuides,
        t,
        imagePicker,
        imagePickerActionLabel,
      ),
    [
      document.layout,
      isPreview,
      previewValues,
      validVariableDefinitions,
      handleRichTextAiRequest,
      showMarginGuides,
      selectedPageId,
      handlePageSelect,
      handlePagesChange,
      t,
      imagePicker,
      imagePickerActionLabel,
    ],
  )

  useEffect(() => {
    currentData.current = document.data
    if (document.layout.mode === 'paged') lastPagedLayout.current = document.layout
    if (document.layout.mode === 'fluid') lastFluidLayout.current = document.layout
  }, [document])

  useEffect(() => {
    if (pagedPages.length === 0) return
    if (selectedPageId && pagedPages.some((page) => page.id === selectedPageId)) return

    setSelectedPageId(pagedPages[0].id)
  }, [pagedPages, selectedPageId])

  useEffect(() => {
    const previewValuesChanged = previousPreviewValues.current !== previewValues
    previousPreviewValues.current = previewValues

    if (isPreview && previewValues === undefined) {
      setIsPreview(false)
      setPreviewRevision((revision) => revision + 1)
    } else if (previewValuesChanged) {
      setPreviewRevision((revision) => revision + 1)
    }
  }, [isPreview, previewValues])

  useEffect(() => {
    setSelectedAiModelId((current) =>
      resolveSelectedAiAssistantModelId(current, validAiModels),
    )
  }, [validAiModels])

  const togglePreview = (nextPreview: boolean) => {
    if (nextPreview && previewValues === undefined) return
    if (nextPreview === isPreview) return
    setIsPreview(nextPreview)
    setPreviewRevision((revision) => revision + 1)
  }

  const selectLayout = (mode: DocumentLayout['mode']) => {
    const currentDocument = documentRef.current
    if (isPreview) return
    if (mode === currentDocument.layout.mode) return
    if (currentDocument.layout.mode === 'paged') lastPagedLayout.current = currentDocument.layout
    if (currentDocument.layout.mode === 'fluid') lastFluidLayout.current = currentDocument.layout

    onChangeRef.current(
      changeDocumentLayout(
        { ...currentDocument, data: currentData.current },
        mode,
        lastPagedLayout.current,
        lastFluidLayout.current,
      ),
    )
  }

  const handleLayoutKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (isPreview) return

    const nextMode =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 'fluid'
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? 'paged'
          : event.key === 'Home'
            ? 'paged'
            : event.key === 'End'
              ? 'fluid'
              : undefined

    if (nextMode === undefined) return

    event.preventDefault()
    if (nextMode !== document.layout.mode) layoutFocusMode.current = nextMode
    selectLayout(nextMode)
  }

  const setLayoutSwitchRef = (element: HTMLDivElement | null) => {
    layoutSwitchRef.current = element
    if (element === null || layoutFocusMode.current !== document.layout.mode) return

    const requestedMode = layoutFocusMode.current
    requestAnimationFrame(() => {
      if (layoutFocusMode.current !== requestedMode) return

      layoutSwitchRef.current
        ?.querySelector<HTMLButtonElement>(`[data-layout-mode="${requestedMode}"]`)
        ?.focus()
      layoutFocusMode.current = undefined
    })
  }

  const updateLayout = (layout: DocumentLayout) => {
    const currentDocument = documentRef.current
    if (isPreview) return
    if (layout.mode === 'paged') lastPagedLayout.current = layout
    if (layout.mode === 'fluid') lastFluidLayout.current = layout
    onChangeRef.current({ ...currentDocument, data: currentData.current, layout })
  }

  const puckOverrides = useMemo<Partial<Overrides<Config<EditorComponents>>>>(
    () => ({
      drawerItem: ({ name }) => <BlockPickerItem name={name} t={t} />,
      fields: ({ children, itemSelector }) => (
        <>
          <div
            className="document-editor__sidebar-mode-switch"
            role="tablist"
            aria-label={t('sidebarMode')}
          >
            <button
              type="button"
              role="tab"
              aria-selected={rightSidebarMode === 'properties'}
              onClick={() => setRightSidebarMode('properties')}
            >
              {t('properties')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={rightSidebarMode === 'assistant'}
              onClick={() => setRightSidebarMode('assistant')}
            >
              ✨ {t('aiAssistant')}
            </button>
          </div>
          {rightSidebarMode === 'properties' ? (
            children
          ) : (
              <AiAssistantPanel
                context={aiContext}
                onContextChange={setAiContext}
                selectedText={selectedText}
                blockContext={itemSelector ?? undefined}
                modelsConfigured={aiModels !== undefined}
                models={validAiModels}
                selectedModelId={selectedAiModelId}
                onSelectedModelIdChange={setSelectedAiModelId}
                suggestion={aiSuggestion}
                onRequest={onAiRequest}
                onSuggestionAction={onAiSuggestionAction}
                t={t}
            />
          )}
        </>
      ),
      headerActions: ({ children }) => {
        const currentDocument = documentRef.current

        return (
          <div className="document-editor__header-actions">
            {previewValues !== undefined && (
              <div className="document-editor__preview-toggle" aria-label={t('variablePresentation')}>
                <button type="button" aria-pressed={!isPreview} onClick={() => togglePreview(false)}>
                  {t('author')}
                </button>
                <button type="button" aria-pressed={isPreview} onClick={() => togglePreview(true)}>
                  {t('preview')}
                </button>
              </div>
            )}
            <div className="document-editor__layout-controls">
              <div className="document-editor__layout-switch" ref={setLayoutSwitchRef}>
                <span id="document-layout-label">{t('layout')}</span>
                <div
                  className="document-editor__layout-segmented-control"
                  role="radiogroup"
                  aria-labelledby="document-layout-label"
                >
                  <button
                    type="button"
                    role="radio"
                    data-layout-mode="paged"
                    aria-checked={currentDocument.layout.mode === 'paged'}
                    tabIndex={currentDocument.layout.mode === 'paged' ? 0 : -1}
                    onClick={() => selectLayout('paged')}
                    onKeyDown={handleLayoutKeyDown}
                    disabled={isPreview}
                  >
                    {t('pagedA4')}
                  </button>
                  <button
                    type="button"
                    role="radio"
                    data-layout-mode="fluid"
                    aria-checked={currentDocument.layout.mode === 'fluid'}
                    tabIndex={currentDocument.layout.mode === 'fluid' ? 0 : -1}
                    onClick={() => selectLayout('fluid')}
                    onKeyDown={handleLayoutKeyDown}
                    disabled={isPreview}
                  >
                    {t('fluid')}
                  </button>
                </div>
              </div>
              <div className="document-editor__settings-controls">
                <LayoutSettings
                  layout={currentDocument.layout}
                  onChange={updateLayout}
                  showMarginGuides={showMarginGuides}
                  onShowMarginGuidesChange={setShowMarginGuides}
                  pages={pagedPages}
                  selectedPageId={selectedPageId}
                  onPageSelect={handlePageSelect}
                  pageSettingsChannel={pageSettingsChannel.current}
                  disabled={isPreview}
                  t={t}
                />
                <BackgroundSettings
                  image={currentDocument.backgroundImage}
                  colour={currentDocument.backgroundColour}
                  open={isBackgroundSettingsOpen}
                  onOpenChange={setIsBackgroundSettingsOpen}
                  disabled={isPreview}
                  onImageChange={(backgroundImage) => {
                    const latestDocument = documentRef.current
                    onChangeRef.current({
                      ...latestDocument,
                      data: currentData.current,
                      backgroundImage,
                    })
                  }}
                  onColourChange={(backgroundColour) => {
                    const latestDocument = documentRef.current
                    onChangeRef.current({
                      ...latestDocument,
                      data: currentData.current,
                      backgroundColour,
                    })
                  }}
                  t={t}
                />
              </div>
            </div>
            {children}
          </div>
        )
      },
    }),
    [
      aiContext,
      aiModels,
      aiSuggestion,
      document.layout,
      isBackgroundSettingsOpen,
      isPreview,
      onAiRequest,
      onAiSuggestionAction,
      previewValues,
      rightSidebarMode,
      selectedAiModelId,
      selectedText,
      showMarginGuides,
      t,
      validAiModels,
    ],
  )

  const plugins = useMemo<Plugin<Config<EditorComponents>>[]>(
    () => [
      {
        name: 'pages',
        label: t('pages'),
        icon: '▤',
        render: () => (
          <PageNavigatorPlugin
            pages={document.layout.mode === 'paged' ? pagedPages : []}
            selectedPageId={selectedPageId}
            onPageSelect={handlePageSelect}
            onPageReorder={handlePageReorder}
            t={t}
          />
        ),
      },
    ],
    [document.layout.mode, handlePageSelect, pagedPages, selectedPageId, t],
  )

  return (
    <div className="document-editor" ref={workspaceRef} lang={activeLocale}>
      {logoHref ? (
        <a
          className="document-editor__corner-logo-slot"
          href={logoHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('visitCommsPliant')}
        >
          <img
            className="document-editor__corner-logo"
            src={tiliToliEditorLogo}
            alt={t('editorLogo')}
          />
        </a>
      ) : (
        <div className="document-editor__corner-logo-slot">
          <img
            className="document-editor__corner-logo"
            src={tiliToliEditorLogo}
            alt={t('editorLogo')}
          />
        </div>
      )}
      <DocumentAppearanceContext.Provider value={documentAppearance}>
        <Puck
          key={`${document.id}-${document.layout.mode}-${previewRevision}`}
          config={config}
          data={currentData.current}
          dictionary={createPuckDictionary(t)}
          height={height}
          viewports={documentViewports}
          plugins={plugins}
          permissions={isPreview ? { drag: false, duplicate: false, delete: false, edit: false, insert: false } : undefined}
          overrides={puckOverrides}
          onChange={(data) => {
            if (isPreview) return
            currentData.current = data
            onChangeRef.current({ ...documentRef.current, data })
          }}
          onPublish={(data) => {
            currentData.current = data
            const savedDocument = { ...document, data }
            onChange(savedDocument)
            onSave?.(savedDocument)
          }}
        />
      </DocumentAppearanceContext.Provider>
      <FloatingSidePanels workspaceRef={workspaceRef} />
    </div>
  )
}
