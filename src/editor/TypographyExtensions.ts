import { Extension, Mark, mergeAttributes } from '@tiptap/core'

export const fontFamilyOptions = [
  { label: 'Default font', value: '' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Helvetica', value: 'Helvetica' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Verdana', value: 'Verdana' },
] as const

export const textColourOptions = [
  { label: 'Default colour', value: '' },
  { label: 'Charcoal', value: '#18181b' },
  { label: 'Slate', value: '#526473' },
  { label: 'Red', value: '#b42318' },
  { label: 'Blue', value: '#1d4ed8' },
  { label: 'Green', value: '#166534' },
] as const

export const highlightColourOptions = [
  { label: 'No highlight', value: '' },
  { label: 'Yellow', value: '#fff3bf' },
  { label: 'Blue', value: '#dbeafe' },
  { label: 'Green', value: '#dcfce7' },
  { label: 'Red', value: '#fee2e2' },
  { label: 'Purple', value: '#f3e8ff' },
] as const

export const lineSpacingOptions = [
  { label: 'Line 1.0', value: '1' },
  { label: 'Line 1.15', value: '1.15' },
  { label: 'Line 1.5', value: '1.5' },
  { label: 'Line 2.0', value: '2' },
] as const

export type FontFamily = Exclude<(typeof fontFamilyOptions)[number]['value'], ''>
export type TextColour = `#${string}`
export type HighlightColour = `#${string}`
export type LineSpacing = (typeof lineSpacingOptions)[number]['value']

const fontFamilyValues = fontFamilyOptions.flatMap(({ value }) => value ? [value] : [])
const textColourValues = textColourOptions.flatMap(({ value }) => value ? [value] : [])
const highlightColourValues = highlightColourOptions.flatMap(({ value }) => value ? [value] : [])
const lineSpacingValues = lineSpacingOptions.map(({ value }) => value)

function normalizeFontFamily(value: unknown): FontFamily | null {
  if (typeof value !== 'string') return null

  const firstFamily = value.split(',')[0]?.trim().replace(/^['"]|['"]$/g, '')
  return fontFamilyValues.find((family) => family.toLowerCase() === firstFamily?.toLowerCase()) ?? null
}

const colourAliases: Record<string, string> = {
  'rgb(24, 24, 27)': '#18181b',
  'rgb(82, 100, 115)': '#526473',
  'rgb(180, 35, 24)': '#b42318',
  'rgb(29, 78, 216)': '#1d4ed8',
  'rgb(22, 101, 52)': '#166534',
  'rgb(255, 243, 191)': '#fff3bf',
  'rgb(219, 234, 254)': '#dbeafe',
  'rgb(220, 252, 231)': '#dcfce7',
  'rgb(254, 226, 226)': '#fee2e2',
  'rgb(243, 232, 255)': '#f3e8ff',
}

function rgbToHex(value: string): string | null {
  const match = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*1(?:\.0+)?)?\s*\)$/i.exec(value)
  if (!match) return null

  const channels = match.slice(1, 4).map(Number)
  if (channels.some((channel) => channel > 255)) return null
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

function normalizeColour(value: unknown, _allowedValues: readonly string[]): string | null {
  if (typeof value !== 'string') return null
  const rawValue = value.trim().toLowerCase()
  const normalized = colourAliases[rawValue] ?? rgbToHex(rawValue) ?? rawValue
  return /^#[0-9a-f]{6}$/.test(normalized) ? normalized : null
}

export const FontFamilyMark = Mark.create({
  name: 'fontFamily',

  addAttributes() {
    return {
      family: {
        default: null,
        parseHTML: (element) => normalizeFontFamily(element.style.fontFamily),
        renderHTML: ({ family }) => {
          const normalized = normalizeFontFamily(family)
          return normalized ? { style: `font-family: ${normalized}` } : {}
        },
      },
    }
  },

  parseHTML() {
    return [{
      style: 'font-family',
      getAttrs: (value) => {
        const family = normalizeFontFamily(value)
        return family ? { family } : false
      },
    }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0]
  },
})

export const TextColourMark = Mark.create({
  name: 'textColour',

  addAttributes() {
    return {
      colour: {
        default: null,
        parseHTML: (element) => normalizeColour(element.style.color, textColourValues),
        renderHTML: ({ colour }) => {
          const normalized = normalizeColour(colour, textColourValues)
          return normalized ? { style: `color: ${normalized}` } : {}
        },
      },
    }
  },

  parseHTML() {
    return [{
      style: 'color',
      getAttrs: (value) => {
        const colour = normalizeColour(value, textColourValues)
        return colour ? { colour } : false
      },
    }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0]
  },
})

export const TextHighlightMark = Mark.create({
  name: 'textHighlight',

  addAttributes() {
    return {
      colour: {
        default: null,
        parseHTML: (element) => normalizeColour(element.style.backgroundColor, highlightColourValues),
        renderHTML: ({ colour }) => {
          const normalized = normalizeColour(colour, highlightColourValues)
          return normalized ? { style: `background-color: ${normalized}` } : {}
        },
      },
    }
  },

  parseHTML() {
    return [{
      style: 'background-color',
      getAttrs: (value) => {
        const colour = normalizeColour(value, highlightColourValues)
        return colour ? { colour } : false
      },
    }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0]
  },
})

export const LineSpacingExtension = Extension.create({
  name: 'lineSpacing',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          lineSpacing: {
            default: null,
            parseHTML: (element) => {
              const lineHeight = element.style.lineHeight
              return lineSpacingValues.includes(lineHeight as LineSpacing) ? lineHeight : null
            },
            renderHTML: ({ lineSpacing }) => {
              const normalized = String(lineSpacing ?? '')
              return lineSpacingValues.includes(normalized as LineSpacing)
                ? { style: `line-height: ${normalized}` }
                : {}
            },
          },
        },
      },
    ]
  },
})

export const typographyExtensions = [
  FontFamilyMark,
  TextColourMark,
  TextHighlightMark,
  LineSpacingExtension,
]
