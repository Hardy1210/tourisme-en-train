// Page d'accueil provisoire : remplacée par l'écran Explorer en E11.
import { EtatVide } from '@/components/ui/etat-vide';
import { marque } from '@/config/marque';
import { EnTete } from './en-tete';

export default function Accueil() {
  return (
    <>
      <EnTete />
      <div className="p-4">
        <EtatVide titre="Explorer arrive bientôt" texte={marque.slogan} />
      </div>
    </>
  );
}
