export function PageBreakBlock() {
  return (
    <div
      role="separator"
      aria-label="Page break"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        margin: '12px 0',
        color: '#71717a',
        fontSize: 12,
        lineHeight: 1,
      }}
    >
      <span style={{ flex: 1, borderTop: '1px dashed #a1a1aa' }} />
      <span>Page break</span>
      <span style={{ flex: 1, borderTop: '1px dashed #a1a1aa' }} />
    </div>
  )
}
