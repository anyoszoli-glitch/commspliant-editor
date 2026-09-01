import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createTranslator } from '../../i18n'
import { ImageBlock } from './ImageBlock'

describe('ImageBlock', () => {
  it('renders an empty, selectable-safe placeholder without an image source', () => {
    const markup = renderToStaticMarkup(createElement(ImageBlock, {
      image: { width: 100, alignment: 'center' }, pickerAvailable: false, t: createTranslator(),
    }))

    expect(markup).toContain('data-image-status="empty"')
    expect(markup).toContain('Choose image')
    expect(markup).toContain('host connects an image picker')
  })

  it('renders safe image data with bounded width, alignment, alt text, and title', () => {
    const markup = renderToStaticMarkup(createElement(ImageBlock, {
      image: {
        src: 'https://images.example.test/letterhead.png',
        alt: 'Company letterhead',
        title: 'Company',
        width: 75,
        alignment: 'right',
        horizontalOffset: -12,
      },
      pickerAvailable: true,
      t: createTranslator(),
    }))

    expect(markup).toContain('data-image-status="ready"')
    expect(markup).toContain('justify-content:flex-end')
    expect(markup).toContain('width:75%')
    expect(markup).toContain('margin-right:12%')
    expect(markup).toContain('alt="Company letterhead"')
    expect(markup).toContain('title="Company"')
  })

  it('positions left, centre, and right images with their safe horizontal offsets', () => {
    const renderImage = (alignment: 'left' | 'center' | 'right', horizontalOffset: number) =>
      renderToStaticMarkup(createElement(ImageBlock, {
        image: {
          src: 'https://images.example.test/logo.png', width: 75, alignment, horizontalOffset,
        },
        pickerAvailable: true,
        t: createTranslator(),
      }))

    expect(renderImage('left', 12)).toContain('margin-left:12%')
    expect(renderImage('center', -10)).toContain('margin-left:-10%;margin-right:10%')
    expect(renderImage('right', -12)).toContain('margin-right:12%')
  })

  it('escapes host-provided alt text and title instead of rendering HTML', () => {
    const markup = renderToStaticMarkup(createElement(ImageBlock, {
      image: {
        src: 'https://images.example.test/logo.png',
        alt: '<script>alert("alt")</script>',
        title: '<img src=x onerror=alert("title")>',
        width: 50,
        alignment: 'center',
      },
      pickerAvailable: true,
      t: createTranslator(),
    }))

    expect(markup).not.toContain('<script>')
    expect(markup).not.toContain('<img src=x')
    expect(markup).toContain('&lt;script&gt;alert(&quot;alt&quot;)&lt;/script&gt;')
    expect(markup).toContain('&lt;img src=x onerror=alert(&quot;title&quot;)&gt;')
  })
})
