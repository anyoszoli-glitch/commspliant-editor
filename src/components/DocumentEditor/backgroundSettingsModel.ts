import type {
  BackgroundImageFit,
  BackgroundImagePosition,
  DocumentBackgroundImage,
} from '../../document/document'

export const BACKGROUND_OPACITY_MIN = 0
export const BACKGROUND_OPACITY_MAX = 100

export function parseBackgroundOpacity(rawValue: string): number | undefined {
  if (!rawValue.trim()) return undefined

  const value = Number(rawValue)

  if (
    !Number.isInteger(value) ||
    value < BACKGROUND_OPACITY_MIN ||
    value > BACKGROUND_OPACITY_MAX
  ) {
    return undefined
  }

  return value
}

export function updateBackgroundFit(
  image: DocumentBackgroundImage,
  fit: BackgroundImageFit,
): DocumentBackgroundImage {
  return { ...image, fit }
}

export function updateBackgroundPosition(
  image: DocumentBackgroundImage,
  position: BackgroundImagePosition,
): DocumentBackgroundImage {
  return { ...image, position }
}

export function updateBackgroundOpacity(
  image: DocumentBackgroundImage,
  percent: number,
): DocumentBackgroundImage {
  return {
    ...image,
    opacity: percent / 100,
  }
}
