import { useState } from 'react'
import {
  isSafeImageSource,
  normalizeImageBlockData,
  type ImageBlockData,
} from '../../document/document'
import type { Translate } from '../../i18n'

type ImageBlockProps = {
  image: ImageBlockData
  pickerAvailable: boolean
  t: Translate
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m5.5 17 4.5-4 3.25 2.75 2.25-2 3 3.25" />
    </svg>
  )
}

function ImagePlaceholder({ message, pickerAvailable, t }: {
  message?: string
  pickerAvailable: boolean
  t: Translate
}) {
  return (
    <div className="commspliant-image-block__placeholder">
      <ImageIcon />
      <strong>{t('chooseImage')}</strong>
      <span>{message ?? (!pickerAvailable ? t('imagePickerUnavailable') : '')}</span>
    </div>
  )
}

export function ImageBlock({ image, pickerAvailable, t }: ImageBlockProps) {
  const value = normalizeImageBlockData(image)
  const source = value.src

  if (!source || !isSafeImageSource(source)) {
    return (
      <div className="commspliant-image-block" data-image-status="empty">
        <ImagePlaceholder
          pickerAvailable={pickerAvailable}
          t={t}
        />
      </div>
    )
  }

  return <LoadedImage key={source} source={source} image={value} pickerAvailable={pickerAvailable} t={t} />
}

function LoadedImage({
  source,
  image,
  pickerAvailable,
  t,
}: {
  source: string
  image: ImageBlockData
  pickerAvailable: boolean
  t: Translate
}) {
  const [failed, setFailed] = useState(false)
  const justifyContent =
    image.alignment === 'left'
      ? 'flex-start'
      : image.alignment === 'right'
        ? 'flex-end'
        : 'center'
  const horizontalOffset = image.horizontalOffset ?? 0
  const offsetStyle =
    image.alignment === 'left'
      ? { marginLeft: `${horizontalOffset}%` }
      : image.alignment === 'right'
        ? { marginRight: `${-horizontalOffset}%` }
        : { marginLeft: `${horizontalOffset}%`, marginRight: `${-horizontalOffset}%` }

  if (failed) {
    return (
      <div className="commspliant-image-block" data-image-status="error">
        <ImagePlaceholder message={t('imageLoadError')} pickerAvailable={pickerAvailable} t={t} />
      </div>
    )
  }

  return (
    <div
      className="commspliant-image-block"
      data-image-status="ready"
      style={{ justifyContent }}
    >
      <img
        src={source}
        alt={image.alt ?? ''}
        title={image.title || undefined}
        style={{ width: `${image.width}%`, ...offsetStyle }}
        onError={() => setFailed(true)}
      />
    </div>
  )
}
