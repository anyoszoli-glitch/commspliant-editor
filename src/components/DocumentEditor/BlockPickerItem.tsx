type BlockPickerItemProps = {
  name: string
}

function BlockIcon({ name }: BlockPickerItemProps) {
  if (name === 'HeadingBlock') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 5v14M18 5v14M6 12h12" />
      </svg>
    )
  }

  if (name === 'PageBreakBlock') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 4h12v5M6 20h12v-5" />
        <path d="M4 12h2m3 0h2m3 0h2m3 0h1" strokeDasharray="1 1" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 7h14M5 12h11M5 17h13" />
    </svg>
  )
}

const labels: Record<string, string> = {
  HeadingBlock: 'Heading',
  TextBlock: 'Text',
  PageBreakBlock: 'Page break',
}

export function BlockPickerItem({ name }: BlockPickerItemProps) {
  return (
    <div className="commspliant-block-tile">
      <span className="commspliant-block-tile__icon">
        <BlockIcon name={name} />
      </span>
      <span className="commspliant-block-tile__label">{labels[name] ?? name}</span>
      <svg className="commspliant-block-tile__grip" viewBox="0 0 10 14" aria-hidden="true">
        <circle cx="3" cy="3" r="1" />
        <circle cx="7" cy="3" r="1" />
        <circle cx="3" cy="7" r="1" />
        <circle cx="7" cy="7" r="1" />
        <circle cx="3" cy="11" r="1" />
        <circle cx="7" cy="11" r="1" />
      </svg>
    </div>
  )
}
