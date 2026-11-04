// Page provisoire : la fiche destination arrive en E12 (fiche E11, « À ne pas toucher »).
import Link from 'next/link';
import { Bouton } from '@/components/ui/bouton';
import { EtatVide } from '@/components/ui/etat-vide';

export default function PageDestination() {
  return (
    <div className="p-4 safe-top">
      <EtatVide
        titre="Fiche destination"
        texte="Bientôt ici : les lieux, les trains aller et retour, et les transports sur place."
      >
        <Bouton variante="secondaire" asChild>
          <Link href="/">Retour à Explorer</Link>
        </Bouton>
      </EtatVide>
    </div>
  );
}
