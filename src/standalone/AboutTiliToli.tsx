import { useEffect, useRef, useState } from 'react'

import tiliToliEditorLogo from '../assets/TiliToliEditorLogo.webp'
import aboutTiliToliImage from './assets/About_Tili-Toli.png'
import { useTranslation } from '../i18n'

export function AboutTiliToli() {
  const t = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsOpen(false)
      requestAnimationFrame(() => triggerRef.current?.focus())
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const close = () => {
    setIsOpen(false)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="standalone-about__trigger"
        aria-label={t('aboutTiliToli')}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
      >
        <img src={aboutTiliToliImage} alt="" />
        <span>{t('about')}</span>
      </button>

      {isOpen && (
        <div className="standalone-about__backdrop" onMouseDown={close}>
          <section
            className="standalone-about__dialog"
            role="dialog"
            aria-modal="true"
            aria-label={t('aboutTiliToli')}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="standalone-about__close"
              aria-label={t('closeAbout')}
              autoFocus
              onClick={close}
            >
              ×
            </button>
            <img
              className="standalone-about__logo"
              src={tiliToliEditorLogo}
              alt={t('editorLogo')}
            />
            <div className="standalone-about__content">
              <h2>{t('aboutTitle')}</h2>
              <p>{t('aboutIntro')}</p>
              <p>{t('aboutBodyOne')}</p>
              <p>{t('aboutBodyTwo')}</p>
              <p>{t('aboutBodyThree')}</p>
              <a
                className="standalone-about__primary-link"
                href="https://commspliant.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('exploreCommsPliant')}
              </a>
              <a
                className="standalone-about__secondary-link"
                href="https://commspliant.com/about-us"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('aboutCommsPliant')}
              </a>
              <p className="standalone-about__credit">{t('builtBy')}</p>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
