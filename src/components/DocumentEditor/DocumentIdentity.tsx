import { useId, type FocusEvent, type KeyboardEvent } from 'react'
import { commitDocumentName, normalizeDocumentName } from '../../document/documentMetadata'

export type DocumentIdentityProps = {
  documentName?: string
  description?: string
  onDocumentNameChange?: (documentName: string) => void
}

export function DocumentIdentity({
  documentName,
  description,
  onDocumentNameChange,
}: DocumentIdentityProps) {
  const normalizedName = normalizeDocumentName(documentName)
  const normalizedDescription = description?.trim()
  const descriptionId = useId()

  const finishEditing = (event: FocusEvent<HTMLInputElement>) => {
    if (!onDocumentNameChange) return
    event.currentTarget.value = commitDocumentName(event.currentTarget.value, onDocumentNameChange)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') event.currentTarget.blur()
  }

  return (
    <div className="document-identity">
      <div className="document-identity__product-label">CommsPliant document editor</div>
      <div className="document-identity__title-row">
        {onDocumentNameChange ? (
          <input
            key={normalizedName}
            className="document-identity__title-input"
            aria-label="Document name"
            defaultValue={normalizedName}
            onBlur={finishEditing}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <h1 className="document-identity__title">{normalizedName}</h1>
        )}
        {normalizedDescription && (
          <span className="document-identity__description">
            <button
              type="button"
              className="document-identity__info"
              aria-label="Document description"
              aria-describedby={descriptionId}
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <circle cx="10" cy="10" r="7.5" />
                <path d="M10 9v5M10 6.25h.01" />
              </svg>
            </button>
            <span id={descriptionId} role="tooltip" className="document-identity__tooltip">
              {normalizedDescription}
            </span>
          </span>
        )}
      </div>
    </div>
  )
}
