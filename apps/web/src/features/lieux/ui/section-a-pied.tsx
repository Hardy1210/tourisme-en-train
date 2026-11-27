import { Bandeau } from '@/components/ui/bandeau';
import { Bouton } from '@/components/ui/bouton';
import { Squelette } from '@/components/ui/squelette';
import type { LieuResume } from '../schemas';
import { CarteLieuSurPhoto } from './carte-lieu-sur-photo';

type Proprietes = {
  titre: string;
  rayonLibelle: string;
  lieux: readonly LieuResume[] | undefined;
  chargement: boolean;
  erreur: boolean;
  surReessai: () => void;
};

/**
 * « Près de vous » ou « Près de la gare de… » (maquette v6 ; cartes de l'onglet Lieux depuis D125, états B1 à
 * B5) : tous les lieux à pied, sans le tri propre à l'onglet Lieux.
 */
export function SectionAPied({
  titre,
  rayonLibelle,
  lieux,
  chargement,
  erreur,
  surReessai,
}: Proprietes) {
  return (
    <section aria-labelledby="a-pied" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="a-pied" className="text-xl font-bold">
          {titre}
        </h2>
        {/* Sans lieu, la phrase du dessous le dit déjà : pas de doublon (état B5). */}
        {lieux?.length !== 0 && (
          <span className="tabular text-sm whitespace-nowrap text-muted-foreground">
            à moins de {rayonLibelle}
          </span>
        )}
      </div>
      {chargement && (
        <div className="flex gap-3 overflow-hidden" aria-hidden="true">
          <Squelette className="h-(--carte-rangee-hauteur) w-(--carte-rangee-largeur) flex-none rounded-carte" />
          <Squelette className="h-(--carte-rangee-hauteur) w-(--carte-rangee-largeur) flex-none rounded-carte" />
        </div>
      )}
      {erreur && (
        <Bandeau variante="danger" className="justify-between">
          Ces lieux n&apos;ont pas pu être chargés.{' '}
          <Bouton variante="fantome" className="ml-1 h-auto underline" onClick={surReessai}>
            Réessayer
          </Bouton>
        </Bandeau>
      )}
      {lieux?.length === 0 && (
        <p className="rounded-lg bg-surface-sunken px-4 py-3.5 text-md text-muted-foreground">
          Rien pour ces envies à moins de {rayonLibelle} à pied.
        </p>
      )}
      {lieux !== undefined && lieux.length > 0 && (
        <ul className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto scroll-px-4 px-4 pt-0.5 pb-2 lg:mx-0 lg:px-0">
          {lieux.map((lieu) => (
            <CarteLieuSurPhoto key={lieu.cle} lieu={lieu} />
          ))}
        </ul>
      )}
    </section>
  );
}
