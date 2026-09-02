import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { I18nProvider } from '../../i18n'
import { ColumnsBlock } from './ColumnsBlock'

describe('ColumnsBlock', () => {
  it('renders two separately identified 50/50 column drop areas', () => {
    const markup = renderToStaticMarkup(
      createElement(
        I18nProvider,
        {
          locale: 'en',
          children: createElement(ColumnsBlock, {
            columns: [
              { id: 'left', slot: 'leftColumn' },
              { id: 'right', slot: 'rightColumn' },
            ],
            layout: { widthPreset: '50-50' },
            leftColumn: (props) => createElement('div', { className: props?.className, 'data-puck-dropzone': 'left' }),
            rightColumn: (props) => createElement('div', { className: props?.className, 'data-puck-dropzone': 'right' }),
            showEmptyGuidance: true,
          }),
        },
      ),
    )

    expect(markup).toContain('data-columns-block="true"')
    expect(markup).toContain('data-columns-preset="50-50"')
    expect(markup).toContain('data-columns-column="left"')
    expect(markup).toContain('data-columns-column="right"')
    expect(markup).toContain('data-puck-dropzone="left"')
    expect(markup).toContain('data-puck-dropzone="right"')
    expect(markup).toContain('Drag a block here')
  })
})
