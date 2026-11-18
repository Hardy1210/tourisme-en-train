// `test` des parcours : celui de Playwright, avec le navigateur réglé sur `INSTANT_DE_TEST`, le même instant
// que le serveur (horloge-de-test.ts). L'heure est figée, les minuteries tournent (`setFixedTime`).
// Les parcours importent d'ici, jamais `test` de '@playwright/test' directement.
import { test as base } from '@playwright/test';

import { INSTANT_DE_TEST } from '../instant-de-test';

export * from '@playwright/test';

export const test = base.extend<{ horloge: void }>({
  horloge: [
    async ({ context }, utiliser) => {
      await context.clock.setFixedTime(INSTANT_DE_TEST);
      await utiliser();
    },
    { auto: true },
  ],
});
