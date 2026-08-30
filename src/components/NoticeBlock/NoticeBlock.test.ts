import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { NoticeBlock } from './NoticeBlock'

describe('NoticeBlock', () => {
  it('renders semantic notice content with an accessible name from the heading', () => {
    const markup = renderToStaticMarkup(
      createElement(NoticeBlock, { heading: 'Action required', text: 'Please respond by Friday.' }),
    )

    expect(markup).toContain('<aside')
    expect(markup).toContain('aria-label="Action required"')
    expect(markup).toContain('<h2')
    expect(markup).toContain('Please respond by Friday.')
  })
})
