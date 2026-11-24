// Écran de lancement (D112) : logo et accroche sur le fond de la marque, à chaque ouverture de
// l'application. Sans JavaScript : il est dans le HTML de départ, couvre la page pendant que
// l'application démarre, puis s'efface seul (animation CSS, durées --lancement-* de globals.css).
// La mise en page (app) ne se recharge pas d'un écran à l'autre : il ne se rejoue pas en naviguant.
import { marque } from '@/config/marque';
import { parametres } from '@/config/parametres';
import { Logo } from './logo';

export function EcranLancement() {
  return (
    // Décor seulement : caché aux lecteurs d'écran, qui lisent déjà la page en dessous.
    <div aria-hidden="true" data-ecran-lancement="" className="ecran-lancement">
      <div className="ecran-lancement-contenu flex flex-col items-center gap-4.5 px-4 text-center">
        <Logo surHero taille="grande" />
        <p className="text-lg leading-normal font-medium tracking-wide text-hero-muted">
          {marque.accroche}
          <br />
          {parametres.region.nom}
        </p>
      </div>
    </div>
  );
}
