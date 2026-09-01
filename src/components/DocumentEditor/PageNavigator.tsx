import type { PageDescriptor } from '../DocumentCanvas/pagination'

type PageNavigatorProps = {
  pages: PageDescriptor[]
  selectedPageId?: string
  onPageSelect: (pageId: string) => void
}

export function PageNavigator({ pages, selectedPageId, onPageSelect }: PageNavigatorProps) {
  return (
    <div className="document-editor__page-navigator" aria-label="Document pages">
      <div className="document-editor__page-navigator-title">Pages</div>
      {pages.length === 0 ? (
        <p className="document-editor__page-navigator-empty">No pages yet</p>
      ) : (
        <div className="document-editor__page-navigator-list">
          {pages.map((page) => (
            <button
              className="document-editor__page-card"
              data-active={selectedPageId === page.id}
              key={page.id}
              type="button"
              aria-label={`Go to page ${page.number}`}
              aria-pressed={selectedPageId === page.id}
              onClick={() => onPageSelect(page.id)}
            >
              <span className="document-editor__page-card-label">Page {page.number}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
