// `test` des parcours : celui de Playwright, avec le navigateur réglé sur `INSTANT_DE_TEST`, le même instant
// que le serveur (horloge-de-test.ts). L'heure est figée, les minuteries tournent (`setFixedTime`).
// L'écran de lancement (D112) est caché : il couvrirait chaque page pendant ses 2 s. Seul le parcours qui
// le vérifie le garde (`test.use({ ecranLancement: true })`).
// Les parcours importent d'ici, jamais `test` de '@playwright/test' directement.
import { test as base } from '@playwright/test';

import { INSTANT_DE_TEST } from '../instant-de-test';

export * from '@playwright/test';

export const test = base.extend<{ horloge: void; ecranLancement: boolean; lancement: void }>({
  horloge: [
    async ({ context }, utiliser) => {
      await context.clock.setFixedTime(INSTANT_DE_TEST);
      await utiliser();
    },
    { auto: true },
  ],
  ecranLancement: [false, { option: true }],
  lancement: [
    async ({ context, ecranLancement }, utiliser) => {
      // Une feuille de style ajoutée au document avant toute la page : rien à changer dans l'application.
      if (!ecranLancement) {
        await context.addInitScript(() => {
          const feuille = new CSSStyleSheet();
          feuille.replaceSync('[data-ecran-lancement] { display: none !important; }');
          document.adoptedStyleSheets = [...document.adoptedStyleSheets, feuille];
        });
      }
      await utiliser();
    },
    { auto: true },
  ],
});
