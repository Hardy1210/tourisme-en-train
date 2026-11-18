// Horloge des tests d'intégration et des parcours : « maintenant » part du 19/11/2026 à 10 h (Paris)
// et avance normalement. Sans elle, le résultat dépend du jour où l'on lance les tests : le 18/11/2026,
// date d'hiver de l'échantillon (db/echantillon/), était « aujourd'hui », et les trains déjà partis
// disparaissaient (12 échecs). Le 19/11 n'est pas un jour de circulation de l'échantillon : ses deux
// dates (15/07 et 18/11) restent toujours « un autre jour ». Le code de l'application ne change pas.
// Chargée par `setupFiles` (vitest.integration.config.ts) et par `node --import` (playwright.config.ts).

const DEPART = Date.parse('2026-11-19T09:00:00Z');
const decalage = DEPART - Date.now();
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
