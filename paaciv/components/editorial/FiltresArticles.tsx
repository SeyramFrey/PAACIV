import { Link } from '@/i18n/navigation'
import type { CategorieArticle } from '@/lib/data/articles'

export function FiltresArticles({
  categories,
  actif,
  locale,
  labelToutes,
}: {
  categories: CategorieArticle[]
  actif?: string
  locale: string
  labelToutes: string
}) {
  const nom = (c: CategorieArticle) => (locale === 'en' ? c.nom_en || c.nom_fr : c.nom_fr)
  const classe = (estActif: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm transition ${
      estActif
        ? 'border-or bg-or text-encre'
        : 'border-encre/20 bg-white text-encre/70 hover:border-or'
    }`

  return (
    <nav aria-label={labelToutes} className="flex flex-wrap gap-2">
      <Link href="/articles" className={classe(!actif)}>
        {labelToutes}
      </Link>
      {categories.map((c) => (
        <Link key={c.id} href={`/articles?categorie=${c.id}`} className={classe(actif === c.id)}>
          {nom(c)}
        </Link>
      ))}
    </nav>
  )
}
