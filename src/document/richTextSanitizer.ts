import createDOMPurify from 'dompurify'

const purifier = typeof window === 'undefined' ? undefined : createDOMPurify(window)
const variableKeyPattern = /^[A-Za-z][A-Za-z0-9_]*$/

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
})

export function sanitizeRichTextHtml(html: string): string {
  if (!purifier) return html

  return purifier.sanitize(html, {
    ALLOWED_TAGS: ['p', 'h2', 'h3', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li', 'br', 'span'],
    ALLOWED_ATTR: ['href', 'data-commspliant-variable'],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    ALLOWED_URI_REGEXP: /^(?:(?:https?):|(?:mailto:)|(?:\/|#))/i,
  })
}
