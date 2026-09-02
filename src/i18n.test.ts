import { describe, expect, it } from 'vitest'
import { applyDocumentLocale, createTranslator, normalizeLocale } from './i18n'

describe('i18n', () => {
  it('uses English for missing or invalid locales', () => {
    expect(normalizeLocale(undefined)).toBe('en')
    expect(normalizeLocale('it')).toBe('en')
    expect(createTranslator('invalid')('pageSetup')).toBe('Page setup')
  })

  it('uses the requested supported locale and falls back per missing key', () => {
    expect(createTranslator('es')('pageSetup')).toBe('Configuración de página')
    expect(createTranslator('hu')('showMargins')).toBe('Margók megjelenítése')
    expect(createTranslator('fr')('backgroundSettings')).toBe('Arrière-plan')
    expect(createTranslator('de')('saveDraft')).toBe('Entwurf speichern')
    expect(createTranslator('es')('editorLogo')).toBe('Tili Toli Editor')
  })

  it('localizes restored panel chrome and editor-owned dynamic labels', () => {
    const spanish = createTranslator('es')
    const french = createTranslator('fr')

    expect(spanish('undockPanel', { panel: spanish('leftPanelTitle') }))
      .toBe('Desacoplar el panel Bloques / Esquema')
    expect(spanish('lineSpacingValue', { value: '1.5' })).toBe('Línea 1.5')
    expect(french('page', { page: 2 })).toBe('Page 2')
    expect(french('backgroundPositionTopLeft')).toBe('En haut à gauche')
  })

  it('localizes the Columns vertical-alignment control in every supported language', () => {
    expect(createTranslator('en')('verticalAlignment')).toBe('Vertical alignment')
    expect(createTranslator('es')('verticalAlignCentre')).toBe('Centro')
    expect(createTranslator('hu')('verticalAlignBottom')).toBe('Alul')
    expect(createTranslator('fr')('verticalAlignTop')).toBe('Haut')
    expect(createTranslator('de')('verticalAlignment')).toBe('Vertikale Ausrichtung')
  })

  it('normalizes document language metadata', () => {
    const documentElement = { lang: '' }

    expect(applyDocumentLocale('hu', documentElement)).toBe('hu')
    expect(documentElement.lang).toBe('hu')
    expect(applyDocumentLocale('invalid', documentElement)).toBe('en')
    expect(documentElement.lang).toBe('en')
  })
})
