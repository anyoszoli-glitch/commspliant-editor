import type { PageDescriptor } from '../DocumentCanvas/pagination'
import type { Translate } from '../../i18n'

type PageNavigatorProps = {
  pages: PageDescriptor[]
  selectedPageId?: string
  onPageSelect: (pageId: string) => void
  t: Translate
}

export function PageNavigator({ pages, selectedPageId, onPageSelect, t }: PageNavigatorProps) {
  return (
    <div className="document-editor__page-navigator" aria-label={t('pages')}>
      <div className="document-editor__page-navigator-title">{t('pages')}</div>
      {pages.length === 0 ? (
        <p className="document-editor__page-navigator-empty">{t('noPagesYet')}</p>
      ) : (
        <div className="document-editor__page-navigator-list">
          {pages.map((page) => (
            <button
              className="document-editor__page-card"
              data-active={selectedPageId === page.id}
              key={page.id}
              type="button"
              aria-label={t('goToPage', { page: page.number })}
              aria-pressed={selectedPageId === page.id}
              onClick={() => onPageSelect(page.id)}
            >
              <span className="document-editor__page-card-label">{t('page', { page: page.number })}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
