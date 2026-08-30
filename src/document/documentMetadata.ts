export const DEFAULT_DOCUMENT_NAME = 'Untitled document'

export function normalizeDocumentName(name?: string): string {
  const normalizedName = name?.trim()
  return normalizedName || DEFAULT_DOCUMENT_NAME
}

export function commitDocumentName(
  draftName: string,
  onDocumentNameChange: (documentName: string) => void,
): string {
  const nextName = normalizeDocumentName(draftName)
  onDocumentNameChange(nextName)
  return nextName
}

export function commitDocumentDescription(
  draftDescription: string,
  onDocumentDescriptionChange: (description: string) => void,
): string {
  const nextDescription = draftDescription.trim()
  onDocumentDescriptionChange(nextDescription)
  return nextDescription
}
