import type { ReactNode } from 'react'

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
      <div
        style={{
          width: '210mm',
          minHeight: '297mm',
          background: '#ffffff',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
          padding: '20mm',
          boxSizing: 'border-box',
        }}
      >
        {children}
      </div>
    </div>
  )
}