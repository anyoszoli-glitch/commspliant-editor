type BlockPickerItemProps = {
  name: string
  t: import('../../i18n').Translate
}

type BlockIconProps = Pick<BlockPickerItemProps, 'name'>

function BlockIcon({ name }: BlockIconProps) {
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

  if (name === 'NoticeBlock') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4l8 15H4L12 4z" />
        <path d="M12 9v4m0 3h.01" />
      </svg>
    )
  }

  if (name === 'TableBlock') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="5" width="16" height="14" rx="1" />
        <path d="M4 10h16M9.5 5v14M15 5v14" />
      </svg>
    )
  }

  if (name === 'ImageBlock') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
        <circle cx="9" cy="10" r="1.5" />
        <path d="m5.5 17 4.5-4 3.25 2.75 2.25-2 3 3.25" />
      </svg>
    )
  }

  if (name === 'DividerBlock') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 12h16" />
      </svg>
    )
  }

  if (name === 'SpacerBlock') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 5h14M5 19h14M12 8v8m-3-3l3 3 3-3M9 11l3-3 3 3" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 7h14M5 12h11M5 17h13" />
    </svg>
  )
}

const labels: Record<string, import('../../i18n').TranslationKey> = {
  HeadingBlock: 'heading', TextBlock: 'text', NoticeBlock: 'importantNotice', PageBreakBlock: 'pageBreak', TableBlock: 'table', ImageBlock: 'image', DividerBlock: 'divider', SpacerBlock: 'spacer',
}

export function BlockPickerItem({ name, t }: BlockPickerItemProps) {
  return (
    <div className="commspliant-block-tile">
      <span className="commspliant-block-tile__icon">
        <BlockIcon name={name} />
      </span>
      <span className="commspliant-block-tile__label">{labels[name] ? t(labels[name]) : name}</span>
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
