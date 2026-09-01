import type { ImagePicker } from '../components/ImageBlock/imageTypes'
import type { SupportedLocale } from '../i18n'
import sampleImage from './assets/sample-image.png'

const sampleImageActionLabels: Record<SupportedLocale, string> = {
  en: 'Use sample image (demo)',
  es: 'Usar imagen de ejemplo (demo)',
  hu: 'Minta kép használata (demó)',
  fr: 'Utiliser une image exemple (démo)',
  de: 'Beispielbild verwenden (Demo)',
}

/** Standalone-only development picker; production hosts supply their own picker. */
export const standaloneSampleImagePicker: ImagePicker = async () => ({
  src: sampleImage,
  alt: 'Tili-Toli sample image',
  title: 'Standalone demo image',
})

export function standaloneSampleImageActionLabel(locale: SupportedLocale): string {
  return sampleImageActionLabels[locale]
}
