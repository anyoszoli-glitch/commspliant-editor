import { useRef, useState } from 'react'
import type { PageDescriptor } from '../DocumentCanvas/pagination'
import type { Translate } from '../../i18n'

type PageNavigatorProps = {
  pages: PageDescriptor[]
  selectedPageId?: string
  onPageSelect: (pageId: string) => void
  onPageReorder: (fromIndex: number, toIndex: number) => void
  t: Translate
}

export function PageNavigator({ pages, selectedPageId, onPageSelect, onPageReorder, t }: PageNavigatorProps) {
  const [draggingIndex, setDraggingIndex] = useState<number>()
  const [dropIndex, setDropIndex] = useState<number>()
  const draggedRef = useRef(false)

  const clearDrag = () => {
    setDraggingIndex(undefined)
    setDropIndex(undefined)
  }

  return (
    <div className="document-editor__page-navigator" aria-label={t('pages')}>
      <div className="document-editor__page-navigator-title">{t('pages')}</div>
      {pages.length === 0 ? (
        <p className="document-editor__page-navigator-empty">{t('noPagesYet')}</p>
      ) : (
        <div className="document-editor__page-navigator-list">
          {pages.map((page, index) => (
            <button
              className="document-editor__page-card"
              data-active={selectedPageId === page.id}
              data-dragging={draggingIndex === index}
              data-drop-before={dropIndex === index && draggingIndex !== index}
              data-drop-after={dropIndex === index + 1 && draggingIndex !== index}
              key={page.id}
              type="button"
              draggable
              aria-label={t('goToPage', { page: page.number })}
              aria-pressed={selectedPageId === page.id}
              onClick={() => {
                if (draggedRef.current) {
                  draggedRef.current = false
                  return
                }
                onPageSelect(page.id)
              }}
              onDragStart={(event) => {
                draggedRef.current = true
                event.dataTransfer.effectAllowed = 'move'
                setDraggingIndex(index)
                setDropIndex(index)
              }}
              onDragOver={(event) => {
                event.preventDefault()
                if (draggingIndex === undefined) return
                const midpoint = event.currentTarget.getBoundingClientRect().top + event.currentTarget.offsetHeight / 2
                const insertionIndex = event.clientY < midpoint ? index : index + 1
                setDropIndex(insertionIndex)
              }}
              onDrop={(event) => {
                event.preventDefault()
                if (draggingIndex !== undefined && dropIndex !== undefined) {
                  const targetIndex = dropIndex > draggingIndex ? dropIndex - 1 : dropIndex
                  if (targetIndex !== draggingIndex) onPageReorder(draggingIndex, targetIndex)
                }
                clearDrag()
              }}
              onDragEnd={() => {
                clearDrag()
                window.setTimeout(() => {
                  draggedRef.current = false
                }, 0)
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowUp' && index > 0) {
                  event.preventDefault()
                  onPageReorder(index, index - 1)
                }
                if (event.key === 'ArrowDown' && index < pages.length - 1) {
                  event.preventDefault()
                  onPageReorder(index, index + 1)
                }
              }}
            >
              <span className="document-editor__page-card-label">{t('page', { page: page.number })}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
