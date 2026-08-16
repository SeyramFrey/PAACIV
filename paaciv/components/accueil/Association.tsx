import { getLocale } from 'next-intl/server'
import { texte, renseigne, type Textes } from '@/lib/data/contenu-site'
import { Compteurs } from '@/components/accueil/Compteurs'
import { CartesSoutien } from '@/components/accueil/CartesSoutien'
import { comptesParEtat } from '@/lib/data/accueil'
import type { Chiffres } from '@/lib/data/accueil'

export async function Association({
  textes,
  chiffres,
  montant,
}: {
  textes: Textes
  chiffres: Chiffres
  montant: string
}) {
  const locale = await getLocale()
  // Décidé côté SERVEUR, comme les gardes `renseigne()` ci-dessous : les deux
  // cartes d'état ne franchissent la frontière que si leur liste existe.
  const comptes = await comptesParEtat()
  const surtitre = texte(textes, 'association_surtitre', locale)
  const titre = texte(textes, 'association_titre', locale)
  const intro = texte(textes, 'association_texte', locale)
  const enDangerTexte = texte(textes, 'soutien_en_danger_texte', locale)
  const demoliTexte = texte(textes, 'soutien_demoli_texte', locale)
  const adhesionAvantages = texte(textes, 'soutien_adhesion_avantages', locale)
  const donTexte = texte(textes, 'soutien_don_usage', locale)

  // Garde côté SERVEUR, pas dans `CartesSoutien` (composant client) : une
  // valeur brute passée à un composant client, même filtrée à l'affichage
  // par `renseigne()` en aval, reste sérialisée telle quelle dans le HTML —
  // « À COMPLÉTER — … » finit dans le source de chaque page. `null` ne
  // franchit jamais la frontière.
  const montantSur = renseigne(montant) ? montant : null
  const enDangerTexteSur = renseigne(enDangerTexte) ? enDangerTexte : null
  const demoliTexteSur = renseigne(demoliTexte) ? demoliTexte : null
  const adhesionAvantagesSur = renseigne(adhesionAvantages) ? adhesionAvantages : null
  const donTexteSur = renseigne(donTexte) ? donTexte : null

  return (
    <section
      id="association"
      className="pt-[clamp(90px,10vw,160px)] pr-[clamp(20px,5vw,80px)] pb-[clamp(50px,6vw,90px)] pl-[clamp(20px,5vw,80px)]"
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="mx-auto max-w-[860px] text-center">
          <p
            data-rv=""
            className="mb-5 text-[11px] font-medium uppercase leading-none tracking-[0.3em]"
            style={{ color: 'var(--ocre)' }}
          >
            {surtitre}
          </p>
          <h2
            data-rv=""
            data-d="80"
            className="m-0 text-balance font-serif text-[clamp(38px,5.6vw,86px)] leading-none tracking-[-0.02em]"
            style={{ color: 'var(--ink)' }}
          >
            {titre}
          </h2>
          <p
            data-rv=""
            data-d="160"
            className="mx-auto mt-[26px] max-w-[660px] text-[17px] font-light leading-[1.8]"
            style={{ color: 'var(--soft)' }}
          >
            {intro}
          </p>
          <div data-rv="" data-d="220" className="mt-[52px]">
            <Compteurs chiffres={chiffres} />
          </div>
        </div>

        <CartesSoutien
          montant={montantSur}
          enDangerTexte={enDangerTexteSur}
          demoliTexte={demoliTexteSur}
          adhesionAvantages={adhesionAvantagesSur}
          donTexte={donTexteSur}
          nbEnDanger={comptes.en_danger ?? 0}
          nbDemoli={comptes.demoli ?? 0}
        />
      </div>
    </section>
  )
}
