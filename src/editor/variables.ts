export type VariableDefinition = {
  key: string
  label: string
}

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
