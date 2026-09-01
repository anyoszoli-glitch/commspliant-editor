import { describe, expect, it } from 'vitest'
import {
  createDocument,
  defaultPagedLayout,
  type DocumentData,
  type LetterDocument,
} from '../../document/document'
import { loadDocument, saveDocument } from '../../document/documentStorage'
import type { PageDescriptor } from '../DocumentCanvas/pagination'
import { reorderPages } from './pageReordering'

function block(id: string, type: 'TextBlock' | 'PageBreakBlock' = 'TextBlock') {
  return {
    type,
    props: type === 'TextBlock' ? { id, text: `<p>${id}</p>` } : { id },
  } as DocumentData['content'][number]
}

function threePages() {
  const content = [
    block('one'),
    block('break-one', 'PageBreakBlock'),
    block('two-a'),
    block('two-b'),
    block('break-two', 'PageBreakBlock'),
    block('three'),
  ] as DocumentData['content']
  const pages: PageDescriptor[] = [
    { id: 'page-root', number: 1, blockIds: ['one', 'break-one'] },
    { id: 'page-after-break-one', number: 2, blockIds: ['two-a', 'two-b', 'break-two'] },
    { id: 'page-after-break-two', number: 3, blockIds: ['three'] },
  ]
  return { content, pages }
}

function ids(content: DocumentData['content']) {
  return content.map((item) => item.props.id)
}

function reorder(fromIndex: number, toIndex: number, activePageId?: string) {
  const { content, pages } = threePages()
  return reorderPages(content, pages, fromIndex, toIndex, defaultPagedLayout, activePageId)
}

describe('reorderPages', () => {
  it.each([
    [2, 0, ['three', 'break-one', 'one', 'break-two', 'two-a', 'two-b']],
    [0, 2, ['two-a', 'two-b', 'break-one', 'three', 'break-two', 'one']],
    [1, 0, ['two-a', 'two-b', 'break-one', 'one', 'break-two', 'three']],
    [1, 2, ['one', 'break-one', 'three', 'break-two', 'two-a', 'two-b']],
  ])('moves page %i to page %i', (fromIndex, toIndex, expected) => {
    expect(ids(reorder(fromIndex, toIndex)!.content)).toEqual(expected)
  })

  it('moves every block in a page together and preserves internal order elsewhere', () => {
    const result = reorder(1, 0)
    expect(ids(result!.content)).toEqual(['two-a', 'two-b', 'break-one', 'one', 'break-two', 'three'])
    expect(result!.content[0].props.id).toBe('two-a')
    expect(result!.content[1].props.id).toBe('two-b')
  })

  it('preserves valid page-break boundaries without duplicating or losing breaks', () => {
    const result = reorder(2, 0)!
    expect(result.content.filter((item) => item.type === 'PageBreakBlock').map((item) => item.props.id)).toEqual([
      'break-one',
      'break-two',
    ])
  })

  it('keeps page-specific margins with the moved page', () => {
    const layout = {
      ...defaultPagedLayout,
      pageSettings: {
        'page-root': { margins: { ...defaultPagedLayout.margins, top: 10 } },
        'page-after-break-one': { margins: { ...defaultPagedLayout.margins, top: 20 } },
        'page-after-break-two': { margins: { ...defaultPagedLayout.margins, top: 30 } },
      },
    }
    const { content, pages } = threePages()
    const result = reorderPages(content, pages, 2, 0, layout, 'page-after-break-two')!
    expect(result.layout.pageSettings?.['page-root']?.margins.top).toBe(30)
    expect(result.layout.pageSettings?.['page-after-break-one']?.margins.top).toBe(10)
    expect(result.layout.pageSettings?.['page-after-break-two']?.margins.top).toBe(20)
  })

  it('keeps the moved page active by its logical identity', () => {
    expect(reorder(2, 0, 'page-after-break-two')!.activePageId).toBe('page-root')
    expect(reorder(0, 2, 'page-root')!.activePageId).toBe('page-after-break-two')
  })

  it('moves a complete Image block with its page settings and preserves both through Save/Open', () => {
    const image = {
      type: 'ImageBlock',
      props: {
        id: 'image-two',
        image: {
          src: 'https://images.example.test/customer-image.png',
          alt: 'Customer-authored alt text',
          title: 'Customer-authored title',
          width: 72,
          alignment: 'right',
          horizontalOffset: -18,
        },
      },
    } as DocumentData['content'][number]
    const content = [
      block('one'),
      block('break-one', 'PageBreakBlock'),
      image,
      block('caption-two'),
      block('break-two', 'PageBreakBlock'),
    ] as DocumentData['content']
    const pages: PageDescriptor[] = [
      { id: 'page-root', number: 1, blockIds: ['one', 'break-one'] },
      {
        id: 'page-after-break-one',
        number: 2,
        blockIds: ['image-two', 'caption-two', 'break-two'],
      },
      { id: 'page-after-break-two', number: 3, blockIds: [] },
    ]
    const layout = {
      ...defaultPagedLayout,
      pageSettings: {
        'page-root': { margins: { ...defaultPagedLayout.margins, top: 11 } },
        'page-after-break-one': { margins: { ...defaultPagedLayout.margins, top: 22 } },
        'page-after-break-two': { margins: { ...defaultPagedLayout.margins, top: 33 } },
      },
    }

    const result = reorderPages(content, pages, 1, 0, layout, 'page-after-break-one')!
    expect(ids(result.content)).toEqual([
      'image-two', 'caption-two', 'break-one', 'one', 'break-two',
    ])
    expect(result.content.find((item) => item.props.id === 'image-two')).toEqual(image)
    expect(new Set(ids(result.content))).toEqual(new Set(ids(content)))
    expect(result.layout.pageSettings?.['page-root']?.margins.top).toBe(22)
    expect(result.layout.pageSettings?.['page-after-break-one']?.margins.top).toBe(11)
    expect(result.layout.pageSettings?.['page-after-break-two']?.margins.top).toBe(33)

    const document = createDocument('image-page-reordered', result.layout)
    document.data = { content: result.content, root: {} }
    document.backgroundImage = {
      src: '/api/v1/assets/page-background',
      fit: 'cover',
      position: 'center',
      opacity: 0.6,
    }
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    } as unknown as Storage

    saveDocument(document, storage, document.updatedAt)
    const restored = loadDocument(storage)
    expect(restored.data.content.find((item) => item.props.id === 'image-two')).toEqual(image)
    expect(restored.layout).toEqual(result.layout)
    expect(restored.backgroundImage).toEqual(document.backgroundImage)
  })

  it('does nothing for a no-op or cancelled drag', () => {
    expect(reorder(1, 1)).toBeUndefined()
    expect(reorderPages(threePages().content, [], 0, 0, defaultPagedLayout)).toBeUndefined()
  })

  it('supports an empty final page without corrupting its boundaries', () => {
    const content = [block('break-one', 'PageBreakBlock'), block('break-two', 'PageBreakBlock')]
    const pages: PageDescriptor[] = [
      { id: 'page-root', number: 1, blockIds: ['break-one'] },
      { id: 'page-after-break-one', number: 2, blockIds: ['break-two'] },
      { id: 'page-after-break-two', number: 3, blockIds: [] },
    ]
    const result = reorderPages(content, pages, 2, 0, defaultPagedLayout)!
    expect(result.content).toHaveLength(2)
    expect(result.content.every((item) => item.type === 'PageBreakBlock')).toBe(true)
  })

  it('survives the existing save-and-reload process', () => {
    const { content } = threePages()
    const reordered = reorder(2, 0)!
    const document = createDocument('reordered', defaultPagedLayout) as LetterDocument
    document.data = { content: reordered.content, root: {} }
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    } as unknown as Storage
    saveDocument(document, storage, document.updatedAt)
    expect(ids(loadDocument(storage).data.content)).toEqual(ids(reordered.content))
    expect(ids(content)).not.toEqual(ids(reordered.content))
  })
})
