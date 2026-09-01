import type { ImagePicker } from '../components/ImageBlock/imageTypes'
import sampleImage from './assets/sample-image.png'

/** Standalone-only development picker; production hosts supply their own picker. */
export const standaloneSampleImagePicker: ImagePicker = async () => ({
  src: sampleImage,
  alt: 'Tili-Toli sample image',
  title: 'Standalone demo image',
})
