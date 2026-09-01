import type { ChangeEvent } from 'react'
import {
  getImageHorizontalOffsetBounds,
  isSafeImageSource,
  normalizeImageBlockData,
  type ImageAlignment,
  type ImageBlockData,
} from '../../document/document'
import type { Translate } from '../../i18n'
import type { ImagePicker } from './imageTypes'

type ImageEditorFieldProps = {
  value: ImageBlockData
  onChange: (value: ImageBlockData) => void
  readOnly?: boolean
  imagePicker?: ImagePicker
  imagePickerActionLabel?: string
  t: Translate
}

export function ImageEditorField({
  value,
  onChange,
  readOnly = false,
  imagePicker,
  imagePickerActionLabel,
  t,
}: ImageEditorFieldProps) {
  const image = normalizeImageBlockData(value)
  const offsetBounds = getImageHorizontalOffsetBounds(image.width ?? 100, image.alignment ?? 'center')

  const chooseImage = async () => {
    if (readOnly || !imagePicker) return

    try {
      const selection = await imagePicker(image)
      if (!selection || !isSafeImageSource(selection.src)) return
      onChange(normalizeImageBlockData({
        ...image,
        src: selection.src,
        alt: selection.alt ?? image.alt,
        title: selection.title ?? image.title,
      }))
    } catch {
      // The host owns picker errors. Leave this block untouched if it cannot select an image.
    }
  }

  const changeText = (key: 'alt' | 'title') => (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...image, [key]: event.currentTarget.value })
  }

  return (
    <div className="commspliant-image-field">
      <div className="commspliant-image-field__actions">
        <button type="button" disabled={readOnly || !imagePicker} onClick={chooseImage}>
          {image.src ? t('replaceImage') : (imagePickerActionLabel ?? t('chooseImage'))}
        </button>
        {image.src && (
          <button
            type="button"
            disabled={readOnly}
            onClick={() => onChange({ ...image, src: undefined })}
          >
            {t('removeImage')}
          </button>
        )}
      </div>
      {!imagePicker && <p className="commspliant-image-field__hint">{t('imagePickerUnavailable')}</p>}
      <label className="commspliant-image-field__option">
        <span>{t('altText')}</span>
        <input type="text" value={image.alt ?? ''} disabled={readOnly} onChange={changeText('alt')} />
      </label>
      <label className="commspliant-image-field__option">
        <span>{t('title')}</span>
        <input type="text" value={image.title ?? ''} disabled={readOnly} onChange={changeText('title')} />
      </label>
      <label className="commspliant-image-field__option">
        <span>{t('width')}</span>
        <input
          type="number"
          min="1"
          max="100"
          step="1"
          value={image.width}
          disabled={readOnly}
          onChange={(event) => onChange(normalizeImageBlockData({ ...image, width: Number(event.currentTarget.value) }))}
        />
      </label>
      <label className="commspliant-image-field__option">
        <span>{t('alignment')}</span>
        <select
          aria-label={t('alignment')}
          value={image.alignment}
          disabled={readOnly}
          onChange={(event) => onChange(normalizeImageBlockData({
            ...image,
            alignment: event.currentTarget.value as ImageAlignment,
          }))}
        >
          <option value="left">{t('left')}</option>
          <option value="center">{t('centre')}</option>
          <option value="right">{t('right')}</option>
        </select>
      </label>
      <label className="commspliant-image-field__option">
        <span>{t('horizontalOffset')}</span>
        <input
          type="number"
          min={offsetBounds.min}
          max={offsetBounds.max}
          step="1"
          value={image.horizontalOffset}
          disabled={readOnly || offsetBounds.min === offsetBounds.max}
          onChange={(event) => onChange(normalizeImageBlockData({
            ...image,
            horizontalOffset: Number(event.currentTarget.value),
          }))}
        />
      </label>
    </div>
  )
}
