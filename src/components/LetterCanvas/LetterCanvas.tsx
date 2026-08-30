import type { ReactNode } from 'react'
import { DocumentCanvas } from '../DocumentCanvas/DocumentCanvas'

type LetterCanvasProps = {
  children?: ReactNode
}

export function LetterCanvas({ children }: LetterCanvasProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f3f4f6',
        padding: '48px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      <DocumentCanvas style={{ boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)' }}>
        {children}
      </DocumentCanvas>
    </div>
  )
}
