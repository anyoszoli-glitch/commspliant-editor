import { useTranslation } from '../../i18n'

export function DividerBlock() {
  const t = useTranslation()
  return <hr className="commspliant-divider-block" aria-label={t('divider')} />
}
