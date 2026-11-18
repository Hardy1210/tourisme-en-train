// Horloge des tests d'intégration et du serveur des parcours : « maintenant » part de `INSTANT_DE_TEST`
// (instant-de-test.ts, transmis par la configuration) et avance normalement. Sans elle, le 18/11/2026, date
// d'hiver de l'échantillon, était « aujourd'hui » et les trains déjà partis disparaissaient (12 échecs).
// Le code de l'application ne change pas. Chargée par `setupFiles` (vitest.integration.config.ts) et par
// `node --import` (playwright.config.ts) ; le navigateur des parcours est réglé par e2e/test.ts.

const instant = process.env.INSTANT_DE_TEST;
if (!instant) throw new Error('INSTANT_DE_TEST manquant : voir apps/web/tests/instant-de-test.ts.');

const decalage = Date.parse(instant) - Date.now();
const VraieDate = Date;

class DateDeTest extends VraieDate {
  constructor(...valeurs: ConstructorParameters<typeof Date> | []) {
    if (valeurs.length === 0) super(VraieDate.now() + decalage);
    else super(...(valeurs as ConstructorParameters<typeof Date>));
  }

  static override now(): number {
    return VraieDate.now() + decalage;
  }
}

globalThis.Date = DateDeTest as DateConstructor;
