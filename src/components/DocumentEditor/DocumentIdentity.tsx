import { useState, type FocusEvent, type KeyboardEvent } from 'react'
import {
  commitDocumentDescription,
  commitDocumentName,
  normalizeDocumentName,
} from '../../document/documentMetadata'

export type DocumentIdentityProps = {
  documentName?: string
  description?: string
  onDocumentNameChange?: (documentName: string) => void
  onDocumentDescriptionChange?: (description: string) => void
  status?: 'draft'
}

export function DocumentIdentity({
  documentName,
  description,
  onDocumentNameChange,
  onDocumentDescriptionChange,
  status = 'draft',
}: DocumentIdentityProps) {
  const normalizedName = normalizeDocumentName(documentName)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [draftDescription, setDraftDescription] = useState('')
  const normalizedDescription = description ?? ''

  const finishEditing = (event: FocusEvent<HTMLInputElement>) => {
    if (!onDocumentNameChange) return
    event.currentTarget.value = commitDocumentName(event.currentTarget.value, onDocumentNameChange)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') event.currentTarget.blur()
  }

  const startEditingDescription = () => {
    if (!onDocumentDescriptionChange) return
    setDraftDescription(normalizedDescription)
    setIsEditingDescription(true)
  }

  const commitDescription = () => {
    if (!onDocumentDescriptionChange) return
    commitDocumentDescription(draftDescription, onDocumentDescriptionChange)
    setIsEditingDescription(false)
  }

  const handleDescriptionKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitDescription()
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      setDraftDescription(normalizedDescription)
      setIsEditingDescription(false)
    }
  }

  return (
    <div className="document-identity">
      <div className="document-identity__product-label">Tili-Toli CommsPliant document editor</div>
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
        <div className="document-identity__metadata">
          {onDocumentDescriptionChange && isEditingDescription ? (
            <input
              className="document-identity__description-input"
              aria-label="Document description"
              autoFocus
              value={draftDescription}
              onChange={(event) => setDraftDescription(event.currentTarget.value)}
              onBlur={commitDescription}
              onKeyDown={handleDescriptionKeyDown}
            />
          ) : onDocumentDescriptionChange ? (
            <button
              type="button"
              className={
                normalizedDescription
                  ? 'document-identity__description-button'
                  : 'document-identity__description-button document-identity__description-button--empty'
              }
              onClick={startEditingDescription}
              onFocus={startEditingDescription}
            >
              {normalizedDescription || 'Add a description'}
            </button>
          ) : normalizedDescription ? (
            <span className="document-identity__description-text">{normalizedDescription}</span>
          ) : null}
          <span className="document-identity__status" aria-label={`Document status: ${status}`}>
            Draft
          </span>
        </div>
      </div>
    </div>
  )
}
