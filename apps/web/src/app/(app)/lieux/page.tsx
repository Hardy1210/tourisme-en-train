// Page provisoire : l'écran Lieux arrivera avec sa route de données réelles (D054).
import type { Metadata } from 'next';
import { EnTete } from '@/components/ui/en-tete';
import { EtatVide } from '@/components/ui/etat-vide';

export const metadata: Metadata = { title: 'Lieux' };

export default function PageLieux() {
  return (
    <>
      <EnTete surHero />
      <div className="p-4">
        <EtatVide
          titre="Lieux à visiter"
          texte="Bientôt ici : les lieux à pied depuis une gare, en train direct depuis la vôtre."
        />
      </div>
    </>
  );
}
