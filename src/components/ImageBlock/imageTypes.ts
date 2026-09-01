import type { ImageBlockData } from '../../document/document'

export type ImageSelection = {
  src: string
  alt?: string
  title?: string
}

/**
 * Optional host integration for selecting a normal document image. Returning
 * `undefined` or `null` represents a cancelled selection.
 */
export type ImagePicker = (
  currentImage: Readonly<ImageBlockData>,
) => ImageSelection | null | undefined | Promise<ImageSelection | null | undefined>
