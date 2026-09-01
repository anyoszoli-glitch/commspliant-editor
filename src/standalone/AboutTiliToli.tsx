import { useEffect, useRef, useState } from 'react'

import tiliToliEditorLogo from '../assets/TiliToliEditorLogo.webp'
import aboutTiliToliImage from './assets/About_Tili-Toli.png'

export function AboutTiliToli() {
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
        aria-label="About Tili-Toli"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
      >
        <img src={aboutTiliToliImage} alt="" />
        <span>About</span>
      </button>

      {isOpen && (
        <div className="standalone-about__backdrop" onMouseDown={close}>
          <section
            className="standalone-about__dialog"
            role="dialog"
            aria-modal="true"
            aria-label="About Tili-Toli"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="standalone-about__close"
              aria-label="Close About Tili-Toli"
              autoFocus
              onClick={close}
            >
              ×
            </button>
            <img
              className="standalone-about__logo"
              src={tiliToliEditorLogo}
              alt="Tili Toli Editor"
            />
            <div className="standalone-about__content">
              <h2>Tili-Toli by CommsPliant</h2>
              <p>
                Tili-Toli is the standalone document editor created for CommsPliant.
              </p>
              <p>
                We built it to make document editing simple, flexible and reusable, while keeping
                the editor itself separate from the wider communication workflow.
              </p>
              <p>
                In the full CommsPliant platform, Tili-Toli becomes part of a controlled
                communication process with datasets, live preview, version control, review and
                approval workflows, document generation, audit evidence and AI-assisted editing.
              </p>
              <p>
                The standalone editor is the editing layer. CommsPliant adds the control, workflow
                and evidence around it.
              </p>
              <a
                className="standalone-about__primary-link"
                href="https://commspliant.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Explore CommsPliant
              </a>
              <a
                className="standalone-about__secondary-link"
                href="https://commspliant.com/about-us"
                target="_blank"
                rel="noopener noreferrer"
              >
                About CommsPliant
              </a>
              <p className="standalone-about__credit">Built by CommsPliant.</p>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
