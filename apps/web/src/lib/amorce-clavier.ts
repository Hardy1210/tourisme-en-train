// Clavier prêt dès l'ouverture d'une page plein écran, sur téléphone. iOS n'ouvre le clavier que si un
// champ prend la main PENDANT le toucher ; or le vrai champ n'existe pas encore. Un champ invisible la
// prend donc dans le toucher (`amorcerClavier`), puis la passe au vrai champ une fois la page affichée
// (`passerLaMain`) : le clavier reste ouvert.
import { estGrandEcran } from './ecran';

const ID_AMORCE = 'amorce-clavier';

/** À appeler dans le gestionnaire du toucher qui ouvre la page. Sans effet sur grand écran. */
export function amorcerClavier(): void {
  if (estGrandEcran()) return;
  retirerAmorce();
  const amorce = document.createElement('input');
  amorce.id = ID_AMORCE;
  amorce.type = 'text';
  amorce.setAttribute('aria-hidden', 'true');
  amorce.tabIndex = -1;
  // Texte en 16 px : en dessous, iOS zoome la page.
  amorce.style.cssText =
    'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;pointer-events:none;';
  document.body.appendChild(amorce);
  amorce.focus({ preventScroll: true });
}

/** Donne la main au champ de la page, puis retire l'amorce. */
export function passerLaMain(champ: HTMLElement | null | undefined): void {
  champ?.focus({ preventScroll: true });
  retirerAmorce();
}

export function retirerAmorce(): void {
  document.getElementById(ID_AMORCE)?.remove();
}
