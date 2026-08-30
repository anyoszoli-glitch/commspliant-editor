export type VariableDefinition = {
  key: string
  label: string
}

export type VariablePreviewValues = Readonly<Record<string, string>>

export type VariableResolution =
  | { status: 'resolved'; definition: VariableDefinition; value: string }
  | { status: 'missing-value'; definition: VariableDefinition }
  | { status: 'unknown-variable'; key: string }

const variableKeyPattern = /^[A-Za-z][A-Za-z0-9_]*$/

export function normalizeVariableDefinitions(
  definitions: readonly VariableDefinition[] = [],
): VariableDefinition[] {
  const keys = new Set<string>()

  return definitions.filter(({ key, label }) => {
    if (!variableKeyPattern.test(key) || !label.trim() || keys.has(key)) return false
    keys.add(key)
    return true
  })
}

export function findVariableDefinition(
  definitions: readonly VariableDefinition[],
  key: string,
): VariableDefinition | undefined {
  return definitions.find((definition) => definition.key === key)
}

export function resolveVariable(
  key: string,
  definitions: readonly VariableDefinition[],
  previewValues: VariablePreviewValues,
): VariableResolution {
  const definition = findVariableDefinition(definitions, key)
  if (!definition) return { status: 'unknown-variable', key }

  if (!Object.prototype.hasOwnProperty.call(previewValues, key)) {
    return { status: 'missing-value', definition }
  }

  return { status: 'resolved', definition, value: previewValues[key] }
}
