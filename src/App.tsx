import { useEffect, useState } from 'react'
import { CommsPliantEditor } from './CommsPliantEditor'
import { DocumentIdentity } from './components/DocumentEditor/DocumentIdentity'
import { loadDocument, saveDocument } from './document/documentStorage'
import { applyDocumentLocale, I18nProvider, normalizeLocale, type SupportedLocale, useTranslation } from './i18n'
import { AboutTiliToli } from './standalone/AboutTiliToli'
import './demo.css'

const variableDefinitions = [
  { key: 'customerName', label: 'Customer name' },
  { key: 'missingValue', label: 'Missing value' },
  { key: 'emptyValue', label: 'Empty value' },
  { key: 'htmlValue', label: 'HTML-like value' },
]
const previewValues = {
  customerName: 'Andrea',
  emptyValue: '',
  htmlValue: '<img src=x onerror=alert(1)>',
}

export const STANDALONE_LOCALE_STORAGE_KEY = 'tili-toli.editor.locale'

function loadStandaloneLocale(): SupportedLocale {
  if (typeof window === 'undefined') return 'en'
  return normalizeLocale(window.localStorage.getItem(STANDALONE_LOCALE_STORAGE_KEY) ?? undefined)
}

function StandaloneHeader({ locale, onLocaleChange, document, onDocumentNameChange, onDocumentDescriptionChange }: {
  locale: SupportedLocale
  onLocaleChange: (locale: SupportedLocale) => void
  document: ReturnType<typeof loadDocument>
  onDocumentNameChange: (name: string) => void
  onDocumentDescriptionChange: (description: string) => void
}) {
  const t = useTranslation()
  return (
    <div className="document-editor__topbar">
      <DocumentIdentity
        documentName={document.name}
        description={document.description}
        onDocumentNameChange={onDocumentNameChange}
        onDocumentDescriptionChange={onDocumentDescriptionChange}
        status={document.status}
      />
      <label className="standalone-language-selector">
        <select aria-label={t('language')} value={locale} onChange={(event) => onLocaleChange(normalizeLocale(event.currentTarget.value))}>
          <option value="en">🇬🇧 English</option>
          <option value="es">🇪🇸 Español</option>
          <option value="hu">🇭🇺 Magyar</option>
          <option value="fr">🇫🇷 Français</option>
          <option value="de">🇩🇪 Deutsch</option>
        </select>
      </label>
    </div>
  )
}

function App() {
  const [document, setDocument] = useState(loadDocument)
  const [locale, setLocale] = useState(loadStandaloneLocale)

  useEffect(() => {
    window.localStorage.setItem(STANDALONE_LOCALE_STORAGE_KEY, locale)
  }, [locale])

  useEffect(() => {
    applyDocumentLocale(locale, globalThis.document.querySelector('html') ?? undefined)
  }, [locale])

  return (
    <I18nProvider locale={locale}>
      <StandaloneHeader
        locale={locale}
        onLocaleChange={setLocale}
        document={document}
        onDocumentNameChange={(name) => setDocument((current) => ({ ...current, name }))}
        onDocumentDescriptionChange={(description) => setDocument((current) => ({ ...current, description }))}
      />
      <div className="standalone-editor__workspace">
        <AboutTiliToli />
        <CommsPliantEditor
          document={document}
          variableDefinitions={variableDefinitions}
          previewValues={previewValues}
          height="calc(100vh - 64px)"
          logoHref="https://commspliant.com"
          locale={locale}
          onChange={setDocument}
          onSave={(savedDocument) => {
            setDocument(saveDocument(savedDocument))
          }}
        />
      </div>
    </I18nProvider>
  )
}

export default App
