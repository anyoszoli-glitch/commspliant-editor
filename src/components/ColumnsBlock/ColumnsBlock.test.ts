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
            columnBackgrounds: { left: '#aabbcc' },
            leftColumn: (props) => createElement('div', { className: props?.className, 'data-puck-dropzone': 'left' }),
            rightColumn: (props) => createElement('div', { className: props?.className, 'data-puck-dropzone': 'right' }),
            thirdColumn: (props) => createElement('div', { className: props?.className, 'data-puck-dropzone': 'third' }),
            fourthColumn: (props) => createElement('div', { className: props?.className, 'data-puck-dropzone': 'fourth' }),
            showEmptyGuidance: true,
            onAddText: () => undefined,
          }),
        },
      ),
    )

    expect(markup).toContain('data-columns-block="true"')
    expect(markup).toContain('data-columns-preset="50-50"')
    expect(markup).toContain('data-columns-column="left"')
    expect(markup).toContain('data-columns-background="#aabbcc"')
    expect(markup).toContain('background-color:#aabbcc')
    expect(markup).toContain('data-columns-column="right"')
    expect(markup).toContain('data-columns-background="transparent"')
    expect(markup).toContain('data-puck-dropzone="left"')
    expect(markup).toContain('data-puck-dropzone="right"')
    expect(markup).toContain('Add text')
    expect(markup).toContain('Add text to Left column')
    expect(markup).toContain('or drag another block here')
  })

  it('renders four independently identified equal-width column drop areas', () => {
    const markup = renderToStaticMarkup(
      createElement(
        I18nProvider,
        {
          locale: 'en',
          children: createElement(ColumnsBlock, {
            columns: [
              { id: 'left', slot: 'leftColumn' },
              { id: 'right', slot: 'rightColumn' },
              { id: 'third', slot: 'thirdColumn' },
              { id: 'fourth', slot: 'fourthColumn' },
            ],
            layout: { widthPreset: '25-25-25-25' },
            leftColumn: (props) => createElement('div', { className: props?.className, 'data-puck-dropzone': 'left' }),
            rightColumn: (props) => createElement('div', { className: props?.className, 'data-puck-dropzone': 'right' }),
            thirdColumn: (props) => createElement('div', { className: props?.className, 'data-puck-dropzone': 'third' }),
            fourthColumn: (props) => createElement('div', { className: props?.className, 'data-puck-dropzone': 'fourth' }),
          }),
        },
      ),
    )

    expect(markup).toContain('data-columns-count="4"')
    expect(markup).toContain('data-columns-preset="25-25-25-25"')
    expect(markup).toContain('data-columns-column="third"')
    expect(markup).toContain('data-columns-column="fourth"')
    expect(markup).toContain('data-puck-dropzone="third"')
    expect(markup).toContain('data-puck-dropzone="fourth"')
  })

  it('publishes the selected two-column width preset for the grid styling', () => {
    const markup = renderToStaticMarkup(
      createElement(I18nProvider, {
        locale: 'en',
        children: createElement(ColumnsBlock, {
          columns: [{ id: 'left', slot: 'leftColumn' }, { id: 'right', slot: 'rightColumn' }],
          layout: { widthPreset: '25-75' },
          leftColumn: () => createElement('div'), rightColumn: () => createElement('div'),
          thirdColumn: () => createElement('div'), fourthColumn: () => createElement('div'),
        }),
      }),
    )

    expect(markup).toContain('data-columns-preset="25-75"')
    expect(markup).not.toContain('data-columns-stacked')
  })

  it('publishes the selected vertical alignment without putting editor guidance into output mode', () => {
    const markup = renderToStaticMarkup(
      createElement(I18nProvider, {
        locale: 'en',
        children: createElement(ColumnsBlock, {
          columns: [{ id: 'left', slot: 'leftColumn' }, { id: 'right', slot: 'rightColumn' }],
          layout: { widthPreset: '50-50', verticalAlign: 'center' },
          leftColumn: () => createElement('div', null, 'Left content'),
          rightColumn: () => createElement('div', null, 'Right content'),
          thirdColumn: () => createElement('div'), fourthColumn: () => createElement('div'),
        }),
      }),
    )

    expect(markup).toContain('data-columns-vertical-align="center"')
    expect(markup).toContain('commspliant-columns-block__content')
    expect(markup).not.toContain('commspliant-columns-block__column-label')
    expect(markup).not.toContain('commspliant-columns-block__add-text')
  })
})
