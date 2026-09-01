import createDOMPurify from 'dompurify'

const purifier = typeof window === 'undefined' ? undefined : createDOMPurify(window)
const variableKeyPattern = /^[A-Za-z][A-Za-z0-9_]*$/
const allowedFontFamilies = ['Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Verdana']
const allowedColours = new Set([
  '#18181b', '#526473', '#b42318', '#1d4ed8', '#166534',
  '#fff3bf', '#dbeafe', '#dcfce7', '#fee2e2', '#f3e8ff',
  'rgb(24, 24, 27)', 'rgb(82, 100, 115)', 'rgb(180, 35, 24)',
  'rgb(29, 78, 216)', 'rgb(22, 101, 52)', 'rgb(255, 243, 191)',
  'rgb(219, 234, 254)', 'rgb(220, 252, 231)', 'rgb(254, 226, 226)',
  'rgb(243, 232, 255)',
])
const safeHexColour = /^#[0-9a-f]{6}$/i
const safeRgbColour = /^rgb\(\s*(?:\d{1,3})\s*,\s*(?:\d{1,3})\s*,\s*(?:\d{1,3})\s*\)$/i
const allowedLineSpacing = new Set(['1', '1.15', '1.5', '2'])
const allowedTextAlign = new Set(['left', 'center', 'right', 'justify'])

export function sanitizeRichTextStyle(style: string): string {
  const declarations = style
    .split(';')
    .map((declaration) => declaration.split(':'))
    .filter((parts) => parts.length >= 2)
    .flatMap(([rawProperty, ...rawValue]) => {
      const property = rawProperty.trim().toLowerCase()
      const value = rawValue.join(':').trim()

      if (property === 'font-family') {
        const firstFamily = value.split(',')[0]?.trim().replace(/^['"]|['"]$/g, '')
        const family = allowedFontFamilies.find(
          (candidate) => candidate.toLowerCase() === firstFamily?.toLowerCase(),
        )
        return family ? [`font-family: ${family}`] : []
      }

      if (property === 'color' || property === 'background-color') {
        const normalizedColour = value.toLowerCase()
        const safeRgb = safeRgbColour.test(normalizedColour) &&
          (normalizedColour.match(/\d+/g) ?? []).every((channel) => Number(channel) <= 255)
        if (allowedColours.has(normalizedColour) || safeHexColour.test(normalizedColour) || safeRgb) {
          return [`${property}: ${normalizedColour}`]
        }
      }

      if (property === 'line-height' && allowedLineSpacing.has(value)) {
        return [`line-height: ${value}`]
      }

      if (property === 'text-align' && allowedTextAlign.has(value.toLowerCase())) {
        return [`text-align: ${value.toLowerCase()}`]
      }

      return []
    })

  return declarations.join('; ')
}

purifier?.addHook('uponSanitizeAttribute', (node, data) => {
  if (data.attrName.startsWith('data-') && data.attrName !== 'data-commspliant-variable') {
    data.keepAttr = false
  }
  if (data.attrName === 'data-commspliant-variable') {
    if (node.nodeName.toLowerCase() !== 'span' || !variableKeyPattern.test(data.attrValue)) {
      data.keepAttr = false
      return
    }

    data.forceKeepAttr = true
  }
  if (data.attrName === 'style') {
    const style = sanitizeRichTextStyle(data.attrValue)
    if (style) {
      data.attrValue = style
      data.keepAttr = true
    } else {
      data.keepAttr = false
    }
  }
})

export function sanitizeRichTextHtml(
  html: string,
  headingLevels: readonly (1 | 2 | 3 | 4 | 5 | 6)[] = [2, 3],
): string {
  if (!purifier) return html

  return purifier.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      ...headingLevels.map((level) => `h${level}`),
      'strong', 'b', 'em', 'i', 'u', 's', 'del', 'a', 'ul', 'ol', 'li', 'br', 'span',
    ],
    ALLOWED_ATTR: ['href', 'style', 'data-commspliant-variable'],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    ALLOWED_URI_REGEXP: /^(?:(?:https?):|(?:mailto:)|(?:\/|#))/i,
  })
}
