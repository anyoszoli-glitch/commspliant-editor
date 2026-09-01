import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { createRoot, type Root } from 'react-dom/client'
import { useState } from 'react'
import type { ImageBlockData } from '../../document/document'
import { createTranslator } from '../../i18n'
import { ImageEditorField } from './ImageEditorField'
import type { ImagePicker } from './imageTypes'

let root: Root | undefined
let container: HTMLDivElement | undefined

function mountField(initialImage: ImageBlockData, imagePicker?: ImagePicker) {
  container = document.createElement('div')
  document.body.append(container)
  const changes: ImageBlockData[] = []

  function Harness() {
    const [image, setImage] = useState(initialImage)
    return (
      <ImageEditorField
        value={image}
        imagePicker={imagePicker}
        t={createTranslator()}
        onChange={(nextImage) => {
          changes.push(nextImage)
          setImage(nextImage)
        }}
      />
    )
  }

  root = createRoot(container)
  root.render(<Harness />)
  return changes
}

afterEach(() => {
  root?.unmount()
  container?.remove()
  root = undefined
  container = undefined
})

describe('Image editor field', () => {
  it('remains stable without a host picker', async () => {
    mountField({ width: 100, alignment: 'center' })

    await expect.element(page.getByRole('button', { name: 'Choose image' })).toBeDisabled()
    await expect.element(page.getByText('Image selection is available when your host connects an image picker.')).toBeVisible()
  })

  it('uses the supplied host picker and updates the current image data only when it returns a safe image', async () => {
    const picker = vi.fn<ImagePicker>().mockResolvedValue({
      src: 'https://images.example.test/letterhead.png',
      alt: 'Letterhead',
      title: 'Company letterhead',
    })
    const changes = mountField({ alt: '', title: '', width: 80, alignment: 'left' }, picker)

    await userEvent.click(page.getByRole('button', { name: 'Choose image' }))
    await expect.poll(() => changes.at(-1)).toEqual({
      src: 'https://images.example.test/letterhead.png',
      alt: 'Letterhead',
      title: 'Company letterhead',
      width: 80,
      alignment: 'left',
      horizontalOffset: 0,
    })
    expect(picker).toHaveBeenCalledWith({ alt: '', title: '', width: 80, alignment: 'left', horizontalOffset: 0, src: undefined })
    await expect.element(page.getByRole('button', { name: 'Replace image' })).toBeVisible()
  })

  it('leaves the block unchanged when the host picker is cancelled and clears only the source on removal', async () => {
    const picker = vi.fn<ImagePicker>().mockResolvedValue(undefined)
    const changes = mountField({
      src: 'https://images.example.test/letterhead.png', alt: 'Letterhead', title: 'Company', width: 60, alignment: 'right',
    }, picker)

    await userEvent.click(page.getByRole('button', { name: 'Replace image' }))
    await expect.poll(() => picker).toHaveBeenCalledTimes(1)
    expect(changes).toEqual([])

    await userEvent.click(page.getByRole('button', { name: 'Remove image' }))
    expect(changes.at(-1)).toEqual({
      src: undefined, alt: 'Letterhead', title: 'Company', width: 60, alignment: 'right',
      horizontalOffset: 0,
    })
  })
})
