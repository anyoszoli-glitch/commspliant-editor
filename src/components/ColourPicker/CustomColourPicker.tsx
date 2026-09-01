import type { CSSProperties } from 'react'

type CustomColourPickerProps = {
  ariaLabel: string
  value?: string
  fallbackColour: string
  onChange: (colour: string) => void
  disabled?: boolean
  label?: string
  className?: string
  title?: string
  style?: CSSProperties
}

export function CustomColourPicker({
  ariaLabel,
  value,
  fallbackColour,
  onChange,
  disabled = false,
  label,
  className,
  title,
  style,
}: CustomColourPickerProps) {
  return (
    <label className={className} title={title} style={style}>
      {label && <span>{label}</span>}
      <input
        type="color"
        aria-label={ariaLabel}
        value={value || fallbackColour}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </label>
  )
}
