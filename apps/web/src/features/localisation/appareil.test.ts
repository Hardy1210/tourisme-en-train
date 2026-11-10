// Reconnaissance de l'appareil pour le guidage de la localisation (D083). Signatures réelles de navigateurs.
import { describe, expect, it } from 'vitest';

import { reconnaitreAppareil } from './appareil';
import { APPAREILS, GUIDES_LOCALISATION } from './contenu-guidage';

const UA = {
  iphoneSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  iphoneChrome:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1',
  iphoneFirefox:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/132.0 Mobile/15E148 Safari/605.1.15',
  /** iPad en « site pour ordinateur » : se présente comme un Mac, mais il est tactile. */
  ipadBureau:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
  androidChrome:
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
  androidSamsung:
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36',
  androidFirefox: 'Mozilla/5.0 (Android 14; Mobile; rv:132.0) Gecko/132.0 Firefox/132.0',
  androidEdge:
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 EdgA/131.0.0.0',
  windowsChrome:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  linuxFirefox: 'Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0',
};

const appareil = (userAgent: string, autres: { installee?: boolean; tactile?: boolean } = {}) =>
  reconnaitreAppareil({ userAgent, installee: false, tactile: false, ...autres });

describe('reconnaitreAppareil : iPhone', () => {
  it('Safari → iphone_safari ; la même, installée sur l’écran d’accueil → iphone_installee', () => {
    expect(appareil(UA.iphoneSafari, { tactile: true })).toBe('iphone_safari');
    expect(appareil(UA.iphoneSafari, { tactile: true, installee: true })).toBe('iphone_installee');
  });
  it('Chrome (CriOS) → iphone_chrome ; Firefox (FxiOS) → telephone_autre', () => {
    expect(appareil(UA.iphoneChrome, { tactile: true })).toBe('iphone_chrome');
    expect(appareil(UA.iphoneFirefox, { tactile: true })).toBe('telephone_autre');
  });
  it('iPad qui se présente comme un Mac : tactile → iphone_safari, non tactile (vrai Mac) → ordinateur', () => {
    expect(appareil(UA.ipadBureau, { tactile: true })).toBe('iphone_safari');
    expect(appareil(UA.ipadBureau, { tactile: false })).toBe('ordinateur');
  });
});

describe('reconnaitreAppareil : Android', () => {
  it('Chrome → android_chrome ; installée → android_installee', () => {
    expect(appareil(UA.androidChrome, { tactile: true })).toBe('android_chrome');
    expect(appareil(UA.androidChrome, { tactile: true, installee: true })).toBe(
      'android_installee',
    );
  });
  it('Samsung Internet, Firefox, Edge → telephone_autre, même s’ils citent « Chrome »', () => {
    expect(appareil(UA.androidSamsung, { tactile: true })).toBe('telephone_autre');
    expect(appareil(UA.androidFirefox, { tactile: true })).toBe('telephone_autre');
    expect(appareil(UA.androidEdge, { tactile: true })).toBe('telephone_autre');
  });
  it('Samsung Internet installé → telephone_autre (le chemin Chrome ne s’applique pas)', () => {
    expect(appareil(UA.androidSamsung, { tactile: true, installee: true })).toBe('telephone_autre');
  });
});

describe('reconnaitreAppareil : ordinateur et inconnu', () => {
  it('Windows et Linux → ordinateur', () => {
    expect(appareil(UA.windowsChrome)).toBe('ordinateur');
    expect(appareil(UA.linuxFirefox)).toBe('ordinateur');
  });
  it('signature vide ou inconnue → inconnu, jamais ordinateur', () => {
    expect(appareil('')).toBe('inconnu');
    expect(appareil('curl/8.5.0')).toBe('inconnu');
  });
});

describe('textes du guidage (contenu-guidage.ts)', () => {
  it('chaque appareil a un titre et au moins une étape', () => {
    for (const cle of APPAREILS) {
      expect(GUIDES_LOCALISATION[cle].titre.length).toBeGreaterThan(0);
      expect(GUIDES_LOCALISATION[cle].etapes.length).toBeGreaterThan(0);
    }
  });
  it('appareil inconnu : texte générique, différent de celui de l’ordinateur', () => {
    expect(GUIDES_LOCALISATION.inconnu).not.toEqual(GUIDES_LOCALISATION.ordinateur);
  });
  it('Android : jamais « en haut » pour la barre d’adresse (elle peut être en bas)', () => {
    const textes = [GUIDES_LOCALISATION.android_chrome, GUIDES_LOCALISATION.android_installee]
      .flatMap((g) => g.etapes)
      .join(' ');
    expect(textes).toContain('à gauche de l’adresse');
    expect(textes).not.toMatch(/en haut de l.adresse|barre d.adresse en haut/);
  });
  it('Android installée : chemin officiel de Google (Paramètres des sites › Position)', () => {
    expect(GUIDES_LOCALISATION.android_installee.etapes.join(' ')).toContain(
      'Paramètres des sites › Position',
    );
  });
});
