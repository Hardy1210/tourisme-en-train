// Reconnaît l'appareil pour choisir le bon guidage de localisation (D083). Fonction pure : la signature du
// navigateur est lue par l'écran, jamais envoyée au serveur ni enregistrée.
import type { Appareil } from './contenu-guidage';

type Indices = {
  /** `navigator.userAgent`. */
  userAgent: string;
  /** Application installée sur l'écran d'accueil (`display-mode: standalone`). */
  installee: boolean;
  /** Écran tactile (`navigator.maxTouchPoints > 1`) : un iPad se présente parfois comme un Mac. */
  tactile: boolean;
};

/** Navigateurs qui citent « Chrome » ou « Safari » dans leur signature sans en être. */
const AUTRES_NAVIGATEURS = /SamsungBrowser|Firefox|FxiOS|EdgA|EdgiOS|OPR|OPiOS|YaBrowser|; wv\)/;

export function reconnaitreAppareil({ userAgent, installee, tactile }: Indices): Appareil {
  const iphone = /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && tactile);
  if (iphone) {
    if (AUTRES_NAVIGATEURS.test(userAgent)) return 'telephone_autre';
    if (/CriOS/.test(userAgent)) return 'iphone_chrome';
    return installee ? 'iphone_installee' : 'iphone_safari';
  }
  if (/Android/.test(userAgent)) {
    if (AUTRES_NAVIGATEURS.test(userAgent) || !/Chrome\//.test(userAgent)) return 'telephone_autre';
    return installee ? 'android_installee' : 'android_chrome';
  }
  if (/Mobile|Tablet/.test(userAgent)) return 'telephone_autre';
  if (/Windows NT|Macintosh|X11|CrOS/.test(userAgent)) return 'ordinateur';
  return 'inconnu';
}
