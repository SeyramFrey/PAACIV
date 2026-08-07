'use client'

import { clsx } from 'clsx'
import { useLocale } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

const labels: Record<(typeof routing.locales)[number], string> = {
  fr: 'FR',
  en: 'EN',
}

export function LanguageSwitcher() {
  const pathname = usePathname()
  const activeLocale = useLocale()

  return (
    <nav aria-label="Changer de langue" className="flex items-center gap-1 text-sm font-semibold">
      {routing.locales.map((locale) => (
        <Link
          key={locale}
          href={pathname}
          locale={locale}
          aria-current={locale === activeLocale ? 'true' : undefined}
          className={clsx(
            'rounded-full px-3 py-1 transition',
            locale === activeLocale
              ? 'bg-or text-encre'
              : 'text-brun hover:bg-creme2',
          )}
        >
          {labels[locale]}
        </Link>
      ))}
    </nav>
  )
}
